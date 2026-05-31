# Cross-System Contract Matrix (Candidate)

The point of the schema exercise is that records crossing system boundaries **fit**. This
matrix maps DEVGUIDE §4.2's twelve data contracts and §4.4's interface signatures to the
records in specs 01–05, and flags every place producer and consumer must agree on a
field or enum.

A contract is **sound** when: the producing system owns a record carrying every field the
consuming system reads, the shared enums are identical, and federation fields are present
on both sides.

---

## The 12 data contracts (§4.2)

| # | Contract | Producer record | Consumer reads | Shared types | Status |
|---|----------|-----------------|----------------|--------------|--------|
| 1 | OAD → COS: Certified Design Package | `CertifiedDesign` (02) | COS `ProductionPlan.design_ref` | `LaborStep`, `MaterialRequirement`, `SkillTier`, `DesignStatus` | ✅ sound |
| 2 | OAD → ITC: Design Intelligence Signal | `CertifiedDesign` / `OADValuationProfile` | ITC `AccessValuation.design_version_id` | `SkillTier`, eco coeffs `[DEFERRED]` | ⚠ OQ-02 (materialize vs compute) |
| 3 | OAD → FRS: Design Event Signal | `DesignEvent`, `CertificationChangeEvent` (02) | FRS `SignalEnvelope(source=OAD)` | `DesignStatus`, `EcologicalFlag` | ⚠ OQ-05 (promote events to first-class) |
| 4 | FRS → OAD: Operational Recalibration | `CoefficientDelta`, `LifecycleAssumptions` (02) | OAD review queue | `ReviewRecord`, `AcknowledgementRecord` | ✅ deferred-but-stable |
| 5 | COS → ITC: Labor & Materials Record | `LaborEvent`, `MaterialConsumptionEvent` (03/04) | ITC Module 1/2 | `SkillTier`, `AccessMode`, raw/weighted boundary | ✅ sound |
| 6 | COS → FRS: Operational Signal | `OperationalSignalData` / `COSEvent` (04) | FRS `SignalEnvelope(source=COS)` | `COSEventType`, `QATestType` | ✅ sound |
| 7 | ITC → FRS: Credit & Access Signal | `ITCLedgerEntry`, `ITCAccount` (03) | FRS `itc_summary`, `SignalEnvelope(source=ITC)` | `LedgerEntryType` | ✅ sound (last_contribution_at/last_access_at read directly — §4.4) |
| 8 | FRS → CDS: Sensemaking Artifact | `FRSSignalPacket` (05) | CDS `Submission(type=signal)` (01) | findings/recs enums | ✅ sound — **closes the loop** |
| 9 | CDS → FRS: Governance Signal | `GovernanceSummary` (from `DecisionRecord`/`PolicyRecord`) | FRS `cds_summary` (05) | — | ✅ sound — closes governance-eval loop |
| 10 | CDS → OAD: Design Mandate | `DispatchPacket.oad_flags` (01) | OAD design queue | — | ✅ sound |
| 11 | CDS → COS: Production Mandate | `DispatchPacket.tasks/materials/schedule` (01) | COS `ProductionPlan.cds_mandate_ref` | — | ✅ sound |
| 12 | CDS → ITC: Policy Signal | `DispatchPacket.itc_adjustments` + `PolicyRecord`/`DecayRule` (01) | ITC `ITCPolicySnapshot`, `ITCAccount.active_decay_rule_id` | `DecayRule` fields | ⚠ OQ-04 (policy/snapshot sync) |

---

## §4.4 interface signatures → records

Every interface function and the record it moves. Functions are versioned (§4.4: version
id on every interface from the first one written).

```
OAD → COS
  get_certified_design(design_id, version) → CertifiedDesign
  list_certified_designs(filters)          → List<CertifiedDesign>
  verify_design_status(design_id, version) → {certified, status:DesignStatus}

OAD → FRS
  get_design_events(node_id, t0, t1)          → List<DesignEvent>
  get_ecological_assessment(design_id, ver)   → EcologicalAssessment [DEFERRED content]
  get_certification_changes(node_id, t0, t1)  → List<CertificationChangeEvent>

FRS → OAD                                       (advisory; does NOT halt production — §4.4)
  submit_coefficient_recalibration(...)       → AcknowledgementRecord
  submit_lifecycle_revision(...)              → AcknowledgementRecord
  submit_certification_review_request(...)    → ReviewRecord

COS → ITC
  get_labor_events(node_id, t0, t1)           → List<LaborEvent>
  get_material_events(node_id, t0, t1)        → List<MaterialConsumptionEvent>
  get_production_summary(plan_id)             → ProductionSummary

COS → FRS
  get_operational_signal(node_id, t0, t1)     → OperationalSignalData
  get_qa_events(node_id, t0, t1)              → List<QAEvent>

ITC → FRS
  get_credit_summary(node_id, t0, t1)         → ITCPeriodSummary (+ per-account
                                                last_contribution_at/last_access_at —
                                                read from ITCAccount, never reconstructed)
  get_ledger_entries(node_id, t0, t1)         → List<ITCLedgerEntry> (raw_hours+weighted_credits)
  get_balance_distribution(node_id)           → BalanceDistribution [DEFERRED]

FRS → CDS
  submit_signal_packet(packet)                → IssueReference        ← closes operational loop
  get_recommendation_status(rec_id)           → RecommendationStatus

CDS → FRS
  get_governance_summary(node_id, t0, t1)     → GovernanceSummary     ← closes governance loop

CDS → All
  get_active_policies(system, node_id)        → List<PolicyRecord>
  get_itc_policy_snapshot(node_id)            → ITCPolicySnapshot
  get_production_mandate(mandate_id)          → ProductionMandate
  notify_dispatch(dispatch_packet)            → AcknowledgementRecord
```

