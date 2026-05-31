# Canonical Enums (Candidate)

Single source of truth for every enumerated type across the five systems. Where the
same concept appears in more than one system, it is defined **once** here and
referenced — divergent copies are a schema bug. Values are quoted exactly as they
appear in the white paper module specs; deviations are flagged.

> **Ratification note:** enum *values* are part of the data contract. Adding a value
> later is backward-compatible; removing or renaming one is not. Every enum below is a
> candidate for the §5.1 "will the full system need this value?" review.

---

## Shared across systems

### `SkillTier` — used by OAD, ITC, COS
```
low | medium | high | expert
```
Canonical four-tier scale. Confirmed identical in OAD `LaborStep`, ITC `LaborEvent`,
COS `COSTaskDefinition`. **Must be one enum, referenced everywhere.**

### `EcologicalFlag` — used by OAD, COS, ITC
```
low | medium | high
```
Coarse Phase-2 ecological signal. The structured numeric replacement
(`ecological_detail` / `ecological_impact_index`) is `[DEFERRED]`.

### `Scope` — used by FRS, ITC (federation_scope)
```
local | node | regional | federation
```
A finding's / signal's **blast radius** — how far a problem reaches. White-paper canonical for FRS.

> **Reconciliation with `GovernanceScope` (OQ-16).** `Scope` and `GovernanceScope` are **different
> axes** and both are kept: `Scope` = *blast radius of an issue*; `GovernanceScope` = *which
> recursion level owns/governs a record*. The recursion principle (Ep.59 R1) is precisely the
> **mapping** between them — an issue's blast radius determines the governance level it escalates to:
>
> | `Scope` (blast radius) | escalates to `GovernanceScope` |
> |------------------------|-------------------------------|
> | local | `coop` |
> | node | `node` |
> | regional / federation | `network` |
>
> So FRS keeps `scope` on findings/recommendations (it is the escalation *input*); the recursion
> fields below carry `governance_scope` (the *level that acts*). Routing a finding = applying this map.

### `GovernanceScope` — recursion level a record is owned/governed at *(propagated from CDS R1)*
```
coop | node | network
```
Co-ops are recursive sub-nodes within a node, as nodes are sub-units within the network (Ep.59
30:37–33:24). Now carried by **every system's** boundary records (not just CDS) so production,
contribution, design, and feedback are all attributable to — and roll up through — the right level.
Distinct from `node_id` (which node, the *federation* axis) and from COS `CoopScope` (a co-op's
*relationship* to the node, below).

### `Severity` — used by FRS, ITC (ethics), CDS
```
info | low | moderate | high | critical
```
> **Divergence flagged:** ITC `EthicsEvent` in the white paper uses a 3-value scale
> `info | warning | critical`. This exercise proposes **collapsing ITC ethics severity
> onto the canonical 5-value `Severity`** (`warning` → `moderate`) so FRS can compare
> severities across sources without a mapping table. See open question OQ-07.

### `Confidence` — used by FRS, ITC
```
low | medium | high
```

### `AccessMode` — used by ITC (`RedemptionRecord`), COS (`COSDistributionRecord`)
```
permanent_acquisition | shared_use_lock | service_use
```
The access-mode trichotomy. `permanent_acquisition` extinguishes credits;
`shared_use_lock` returns them on release; `service_use` is time-limited.
**Must be one enum shared by ITC and COS** — they describe the same event from two sides.

---

## CDS enums (from white paper `cds-02-architecture-code.md`)

### `SubmissionType`
```
proposal | objection | evidence | comment | signal
```
`signal` = automated input from FRS / ITC / COS (manually-summarized in minimal build).

### `IssueStatus`
```
intake | structured | context_ready | constrained | deliberation |
consensus_check | decided | dispatched | under_review | reopened | archived
```
Pipeline stage. Minimal build uses a subset actively but the full enum exists from day one.

### `SupportLevel` — gradient preference (not binary)
```
strong_support | support | neutral | concern | block
```
Matches DEVGUIDE §3.1 Module 6 categories (strong support / support / neutral /
concerns / strong objection) — naming reconciled to the white paper's machine values.

**Canonical numeric mapping** (Ep.59 frame 65 — `sources/cds-video-ep59.md`). The scale is
deliberately **asymmetric**: a block drags harder (−1.0) than a strong_support lifts (+1.0
relative to neutral the gaps are 1.0 vs 0.6), and the concern→block gap (0.6) exceeds the
support→strong_support gap (0.4). This forces principled resistance to be heard over majority
enthusiasm.

| Support Level | Numeric value |
|---------------|---------------|
| strong_support | `1.0` |
| support | `0.6` |
| neutral | `0.0` |
| concern | `-0.4` |
| block | `-1.0` |

> These values are a **CDS `PolicyRecord` parameter** (`support_gradient_map`), not a hardcoded
> constant — the author states thresholds and scales are node-governance settings that refine
> across the federation (OQ-15). The schema stores the *enum*; the *numbers* live in policy.

