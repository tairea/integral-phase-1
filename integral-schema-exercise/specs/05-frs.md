# FRS — Feedback & Review System Schema (Candidate)

DEVGUIDE §4.3 defines three records: **`FRSSignalPacket`** (a Phase-2 construction that
adds human-readable summaries on top of the white paper's abstract `SignalPacket`),
**`DiagnosticFinding`**, and **`Recommendation`**. This spec keeps those active and
restores the white paper's `SignalEnvelope` (the atomic signal the devguide flattened)
plus the `ConstraintModel` that `Recommendation.constraint_model_ref` points at.

**Minimal build (§3.5 / §1.3 PoC):** read real data from COS and ITC, produce a
human-readable summary packet, emit at least one diagnostic finding + recommendation, and
**submit it into CDS as a signal — closing the loop**. Scenario/constraint modeling,
longitudinal memory, sensemaking artifacts, and federated intelligence are deferred.

**Structural boundary (§2.1, §4.4):** FRS is **advisory only**. It flags; it never acts.
`Recommendation.status` and the routing fields encode this — a recommendation becomes
actionable only when the receiving system acts through its own process, or CDS accepts it
as a governance issue. This is enforced in the schema, not just policy.

---

## Record: `SignalEnvelope` *(active — atomic signal, restored from white paper)*

The devguide flattened envelopes into the packet's summary blocks. Restoring the atomic
unit keeps the white paper's `SignalEnvelope → SignalPacket` pipeline intact, which
matters for federation (envelopes carry source/domain/hash) and for FRS-2 traceability.

```
SignalEnvelope {
    envelope_id         // [WP id]
    source              // [WP] SignalSource: COS|OAD|ITC|CDS|ECO|FED
    domain              // [WP] SignalDomain (12 values — see enums)
    node_id             // [FED]
    governance_scope    // [R1-prop] coop | node | network — recursion level this signal pertains to
                        //   (routes the eventual finding to the coop vs node CDS)
    federation_id       // [FED] nullable — multi-node context
    created_at          // [WP]
    observed_at         // [WP] nullable — phenomenon time if ≠ created_at
    tags                // [WP] list<SemanticTag{key,value,weight}>
    metrics             // [WP] list<Metric{name,value,unit,quality}>
    notes               // [WP]
    schema_version      // [WP] default "v1"
    upstream_ref_ids    // [WP] dict {cos_plan_id, itc_ledger_entry_id, ...}
    prev_hash           // [WP][DEFERRED] tamper-evident chain
    entry_hash          // [WP][DEFERRED]
}
```

## Record: `FRSSignalPacket` *(active — §4.3, the FRS→CDS contract)*

The §4.3 record verbatim-aligned: a time-windowed bundle with human-readable summary
sections so CDS can deliberate without querying raw envelopes. The summaries are a
devguide extension over the white paper's abstract bundle.

```
FRSSignalPacket {
    packet_id  node_id  period_start  period_end  generated_at  generated_by
    prev_packet_ref     // [DG] prior packet for comparison
    packet_hash         // [WP][DEFERRED] chaining hash
    envelopes           // [WP] list<SignalEnvelope> — the raw bundle (restored)

    labor_summary       // [DG] {total_events, total_hours, total_weighted_credits,
                        //   total_hours_verified, verification_rate, events_by_skill_tier, overrun_tasks}
    materials_summary   // [DG] {total_consumption_events, consumption_by_material,
                        //   ecological_flag_counts, external_dependency_count, low_inventory_flags}
    itc_summary         // [DG] {total_credits_issued, total_decay_applied,
                        //   total_access_extinguished, active_participant_count,
                        //   balance_distribution[DEFERRED], need_adjustments_active}
    qa_summary          // [DG] {total_qa_events, failures, failure_rate, failures_by_design}
    oad_summary         // [DG] {new_certifications, design_version_updates,
                        //   ecological_assessment_changes, certification_revocations,
                        //   coefficient_recalibrations_pending}
    cds_summary         // [DG] {decisions_dispatched, policies_updated,
                        //   open_governance_issues, decision_records_merged}
                        //   — closes the GOVERNANCE-evaluation loop (CDS→FRS), distinct
                        //   from the operational loop. Without it FRS can't tell if
                        //   governance responses are working.

    findings            // [WP] list<DiagnosticFinding>
    recommendations     // [WP] list<Recommendation>
    cds_submission_ref  // [DG] ref to the CDS Issue created from this packet (the loop closing)
}
```

## Record: `DiagnosticFinding` *(active — §4.3, white-paper canonical)*

```
DiagnosticFinding {
    finding_id  packet_ref  node_id  detected_at
    finding_type        // [WP] FindingType (11 canonical values — see enums)
    severity            // [WP] Severity (info|low|moderate|high|critical)
    scope               // [WP] Scope (local|node|regional|federation) — BLAST RADIUS; drives routing/escalation, do not omit
                        //   [R1-prop] maps to governance_scope of the CDS that should act:
                        //   local→coop, node→node, regional|federation→network (see enums OQ-16).
                        //   FRS keeps `scope` (the escalation INPUT); it does not duplicate governance_scope.
    persistence         // [WP] Persistence (transient|emerging|persistent|structural)
    confidence          // [WP] Confidence (low|medium|high)
    summary             // [WP] one-sentence plain language
    rationale           // [WP] why this is a finding
    evidence_refs       // [WP] list — supporting records (packet/envelope/ledger ids)
    indicators          // [WP] dict<str,float> — metrics that triggered it
    target_system       // [WP] TargetSystem: CDS|OAD|COS|ITC|FED
    requires_cds        // [WP] bool — CDS deliberation required?
}
```

## Record: `Recommendation` *(active — §4.3, white-paper canonical)*

Advisory, non-executive. `status` lifecycle encodes the "flags, never acts" boundary.

```
Recommendation {
    recommendation_id  finding_ref  node_id  created_at
    constraint_model_ref // [WP] ref to ConstraintModel that informed it — [DEFERRED] until modeling ships
    target_system       // [WP] TargetSystem
    recommendation_type // [WP] RecommendationType (10 canonical values — see enums)
    severity            // [WP] inherited from finding
    scope               // [WP] inherited from finding
    confidence          // [WP]
    summary             // [WP] suggested action, plain language
    rationale           // [WP]
    payload             // [WP] dict — target-system-specific structured detail
    status              // [WP] pending | acknowledged | accepted | rejected | superseded
    response_ref        // [WP] ref to the action taken in response, if any
}
```
> **Boundary in the schema:** a `Recommendation` with `status=pending` has no operational
> effect. Only the receiving system transitions it to `accepted` and links a
> `response_ref` through *its own* process — or, for CDS targets, when it is promoted to a
> governance Issue. FRS can set `pending`; it cannot set `accepted`. See OQ-11.

---

## Deferred records (schema present, unpopulated in minimal build)

| Record | Module | Status | Note |
|--------|--------|--------|------|
| `SemanticTag`, `Metric` | 1 | active sub-objects | used inside SignalEnvelope |
| `ConstraintModel` + `Constraint`, `ScenarioAssumption`, `ScenarioResult` | 3 | `[DEFERRED]` | scenario/counterfactual modeling; `Recommendation.constraint_model_ref` targets this |
| `RoutedSignal` | 4 | `[DEFERRED]` | dispatch metadata once APIs exist |
| `SensemakingArtifact` | 5 | `[DEFERRED]` | dashboards / risk briefs for deliberation |
| `MemoryRecord` | 6 | `[DEFERRED]` | longitudinal institutional memory |
| `FederatedSignalBundle`, `FederatedInsight`, `CrossNodePattern` | 7 | `[DEFERRED][FED]` | inter-node intelligence |
| `DiagnosticThresholds`, `RecommendationPolicy` | 2/4 | active config (CDS-authored, FRS-read) | reference CDS PolicyRecord |

### `ConstraintModel` *(deferred — but `Recommendation` already references it)*
```
ConstraintModel {
    model_id  node_id  created_at
    constraints         // list<Constraint{name,domain,threshold,unit,direction,current_value,margin,confidence}>
    assumptions         // list<ScenarioAssumption{key,value,unit}>
    scenario_results    // list<ScenarioResult{scenario_id,horizon,projected_metrics,constraint_breaches,risk_score}>
    related_findings    // list<finding_id>
    notes
}
```
> Because `Recommendation.constraint_model_ref` exists from day one (§4.3), the field is
> nullable now and becomes populated when Module 3 ships — no schema migration. This is
> the §5.1 discipline in miniature.

---

## How this closes the loop (the §1.3 / §5.2 PoC condition)

```
COS labor+materials + ITC ledger  →  SignalEnvelope(s)
   →  FRSSignalPacket (summaries)  →  DiagnosticFinding  →  Recommendation
   →  cds_submission_ref  →  CDS Issue (Submission.type=signal)
   →  CDS deliberates  →  DecisionRecord  →  DispatchPacket (frs_monitors)
   →  CDS→FRS GovernanceSummary  →  next FRSSignalPacket.cds_summary
```
The `cds_summary` block + `cds_submission_ref` are what make the loop *evaluable*, not
just closed — the distinction §2.1 draws between the operational and governance loops.
