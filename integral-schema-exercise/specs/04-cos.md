# COS — Cooperative Organization System Schema (Candidate)

The largest reconciliation gap: DEVGUIDE §4.3 schematizes only **`LaborEvent`** (shared
with ITC, see spec 03) and **`MaterialConsumptionEvent`**. The white paper defines **43**
COS objects across 9 modules. This spec defines the Phase-2 active core — the records
required for the §1.3 proof-of-concept slice (a certified design → production workflow →
labor + materials records → ITC) — and captures the full 43-object inventory in the
appendix so nothing is lost.

**Minimal build (§3.4 / §1.3 PoC):** take a certified OAD design, build a work
breakdown, assign labor, log task completions and materials consumption, run a QA check,
and emit the labor/materials records ITC and FRS consume. Capacity optimization,
constraint balancing, distribution coordination, and inter-coop integration are deferred.

**Source-of-truth principle (§2.2):** COS data integrity is foundational — if COS labor
and materials records are unreliable, both ITC and FRS are compromised. The append-only
`COSEvent` ledger exists from day one.

**Recursion propagation (R1).** COS already carries co-op granularity (`coop_id`,
`assigned_coop_id`, `coop_unit_id`) and the `CoopScope` enum — but `CoopScope`
(`internal | federated | external_transitional`) describes a co-op's **relationship to the node**,
which is a *different axis* from `GovernanceScope` (`coop | node | network`, the **recursion level**
that owns/authorized a record). Both are kept. `governance_scope` + `coop_id` are added to the
boundary records (`ProductionPlan`, `TaskInstance`, `MaterialConsumptionEvent`, `QAEvent`,
`COSEvent`, `COSDistributionRecord`) so production authorized by a co-op CDS rolls up cleanly to
node level, and so the labor/materials records COS hands to ITC and FRS already carry the level the
recursive CDS and feedback loop need. Where a record already has a co-op id, `governance_scope`
disambiguates *the level acting* from *the co-op named*.

---

## Record: `ProductionPlan` *(active — the OAD→COS contract realized)*

The work breakdown for producing a batch of a certified design. COS **cannot** create
one without a certified `design_id` (§2.2 architectural dependency).

```
ProductionPlan {
    plan_id             // [WP COSProductionPlan]
    node_id             // [FED]
    governance_scope    // [R1-prop] coop | node | network — recursion level that authorized/owns
                        //   this plan (matches the cds_mandate_ref's DecisionRecord.governance_scope)
    coop_id             // [R1-prop] nullable — owning co-op when governance_scope=coop
    design_ref          // [WP version_id] OAD CertifiedDesign + version — REQUIRED, must be certified
    cds_mandate_ref     // [DG] the CDS DispatchPacket / DecisionRecord authorizing this production
    batch_id            // [WP]
    batch_size          // [WP] int
    created_at          // [WP]
    task_definition_ids // [WP tasks] refs to TaskDefinition templates
    task_instance_ids   // [WP task_instances] refs to TaskInstance
    expected_labor_hours_by_skill // [WP] dict<SkillTier,float>
    expected_materials  // [WP expected_materials_kg] dict<material_id,quantity>
    expected_cycle_time_hours     // [WP]
    predicted_bottlenecks // [WP][DEFERRED] list<task_definition_id>
    status              // [DG] planning | active | complete | cancelled
    notes               // [WP]
}
```

## Record: `TaskDefinition` *(active)* — template derived from OAD `LaborStep`
```
TaskDefinition {
    task_definition_id  // [WP id]
    design_ref          // [WP version_id]
    node_id             // [FED]
    name                // [WP] e.g. "frame_welding"
    description         // [WP]
    skill_tier          // [WP] SkillTier (shared)
    estimated_hours_per_unit // [WP]
    required_tools      // [WP] list<str>
    required_materials  // [WP required_materials_kg] dict<material_id,quantity>
    predecessors        // [WP] list<task_definition_id>
    required_clearances // [WP] list<str> — safety clearances
    process_eii         // [WP][DEFERRED] process ecological impact index
    hazard_level        // [WP][DEFERRED] 0..1
}
```

## Record: `TaskInstance` *(active)* — a scheduled/executed task
```
TaskInstance {
    task_instance_id    // [WP id]
    definition_id       // [WP]
    plan_id             // [DG] back-ref to ProductionPlan
    batch_id            // [WP]
    node_id             // [FED]
    assigned_coop_id    // [WP]
    status              // [WP] TaskStatus: pending|in_progress|blocked|done|cancelled
    scheduled_start     // [WP] nullable
    scheduled_end       // [WP] nullable
    actual_start        // [WP] nullable
    actual_end          // [WP] nullable
    actual_hours        // [WP]
    participants        // [WP] list<node-id:participant-id>
    block_reason        // [WP][DEFERRED] BlockReason enum (skill|tool|material|space|unknown)
    notes               // [WP]
}
```
> Each completed `TaskInstance` emits one or more `LaborEvent` records (spec 03) — this
> is the COS→ITC labor contract in motion.

## Record: `MaterialConsumptionEvent` *(active — §4.3, owned by COS, consumed by ITC + FRS)*

