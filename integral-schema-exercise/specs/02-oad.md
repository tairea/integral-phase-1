# OAD — Open Access Design Schema (Candidate)

The devguide §4.3 defines one Phase-2 record, **`CertifiedDesign`**, which deliberately
consolidates seven white-paper objects. This spec presents `CertifiedDesign` as the
active Phase-2 schema, traces every field to its white-paper source, and lists the
un-consolidated objects whose fields survive as `[DEFERRED]` placeholders or move to the
provenance appendix.

**Minimal build (§3.2):** design submission + versioning + ecological flag +
certification gate + COS-readable package. Real-time collaborative editing, structured
eco coefficients, lifecycle modeling, feasibility simulation, and optimization are
deferred — **but the certification gate is non-negotiable** (§2.4: skipping it is a
corruption, not a simplification).

---

## Record: `CertifiedDesign` *(active — the OAD→COS / OAD→ITC / OAD→FRS contract)*

This is the §4.3 schema, annotated. It is the authoritative source of truth COS builds
from and ITC values from. Sub-objects `MaterialRequirement` and `LaborStep` are defined
below.

```
CertifiedDesign {
    design_id           // [WP DesignSpec.id] unique, generated at first submission
    version             // [WP DesignVersion] semantic version string "1.0.0"
    label               // [WP] short label "v0.3-bamboo-frame"
    title               // [WP DesignSpec]
    description         // [WP DesignSpec]
    authored_by         // [WP] list<node-id:participant-id>
    created_at          // [WP]
    certified_at        // [WP CertificationRecord]
    certified_by        // [WP CertificationRecord.certified_by: List[str]] — MUST be a list
                        //   (full certification panel, accountable audit trail — §4.3)
    cds_mandate_ref     // [DG] ref to the CDS DecisionRecord that authorized design work
    status              // [WP] DesignStatus enum
                        //   draft|under_review|optimized|ready_for_certification|certified|deprecated
                        //   ([WP] keep `optimized` + `ready_for_certification` — §4.3 warns: do not omit)

    // --- production intelligence (the COS/ITC contract core) ---
    bill_of_materials   // [WP MaterialProfile] list<MaterialRequirement>
    production_steps    // [WP LaborProfile.production_steps] ordered list<LaborStep>
    skill_requirements  // [WP LaborProfile.hours_by_skill_tier] dict<SkillTier,float>

    // --- ecological (flag now, structured detail deferred) ---
    ecological_flag     // [WP] EcologicalFlag enum — set during OAD Module 3 assessment
    ecological_notes    // [WP] human-authored narrative
    ecological_detail   // [WP EcoAssessment][DEFERRED] {embodied_energy, carbon_intensity,
                        //   toxicity, recyclability, water_use, land_use, repairability}

    // --- lifecycle (deferred structured model) ---
    lifecycle_detail    // [WP LifecycleModel][DEFERRED] {expected_lifetime_years,
                        //   maintenance_interval_days, maintenance_labor_hours_per_interval,
                        //   disassembly_hours, dominant_failure_modes, lifecycle_burden_index}

    // --- ITC valuation output (computed at certification) ---
    itc_access_cost         // [DG] computed access cost in time credits
    itc_access_cost_method  // [DG] simple_embodied | [future methods]

    // --- lineage + federation + recursion ---
    superseded_by       // [WP DesignVersion.superseded_by_version_id] nullable
    design_lineage      // [WP DesignVersion.parent_version_id] nullable
    node_id             // [FED] originating node
    governance_scope    // [R1-prop] coop | node | network — level this design is CERTIFIED at
    coop_id             // [R1-prop] nullable — owning co-op when governance_scope=coop
    promoted_from_scope // [R1-prop] nullable GovernanceScope — prior level, if promoted upward
    federation_hash     // [FED][DEFERRED] cross-node verification
    commons_visible     // [WP RepoEntry] bool — published to commons
}
```
> **Recursion propagation (R1).** `governance_scope` records the level that certified the design;
> `certified_by` (the panel) is interpreted at that level. This makes the knowledge commons
> recursive: a co-op may certify a design for its own use, which can be promoted to node, then into
> the network commons — the upward "propagate design memory across the federation" path.
> `commons_visible` (network sharing) and `governance_scope` (certifying authority) are orthogonal:
> a `coop`-certified design may be `commons_visible=true` (shared as a candidate) without being
> node-certified. Recursive escalation of design problems (a co-op design failing → node review)
> follows the same `escalated_from` pattern as CDS issues.