---

## Shared-type integrity checklist

These types appear in **multiple** records. Divergence = silent contract break. All must
resolve to the single definition in `00-canonical-enums.md`.

| Shared type | Appears in | Risk if divergent |
|-------------|-----------|-------------------|
| `SkillTier` | OAD `LaborStep`, ITC `LaborEvent`, COS `TaskDefinition`, all skill summaries | weighting + scheduling mismatch |
| `AccessMode` | ITC `RedemptionRecord`, COS `COSDistributionRecord` | extinguishment loop breaks (OQ-08) |
| `EcologicalFlag` | OAD `CertifiedDesign`, COS `MaterialConsumptionEvent`, FRS summaries | eco accounting chain breaks (§2.4) |
| `Severity` | FRS findings/recs, ITC `EthicsEvent`, CDS | cross-source severity incomparable (OQ-07) |
| `Scope` | FRS finding routing, ITC `federation_scope`, CDS | escalation mis-routing |
| `LedgerEntryType` | ITC `ITCLedgerEntry` only — but FRS audits its values | FRS weighting-drift audit breaks |
| `DecayRule` fields | CDS `PolicyRecord` (authoritative) + ITC `ITCAccount` (snapshot) | decay policy drift (OQ-04) |
| `node-id:participant-id` | **every** participant reference | federation migration breaks (§4.2) |
| `GovernanceScope` | CDS (Issue, DecisionRecord), OAD (CertifiedDesign), ITC (LaborEvent, LedgerEntry), COS (ProductionPlan + production records), FRS (SignalEnvelope) | co-op work mis-rolls-up; recursive CDS can't scope (R1) |
| `Scope` vs `GovernanceScope` | FRS `scope` (blast radius) → CDS `governance_scope` (acting level) | mis-routed escalation; the two axes conflated (OQ-16) |

---

## Federation-field audit (§4.2 — "the difference between days and months")

Confirmed present (mostly null in single-node Phase 2) on every cross-boundary record:

- `node_id` — ✅ on all records in specs 01–05
- `node-id:participant-id` participant refs — ✅ (Submission.author_id, Vote.participant_id,
  LaborEvent.participant_id, ITCAccount.participant_id, EthicsEvent.involved_member_ids)
- `federation_hash` / `packet_hash` / `entry_hash` — present `[DEFERRED]` on CertifiedDesign,
  LaborEvent, MaterialConsumptionEvent, ITCLedgerEntry, FRSSignalPacket, SignalEnvelope, COSEvent
- `federation_scope` / `Scope` — ✅ on ITCAccount, DiagnosticFinding, Recommendation
- `federation_id` — ✅ on SignalEnvelope

**Result:** the candidate schema is federation-aware from day one as §4.2 requires. The
one gap to ratify: whether CDS `DecisionRecord` needs an explicit `originating_node`
beyond `node_id` for cross-node decision provenance (OQ-06).

### Recursion-field audit (R1, propagated across all five systems)

`node_id` answers *which node* (federation axis). `governance_scope` + `coop_id` answer *which
recursion level within a node* owns/produced a record (co-op sub-axis). Now present on every
boundary record so co-op-authorized work rolls up to node and network:

| System | Record(s) with `governance_scope` | Notes |
|--------|-----------------------------------|-------|
| CDS | `Issue` (+ `coop_id`, `escalated_from`), `DecisionRecord` | the source of the pattern (R1) |
| OAD | `CertifiedDesign` (+ `coop_id`, `promoted_from_scope`) | certifying level; commons promotion path |
| ITC | `LaborEvent`, `ITCLedgerEntry` (+ `coop_id`) | `ITCAccount` deliberately node-scoped (rollup is a view, not a partition) |
| COS | `ProductionPlan`, `TaskInstance`, `MaterialConsumptionEvent`, `QAEvent`, `COSEvent`, `COSDistributionRecord` | distinct from existing `CoopScope` (relationship-to-node) |
| FRS | `SignalEnvelope` | findings keep `scope` (blast radius) → mapped to governance level, not duplicated |

Two deliberate non-additions, flagged so they read as decisions not omissions: **`ITCAccount`**
(single non-transferable node-level balance — co-op view is a ledger rollup) and **FRS
`DiagnosticFinding`/`Recommendation`** (carry `scope`, the richer blast-radius field, mapped to
`governance_scope` via the OQ-16 table rather than carrying a redundant column).
