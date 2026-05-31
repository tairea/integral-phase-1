# ITC — Integral Time Credits Schema (Candidate)

The devguide §4.3 defines two records — **`ITCAccount`** and **`ITCLedgerEntry`** — plus
the `LaborEvent` that COS owns but ITC consumes. This spec keeps those as the active
Phase-2 schema and preserves the white paper's two structural boundaries that §4.3
explicitly flags:

1. **Raw vs. weighted labor.** White-paper `LaborEvent` (raw hours) is value-neutral
   until ITC Module 2 produces a `WeightedLaborRecord`. The devguide consolidates both
   into one record but **the boundary must survive in the field structure** (§4.3).
2. **Non-transferability is architectural, not policy.** `transferable` exists as a
   *named constraint* fixed to `false`, never a toggle (§4.3).

**Minimal build (§3.3):** labor capture → weighting → credit issuance → exponential
decay (half-life + grace) → access extinguishment → append-only ledger. Federated
calibration, equivalence bands, forecasting, and sophisticated need-adjustment are
deferred — **but decay and non-transferability are present from the first credit** (§3.3).

---

## Record: `LaborEvent` *(owned by COS, consumed by ITC — the COS→ITC contract)*

The §4.3 consolidated record, annotated. Raw-capture fields are populated by COS;
weighting-output fields are populated by ITC Module 2 (the preserved boundary).

```
LaborEvent {
    event_id            // [WP LaborEvent.id]
    timestamp           // [WP]
    participant_id      // [WP member_id] node-id:participant-id
    coop_id             // [WP] the co-op the labor occurred in
    governance_scope    // [R1-prop] coop | node | network — recursion level this contribution
                        //   is attributed to (default coop; rolls up to node)
    task_ref            // [WP task_id] ref to COS Task
    production_plan_ref // [DG] ref to COS ProductionPlan
    design_ref          // [DG] ref to OAD CertifiedDesign + version
    node_id             // [FED]

    // --- raw capture (value-neutral) — COS / ITC Module 1 ---
    hours               // [WP] actual hours as reported
    hours_verified      // [DG] hours confirmed by peer verification (Phase-2 convenience)
    skill_tier          // [WP] SkillTier (shared enum)
    context             // [WP] dict — weighting signals {urgency_score, eco_sensitive,
                        //   scarcity_factor, ...}  ([WP] primary input to Module 2 — do not omit)
    verification_status // [DG] pending | verified | disputed
    verified_by         // [WP] list<node-id:participant-id>
    verified_at         // [WP]

    // --- weighting outputs — ITC Module 2 (WP: WeightedLaborRecord, consolidated here) ---
    itc_weight_multiplier   // [WP] final bounded multiplier (policy bounds e.g. 0.5–2.0)
    itc_weight_breakdown    // [WP breakdown] dict {skill_factor, context_factor, ...}
    itc_weighted_hours      // [WP weighted_hours] hours * multiplier
    itc_credits_issued      // [WP] credits generated

    ecological_flag     // [WP] inherited from the design's production step
    ecological_detail   // [DEFERRED] detailed ecological attribution
    federation_hash     // [FED][DEFERRED]
}
```
> **Boundary preservation:** the raw block (`hours`, `context`) must remain
> reconstructable independently of the weighting block (`itc_weighted_hours`). FRS audits
> the `itc_weighted_hours : hours` ratio over time to detect weighting drift (§4.3).

## Record: `ITCAccount` *(owned by ITC, consumed by FRS)*

The §4.3 record verbatim-aligned. Carries an **inline decay snapshot** that mirrors the
authoritative `DecayRule` PolicyRecord held by CDS (spec 01).

```
ITCAccount {
    account_id          // [WP]
    participant_id      // [WP] node-id:participant-id
    node_id             // [FED]
    balance             // [WP] current balance
    total_earned        // [WP] lifetime issued
    total_redeemed      // [WP] lifetime extinguished via access
    total_decayed       // [WP] lifetime lost to decay

    active_decay_rule_id    // [WP] ref to CDS-ratified DecayRule in effect
    last_decay_applied_at   // [WP]
    last_contribution_at    // [DG] most recent verified labor (decay grace logic — avoids ledger scan)
    last_access_at          // [DG] most recent redemption (FRS access monitoring)

    // inline DecayRule snapshot (authoritative copy in CDS PolicyRecord — keep in sync, OQ-04)
    decay_half_life_days        // [WP]
    decay_inactivity_grace_days // [WP]
    decay_min_balance_protected // [WP]
    decay_max_annual_fraction   // [WP]

    need_adjustment_active  // [WP] bool — need-based override active?
    need_adjustment_ref     // [WP] ref to CDS policy authorizing it

    transferable        // [WP] ALWAYS false — named architectural constraint, never a toggle
    federation_scope    // [FED] local | [DEFERRED cross-node recognition scope]
    last_updated_at     // [WP]
}
```
> **Recursion propagation (R1) — deliberate exception.** `ITCAccount` carries **no**
> `governance_scope`: a participant's balance is a *single, node-level, non-transferable* quantity —
> they do not hold separate per-co-op balances (that would be a transferable sub-ledger, violating
> the non-transferability principle). Co-op-level contribution visibility — which the recursive
> co-op CDS needs — is **derived** by rolling up `ITCLedgerEntry` records on
> `governance_scope` + `coop_id`, not by partitioning the account. This keeps recursion as a *view*
> over the ledger, not a fragmentation of the balance. See OQ-16.