```
MaterialConsumptionEvent {
    event_id            // [DG]
    timestamp           // [DG]
    task_ref            // [DG] TaskInstance ref
    production_plan_ref // [DG] ProductionPlan ref
    design_ref          // [DG] OAD CertifiedDesign + version
    node_id             // [FED]
    material_id         // [DG]
    material_name       // [DG]
    quantity_consumed   // [DG] numeric
    unit                // [DG]
    quantity_remaining  // [DG] inventory level after consumption
    ecological_flag     // [DG] EcologicalFlag — from OAD design
    ecological_impact_index // [WP eii][DEFERRED] numeric EII
    source              // [DG] internal | external_dependency
                        //   (derive from WP MaterialFlowSource 4-value enum — OQ-09)
    external_source_ref // [DG][DEFERRED] supplier/node ref
    federation_hash     // [FED][DEFERRED]
}
```

## Record: `QAEvent` *(active — the COS→FRS quality contract)*

DEVGUIDE FRS schema (`FRSSignalPacket.qa_summary`, `DiagnosticFinding` type
`quality_reliability_drift`) requires QA data, but §4.3 never schematizes it. From WP
`QATestResult` / `QABatchSummary`:

```
QAEvent {
    qa_event_id         // [WP]
    node_id             // [FED]
    design_ref          // [WP version_id]
    batch_id            // [WP]
    timestamp           // [DG]
    test_type           // [WP] QATestType: functional|safety|durability|maintainability|eco_compliance
    unit_id             // [WP] nullable for batch-level
    passed              // [WP] bool
    metrics             // [WP] dict (may include repair_time_hours)
    failure_rate        // [WP unit_failure_rate] batch-level
    failures_by_design  // [DG] which design_id/version implicated
    severity_index      // [DG] for FRS severity mapping
    notes               // [WP]
}
```

## Record: `COSEvent` *(active — append-only operational ledger)*
```
COSEvent {
    event_id  node_id  timestamp
    event_type          // [WP] COSEventType: labor|material|workflow|qa|distribution|coordination
    coop_unit_id  good_id  design_ref
    payload             // [WP] dict — event-type-specific
    prev_hash           // [WP][DEFERRED] hash chain
    event_hash          // [WP][DEFERRED]
}
```

## Helper records for §4.4 interfaces *(define the promised shapes)*
```
ProductionSummary       // [WP ITCProductionSummary] period aggregate consumed by ITC:
                        //   total_weighted_hours_by_tier, total_raw_hours_by_tier,
                        //   material_consumption, units_completed, units_failed_qa
OperationalSignalData   // [WP FRSProductionTrace] period aggregate consumed by FRS:
                        //   throughput, bottlenecks, eii totals, failure rates
```

---

## Full white-paper inventory (43 objects — provenance appendix, nothing dropped)

The white paper COS spec is the authoritative source (no §4 schema exists for most of
these). **Bold** = active in Phase-2 core above. The rest are `[DEFERRED]` module-internal
objects whose data the full system will need; they are listed so the schema can grow
without re-formatting the ledger.

| Module | WP objects | Phase-2 fate |
|--------|-----------|--------------|
| 1 Planning & WBS | **COSProductionPlan**, **COSTaskDefinition**, **COSTaskInstance** | active |
| 2 Labor & skill-match | LaborAvailabilitySnapshot, LaborDemandSnapshot, TaskAssignmentSuggestion, LaborMatchingResult | `[DEFERRED]` — assignment is manual in minimal build |
| 3 Materials | **MaterialRequirement**, COSMaterialStock, COSMaterialLedgerEntry, MaterialProcurementDecision, ResourceProcurementResult | partial — consumption active, procurement deferred |
| 4 Workflow execution | COSExecutionMetrics | partial — completions logged via TaskInstance/COSEvent |
| 5 Capacity & constraints | COSCapacitySnapshot, COSThroughputMetrics, COSConstraint, ITC/OAD/FRS ConstraintSignal | `[DEFERRED]` |
| 6 Distribution & access | DistributionPolicy, AccessInventoryRecord, **COSDistributionRecord**, ITCAccessAvailabilitySignal, FRSAccessStressSignal | partial — distribution record active (links to ITC redemption) |
| 7 QA & safety | QATestSpec, **QATestResult/QAEvent**, QABatchSummary, ITCReliabilitySignal, FRSFailureSignal | partial — QA event active |
| 8 Inter-coop integration | CoopCapability, CooperativeUnit, CoopDependency, GoodsCoordinationProfile, ITCDependencySignal, FRSAutonomySignal | `[DEFERRED]` |
| 9 Transparency & audit | **COSEvent**, COSLedger, **ITCProductionSummary**, **FRSProductionTrace** | active |

### `COSDistributionRecord` *(active — links COS distribution to ITC access)*
```
COSDistributionRecord {
    distribution_id  node_id  design_ref  unit_serial  timestamp
    access_mode             // [WP] AccessMode (shared with ITC RedemptionRecord)
    assigned_center_id      // nullable — access center / fleet
    access_valuation_ref    // [WP] link to ITC AccessValuation used
    notes
}
```
> This record is the COS side of the §1.3 "credits extinguished on access" loop: a
> `permanent_acquisition` distribution corresponds to an ITC `RedemptionRecord` that
> extinguishes credits. Keeping `access_mode` a shared enum prevents the two sides
> diverging. See OQ-08.

> **Scoping note (no silent cap):** ~26 of the 43 WP objects are deferred module-internal
> records. This candidate gives JSON Schema only to the boundary-crossing subset
> (ProductionPlan, TaskDefinition, TaskInstance, LaborEvent, MaterialConsumptionEvent,
> QAEvent, COSEvent, COSDistributionRecord). Promoting the rest is tracked in OQ-10.