### Sub-object: `MaterialRequirement` *(in `bill_of_materials`)*
```
MaterialRequirement {
    material_id         // [DG]
    material_name       // [WP]
    quantity            // [WP MaterialProfile.quantities_kg] numeric
    unit                // [DG] e.g. "kg"
    eco_coefficients    // [WP MaterialProfile][DEFERRED] {embodied_energy_mj_per_kg,
                        //   carbon_kg_per_kg, toxicity_index, recyclability_index,
                        //   water_use_l_per_kg, land_use_m2_per_kg, scarcity_index}
}
```

### Sub-object: `LaborStep` *(in `production_steps`)* — `[WP LaborStep]`
```
LaborStep {
    name                // [WP]
    estimated_hours     // [WP]
    skill_tier          // [WP] SkillTier enum (shared)
    tools_required      // [WP] list<str>
    sequence_index      // [WP] int — ordering
    safety_notes        // [WP]
    ergonomics_flags    // [WP][DEFERRED] list<str> (repetitive_motion, awkward_posture, ...)
}
```

---

## Helper records referenced by §4.4 interfaces *(define now so OAD↔FRS contract is honest)*

The §4.4 `OAD→FRS` and `FRS→OAD` interfaces name objects that have no §4.3 schema. They
map to white-paper objects:

### `DesignEvent` *(OAD→FRS — `get_design_events`)*
```
DesignEvent {
    event_id  design_id  version  node_id  timestamp
    event_type          // submitted | version_updated | status_changed | certified | revoked | superseded
    author_id
    detail              // dict — change specifics
}
```
> White paper embeds these in `DesignVersion.change_log` (free text). Promoting to a
> first-class event object is required because FRS consumes them structurally. See OQ-05.

### `CertificationChangeEvent` *(OAD→FRS — `get_certification_changes`)*
```
CertificationChangeEvent {
    event_id  design_id  version  node_id  timestamp
    old_status  new_status        // DesignStatus / CertificationStatus
    reason                        // text
    triggering_frs_finding_ref    // [DEFERRED] the FRS finding that prompted it, if any
    superseded_by_version         // nullable
}
```

### `EcologicalAssessment` *(OAD→FRS — `get_ecological_assessment`)*
The structured form of `CertifiedDesign.ecological_detail`. Carries `MaterialProfile`
coefficients + `EcoAssessment` normalized indices. `[DEFERRED]` content; **interface
signature stable now.**

### FRS→OAD recalibration payloads *(define the shapes the interface promises)*
```
CoefficientDelta        { material_id  coefficient_name  delta  evidence_ref }   // [DEFERRED]
LifecycleAssumptions    { expected_lifetime_years  maintenance_interval_days  ... } // [DEFERRED]
AcknowledgementRecord   { ack_id  request_ref  received_at  status }
ReviewRecord            { review_id  design_id  version  finding_ref  severity  opened_at  status }
```

---

## Un-consolidated white-paper inventory (provenance appendix — nothing lost)

The white paper defines these OAD objects. The minimal Phase-2 schema folds the
**bold** ones into `CertifiedDesign`; the rest are full-system modules whose data lands
in `[DEFERRED]` fields or post-Phase-2 records. Captured here so the un-consolidation
path is recoverable (§4.3 mandate).

| WP object | Module | Fate in Phase-2 schema |
|-----------|--------|------------------------|
| **DesignSpec** | 1 | → `CertifiedDesign` (id, title, description, authored_by) |
| **DesignVersion** | 1–2 | → `CertifiedDesign` (version, label, status, lineage) |
| **MaterialProfile** | 3 | → `MaterialRequirement` + `ecological_detail` `[DEFERRED]` |
| **EcoAssessment** | 3 | → `ecological_flag` active; `ecological_detail` `[DEFERRED]` |
| **LifecycleModel** | 4 | → `lifecycle_detail` `[DEFERRED]` |
| **LaborStep / LaborProfile** | 6 | → `production_steps`, `skill_requirements` (active) |
| **CertificationRecord** | 9 | → `CertifiedDesign` (certified_at, certified_by, status) |
| SimulationResult | 5 | `[DEFERRED]` — feasibility simulation module |
| IntegrationCheck | 7 | `[DEFERRED]` — systems-integration module |
| OptimizationResult | 8 | `[DEFERRED]` — optimization module |
| RepoEntry / ReuseMetrics | 10 | `commons_visible` active; reuse metrics `[DEFERRED]` |
| OperationalFeedback | 10/FRS | becomes FRS→OAD recalibration (above) |
| OADValuationProfile | 9-output | the ITC-facing projection of `CertifiedDesign` (see spec 03) |

> **Open question (OQ-02):** the white paper's `OADValuationProfile` is a *derived
> projection* of a certified design, consumed by both COS and ITC. Should it be a
> materialized record or computed on read from `CertifiedDesign`? Affects the OAD→ITC
> "Design Intelligence Signal" contract.