### `ScenarioOrigin` — how a scenario entered the pipeline *(new — R3)*
```
submission | auto_generated | deliberation
```
`submission` = from the original Module-1 intake form; `auto_generated` = the Module 3→4 bridge
step (the "paper oversight"); `deliberation` = invented/refined by humans in Module 5.

### `EscalationReason` — why Module 6 escalated to Module 9 *(new — R7)*
```
revision_failure | unresolved_value_conflict
```
`revision_failure` = persistent 5↔6 cycling without convergence (count-threshold);
`unresolved_value_conflict` = numerically approved but a sentimental/historical/cultural value
objection remains (the constitutional appeal path).

### `ConsensusDirective`
```
approve | revise | escalate_to_module9
```

### `DecisionStatus`
```
approved | rejected | revise_and_retry | amended | revoked | reopened
```
`amended | revoked | reopened` are Module 10 outcomes — `[DEFERRED]` module, values present.

### `ReviewReason` — Module 10 trigger taxonomy `[DEFERRED]`
```
frs_risk_signal | cos_failure | itc_equity_drift | constraint_violation |
new_evidence | changed_conditions | other
```
Recorded in every decision packet from day one (§3.1) so Module 10 has history to act on.

### `ReviewOutcomeStatus` — Module 10 `[DEFERRED]`
```
reaffirmed | amended | revoked | reopen_deliberation
```

---

## OAD enums (from white paper `oad-02-architecture-code.md`)

### `DesignStatus`
```
draft | under_review | optimized | ready_for_certification | certified | deprecated
```
> DEVGUIDE §4.3 lists the same set and explicitly warns: "white paper includes
> `optimized` and `ready_for_certification` as meaningful intermediate states — do not
> omit." Honored here.

### `CertificationStatus` — on the (consolidated) certification record
```
pending | certified | revoked
```

---

## ITC enums (from white paper `itc-*` modules)

### `LedgerEntryType` — **white-paper canonical, use exactly** (DEVGUIDE §4.3 concurs)
```
labor_event_recorded | labor_weight_applied | itc_credited | itc_decayed |
access_value_quoted | access_redeemed | equivalence_band_applied |
ethics_flag_created | ethics_flag_resolved | policy_updated
```

### `EthicsStatus`
```
open | under_review | resolved
```

(ITC ethics severity: see shared `Severity` and OQ-07.)

---

## COS enums (from white paper `cos-*` / `module-*`)

### `TaskStatus`
```
pending | in_progress | blocked | done | cancelled
```

### `BlockReason`
```
skill | tool | material | space | unknown
```

### `ConstraintType`
```
skill | tool | material | space | time
```

### `MaterialFlowSource`
```
internal_recycle | external_procurement | production_use | loss_scrap
```
> Reconciles with DEVGUIDE `MaterialConsumptionEvent.source` (`internal |
> external_dependency`). Proposal: keep the richer 4-value WP enum and **derive** the
> devguide's coarse 2-value `source` from it. See OQ-09.

### `AccessChannelType`
```
personal_acquisition | shared_fleet | tool_library | essential_service | repair_pool
```

### `QATestType`
```
functional | safety | durability | maintainability | eco_compliance
```

### `CoopScope`
```
internal | federated | external_transitional
```

### `COSEventType`
```
labor | material | workflow | qa | distribution | coordination
```

---

## FRS enums (from white paper `frs-*` modules) — DEVGUIDE §4.3 confirms all canonical

### `SignalSource`
```
COS | OAD | ITC | CDS | ECO | FED
```
`ECO` = external ecological monitoring; `FED` = inter-node exchange.

### `SignalDomain`
```
ecology | materials | energy | labor | throughput | quality_reliability |
distribution_access | dependency_autonomy | governance_participation |
ethics_proto_market | security_integrity | other
```

### `FindingType` — **white-paper canonical**
```
ecological_overshoot_risk | material_scarcity_trend | labor_imbalance_or_burnout_risk |
throughput_bottleneck_persistent | quality_reliability_drift |
dependency_fragility_increase | access_inequity_detected |
proto_market_or_coercion_risk | governance_overload_or_capture_risk |
data_integrity_anomaly | other
```

### `RecommendationType` — **white-paper canonical**
```
design_review_request | workflow_stress_alert | valuation_drift_flag |
training_priority_signal | material_substitution_prompt | dependency_risk_alert |
policy_review_prompt | monitoring_directive | federated_learning_share | other
```

### `TargetSystem` — finding/recommendation routing
```
CDS | OAD | COS | ITC | FED
```

### `Persistence`
```
transient | emerging | persistent | structural
```

### `Horizon` — scenario modeling `[DEFERRED]`
```
near | mid | long
```

### `MemoryRecordType` — longitudinal memory `[DEFERRED]`
```
baseline | incident | intervention | outcome | lesson | policy_context | design_lineage
```

### `ArtifactType` — sensemaking `[DEFERRED]`
```
dashboard_view | risk_brief | scenario_comparison | deliberation_prompt |
public_summary | technical_appendix
```

### `FederatedMessageType` — federated intelligence `[DEFERRED]`
```
stress_signature | best_practice | design_success_case | early_warning |
model_template | memory_record_share
```