## Record: `ITCLedgerEntry` *(owned by ITC, consumed by FRS — append-only)*

The audit backbone. `entry_type` uses the **white-paper canonical enum** (§4.3: "use
exactly"). Labor entries carry both `raw_hours` and `weighted_credits` so FRS audits
weighting without reconstructing from two records.

```
ITCLedgerEntry {
    entry_id            // [WP]
    timestamp           // [WP]
    participant_id      // [WP] node-id:participant-id (nullable for system-wide entries)
    node_id             // [FED]
    governance_scope    // [R1-prop] coop | node | network — level this entry is attributed to
    coop_id             // [R1-prop] nullable — the co-op, when governance_scope=coop

    entry_type          // [WP] LedgerEntryType enum (10 values — see enums spec)
    amount              // [WP] net credit change (+issued/restored, −deductions);
                        //   for labor entries == weighted_credits
    raw_hours           // [WP] unweighted hours — labor entries only, else null
    weighted_credits    // [WP] post-weighting credits — labor entries only, else null
    balance_after       // [WP] balance snapshot after this entry

    related_ids         // [WP] dict {event_id, item_id, coop_id, account_id, policy_snapshot_id, ...}
    details             // [WP] JSON payload, entry-type-specific
    authorized_by       // [WP] participant or system that authorized
    notes               // [WP]

    prev_hash           // [WP][DEFERRED] hash chain (cryptographic chaining is later policy)
    entry_hash          // [WP][DEFERRED]
}
```

---

## Record: `AccessValuation` *(white paper — the formal replacement for "price")*

Not in §4.3 but central: the computed access obligation for a good. Produced at
certification/quote time; referenced by COS distribution and ITC redemption. **Required
for the §1.3 proof-of-concept condition that credits are *extinguished* on access.**

```
AccessValuation {
    item_id             // [WP] good/service instance
    design_version_id   // [WP] OAD CertifiedDesign + version
    node_id             // [FED]
    base_weighted_labor_hours   // [WP] from OAD labor decomposition
    eco_burden_adjustment       // [WP] hours-equiv from ecological coefficients [partly DEFERRED]
    material_scarcity_adjustment// [WP] hours-equiv from scarcity [partly DEFERRED]
    repairability_credit        // [WP] negative hours-equiv [DEFERRED]
    longevity_credit            // [WP] negative hours-equiv [DEFERRED]
    final_itc_cost      // [WP] final obligation in ITCs (fairness-bounded)
    computed_at         // [WP]
    valid_until         // [WP] nullable
    policy_snapshot_id  // [WP] which CDS policy governed this valuation
    rationale           // [WP] transparent breakdown dict
}
```

## Record: `RedemptionRecord` *(white paper — the extinguishment event)*

```
RedemptionRecord {
    redemption_id       // [WP id]
    participant_id      // [WP member_id] node-id:participant-id
    node_id             // [FED]
    item_id             // [WP]
    itc_spent           // [WP] credits deducted
    redemption_time     // [WP]
    redemption_type     // [WP] AccessMode (shared with COS): permanent_acquisition |
                        //   shared_use_lock | service_use
    expires_at          // [WP] nullable — locks / timed access
    access_valuation_snapshot // [WP] embedded AccessValuation for audit
}
```
> `redemption_type=permanent_acquisition` extinguishes credits permanently; this is the
> §1.3 PoC condition. `shared_use_lock` returns them on release. The enum is **shared
> with COS `COSDistributionRecord.access_mode`** — same event, two sides.

## Record: `EthicsEvent` *(white paper Module 7 — anti-coercion detection)*

Detection-only; escalates to CDS via FRS. Severity reconciled to the shared 5-value
`Severity` (OQ-07).

```
EthicsEvent {
    event_id  node_id  timestamp
    severity            // [WP→shared Severity] (WP used info|warning|critical — see OQ-07)
    description
    involved_member_ids // list<node-id:participant-id>
    involved_coop_ids   // list
    rule_violations     // [WP] list<str> (proto_market_exchange, coercion_pattern,
                        //   queue_bias, decay_evasion, role_monopoly)
    status              // [WP] EthicsStatus: open | under_review | resolved
    resolution_notes
}
```

---

## Policy snapshots & deferred federation objects (schema present)

| Record | Status | Note |
|--------|--------|------|
| `ITCPolicySnapshot` / `CDSPolicySnapshot` | active (read-only mirror of CDS PolicyRecord) | ITC never authors policy; §4.4 `get_itc_policy_snapshot` |
| `WeightingPolicy` | active | base weights by skill, context weights, min/max multiplier bounds |
| `DecayRule` | active | **authoritative copy in CDS** (spec 01); ITCAccount holds a snapshot |
| `EquivalenceBand`, `NodeEquivalenceProfile`, `NodeEquivalenceRule` | `[DEFERRED]` | cross-node calibration (Module 6) |
| `LaborDemandForecast`, `LaborDemandSignal` | `[DEFERRED]` | forecasting (Module 4) — soft hints, never compels |
| `PolicyProposal` | `[DEFERRED]` | Module 9 auto-proposals to CDS |

> **Provenance note:** the white paper splits `LaborEvent` (raw) and
> `WeightedLaborRecord` (weighted) as distinct objects; this Phase-2 schema consolidates
> them into one `LaborEvent` record per §4.3, with the weighting-output fields clearly
> demarcated so the un-consolidation is mechanical. See OQ-03.
