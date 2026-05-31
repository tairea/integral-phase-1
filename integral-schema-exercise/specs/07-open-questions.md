# Open Questions — Schema Ratification Register (Candidate)

This is candidate work, not a decree (DEVGUIDE §3 "A Proposal, Not a Decree"). Below are
the schema decisions that the contributor community must actually deliberate before the
schema is ratified and Phase 2 begins. Each is framed as a `integral/decisions` issue
would be: the question, the options, the recommendation, and what it blocks.

Severity key: 🔴 blocks Phase 2 · 🟠 should resolve before the dependent module ·
🟡 refinement, safe to defer.

---

### OQ-01 🔴 — Schema notation / source of truth
**Q:** Is the ratified schema authored as JSON Schema (machine-checkable), a typed
language (Pydantic/TS), or devguide-style annotated Markdown?
**This cut uses:** language-agnostic — Markdown specs (specs 01–05) + JSON Schema
(`schemas/`) for boundary-crossing records.
**Recommendation:** keep JSON Schema as the contract source of truth (validatable, CI-able,
federation-version-friendly) with Markdown generated/kept beside it. Defer typed-language
bindings to Phase 2 per-system repos.
**Blocks:** how every other artifact is stored and reviewed.

---

### OQ-02 🟠 — `OADValuationProfile`: materialized record or computed projection?
**Q:** The OAD→ITC "Design Intelligence Signal" (contract #2) is a condensed valuation
view of a certified design. Is it a stored record updated on recertification, or computed
on read from `CertifiedDesign`?
**Trade-off:** materialized = stable ITC valuations + audit snapshot, but a sync surface;
computed = always-fresh, but recompute cost and no historical snapshot.
**Recommendation:** materialize it, stamped with the `design_version` and
`policy_snapshot_id` that produced it (matches how `AccessValuation` already snapshots).
**Blocks:** ITC valuation determinism; contract #2.

---

### OQ-03 🟠 — Consolidate `LaborEvent` + `WeightedLaborRecord`, or keep separate?
**Q:** §4.3 consolidates them into one `LaborEvent`; the white paper keeps raw capture and
weighted recognition as distinct objects.
**This cut:** consolidated, with weighting-output fields demarcated (spec 03).
**Risk:** if a future federated-weighting scheme needs to re-weight raw events under a new
policy, a consolidated record may force in-place mutation of a value-neutral capture.
**Recommendation:** keep consolidated for Phase 2 **but** treat the raw block as immutable
once written and the weighting block as append-only-versioned. Ratify the immutability
rule now even though enforcement is simple.
**Blocks:** ITC ledger integrity; FRS weighting-drift audit.

---

### OQ-04 🔴 — `DecayRule`: single source vs. account snapshot sync
**Q:** `DecayRule` parameters live authoritatively in a CDS `PolicyRecord` *and* as an
inline snapshot on each `ITCAccount`. How is drift prevented?
**Recommendation:** `ITCAccount` stores only `active_decay_rule_id`; the inline parameter
fields are a **read-through cache** refreshed on each decay application and never written
independently. Make the cache nature explicit in the schema (comment + non-authoritative
flag).
**Blocks:** decay correctness — a core §1.3 PoC principle (non-accumulation).

---

### OQ-05 🟠 — Promote OAD design events to first-class objects?
**Q:** The white paper embeds design history in `DesignVersion.change_log` (free text),
but FRS (contract #3) needs structured `DesignEvent` / `CertificationChangeEvent`.
**Recommendation:** promote both to first-class append-only records (done in spec 02). The
free-text changelog stays as human narrative; the structured events are what FRS reads.
**Blocks:** contract #3 (OAD→FRS).

---

### OQ-06 🟡 — Does `DecisionRecord` need `originating_node` beyond `node_id`?
**Q:** For cross-node decision provenance in a future federation, is `node_id` sufficient
or do we need a separate `originating_node` (decisions referenced/ratified across nodes)?
**Recommendation:** add nullable `originating_node` now (cheap, §4.2 logic); leave null in
single-node Phase 2.

---

### OQ-07 🟠 — Reconcile ITC ethics severity onto the shared 5-value `Severity`
**Q:** ITC `EthicsEvent` uses `info|warning|critical`; FRS/CDS use
`info|low|moderate|high|critical`. One scale or a mapping?
**This cut proposes:** one shared `Severity`, mapping `warning → moderate`.
**Counter-argument to weigh:** ethics violations may warrant their own scale (e.g. a hard
`critical` floor for coercion). Practitioner input wanted.
**Blocks:** cross-source severity comparison in FRS.

---

### OQ-08 🟠 — `AccessMode` as a single shared enum across ITC and COS
**Q:** ITC `RedemptionRecord.redemption_type` and COS `COSDistributionRecord.access_mode`
describe the same event. Confirm they are one enum, not two that happen to match.
**Recommendation:** one canonical `AccessMode` (done in enums spec). They are two views of
the §1.3 extinguishment event and must never diverge.
**Blocks:** the "credits extinguished on access" PoC loop.

---

### OQ-09 🟡 — `MaterialConsumptionEvent.source`: 2-value or derive from WP 4-value?
**Q:** §4.3 uses `internal | external_dependency`; WP COS uses 4-value `MaterialFlowSource`
(`internal_recycle | external_procurement | production_use | loss_scrap`).
**Recommendation:** store the richer 4-value WP enum; derive the coarse 2-value `source`
for the ITC contract. No information loss, and FRS gets recycle/scrap signal for free.

---

### OQ-10 🟡 — JSON Schema coverage of deferred module-internal objects
**Q:** This cut gives JSON Schema only to boundary-crossing records (~15 of ~80 WP
objects). When do the deferred module-internal objects (COS capacity/constraint/coop
records, ITC forecasting/equivalence, FRS modeling/memory/federation) get full schema?
**Recommendation:** per-system working groups produce them as their module leaves
`[DEFERRED]` status, validated against the enums + sub-objects ratified here. Tracked, not
dropped — this is the explicit no-silent-cap flag.

---

### OQ-11 🟠 — Enforcing the FRS "flags, never acts" boundary in schema
**Q:** `Recommendation.status` can be `pending→accepted`. What structurally prevents FRS
from writing `accepted`?
**Recommendation:** make `status` writable only by the target system / CDS, never by FRS —
enforced at the interface layer (`get_recommendation_status` is read-only for FRS).
Document as an access-control invariant, since §2.1 calls this boundary "structural, not
procedural" (anti-shadow-governance).
**Blocks:** the advisory-only guarantee.

---

### OQ-12 🟡 — Should Phase-1 facilitated deliberations log as `Module9Outcome` shape?
**Q:** The project already has a `sytengrity-sessions/2026-05-28-phase-1/` directory.
Should Phase-1 governance deliberations (including this schema's own ratification) be
recorded now in the `DecisionRecord` / `Module9Outcome` shape — i.e. use the CDS schema to
govern its own creation (the §6.3 "provisional precursor to CDS")?
**Recommendation:** yes — dogfood the CDS schema on Phase-1 decisions. It validates the
schema and produces the first real `DecisionRecord`s (DR-001+). Low cost, high signal.
**✅ ACTIONED:** `decisions/DR-001-adopt-schema-baseline/` records this exercise's own ratification
using the CDS schema. Building it surfaced + fixed a real gap (`DecisionRecord` was missing
`governance_scope`). All pipeline instances validate; objection mechanism blocked "ratify as final
now" because OQ-01/OQ-04 are open. Note: DR-001 is a *development-process* decision (adopts a review
baseline), not schema finalization — and its WG votes are flagged illustrative pending a real WG.

---

### OQ-13 🟠 — Recursive sub-node CDS: shared schema or distinct?
**Q:** Co-ops run their own scaled-down CDS and escalate to node level (Ep.59 30:37). Does a co-op
CDS reuse the *same* `Issue`/`DecisionRecord` schema with `governance_scope=coop`, or a distinct
sub-schema? **Source:** `sources/cds-video-ep59.md` R1.
**Recommendation:** one schema, discriminated by `governance_scope` + `escalated_from` lineage —
recursion is a data attribute, not a new type. Cheaper, and mirrors the node→network coordination-
envelope pattern. **Blocks:** any multi-co-op node (Phase 3+), not the Phase-2 single-loop PoC.

### OQ-14 🟠 — Participant weight: schema field vs. omit until needed?
**Q:** `Vote.weight` (Module-6 input #3) is "controversial," default 1.0, expert-edge-case only
(Ep.59 58:22). Carry the field now or defer? This is DEVGUIDE's "one-to-one question" / elitism
tension made concrete. **Source:** R5.
**Recommendation:** carry `weight` defaulting to 1.0 (so the consensus formula is complete and
federation records are uniform) but gate any non-1.0 value behind a ratified
`participant_weight_policy`. The field is cheap; retrofitting a weighting column into an append-only
ledger is not. Practitioner/Thinker input wanted on whether to allow it at all.

### OQ-15 🟡 — Are the gradient values + thresholds fixed or per-node policy?
**Q:** Frame 65 gives `strong_support=1.0 … block=-1.0`; thresholds `0.72/0.30`. The author says
these are node governance settings that "refine across the federation" (Ep.59 1:00:45). Schema
stores the enum; where do the numbers live? **Source:** R8.
**Recommendation:** numbers live in a `ConsensusPolicy` `PolicyRecord` (`support_gradient_map`,
`consensus_threshold`, `block_threshold`), not in code — so a node can tune them and the federation
can learn. Keep the `SupportLevel` *enum* canonical; let the *mapping* be policy.

### OQ-16 🟠 — `Scope` vs `GovernanceScope`: two axes, one mapping
**Q:** Propagating recursion (R1) across all five systems forced the question: FRS uses `Scope`
(`local|node|regional|federation`, white-paper canonical, a finding's *blast radius*); CDS+ now use
`GovernanceScope` (`coop|node|network`, the *recursion level that acts*). Are these one enum or two?
**This cut proposes:** **two distinct enums** + an explicit escalation mapping
(`local→coop, node→node, regional|federation→network`). FRS findings keep `scope`; the recursion
fields carry `governance_scope`; routing a finding *is* applying the map.
**Counter-argument to weigh:** a single unified scale (`coop|node|regional|network|federation`)
would remove the mapping but conflates blast radius with governance authority — they genuinely
differ (a node-wide blast radius can still be governed at co-op level if contained).
**Blocks:** correct escalation routing once co-ops + multi-node federation exist (Phase 3+); not the
Phase-2 single-loop PoC. Pairs with OQ-13.
**Deliberate non-additions to ratify:** `ITCAccount` has no `governance_scope` (single
non-transferable node balance; co-op view = ledger rollup); FRS `DiagnosticFinding`/`Recommendation`
carry `scope` only, not a duplicate `governance_scope`. Confirm both are intended.

### OQ-17 🟠 — `SubmissionType` has no "problem report" value
**Q:** The white-paper `SubmissionType` enum is `proposal | objection | evidence | comment | signal`.
But CDS Module 1's *core* input is people reporting a problem ("the footbridge floods") — which fits
none of those cleanly (it isn't a proposal, an objection to a scenario, evidence, an off-hand comment,
or a system signal). The data-flow simulator surfaced this: it emits `type: "concern"`, a value the
canonical enum doesn't contain. **Source:** `schemas/cds/submission.json`, simulator `cds_sim/llm.py`.
**This cut proposes:** add **`concern`** to `SubmissionType` (a member-raised problem report) as a
sixth value — already added to `00-canonical-enums.md` and `schemas/cds/submission.json` as a flagged
candidate so the simulator's submissions validate.
**Alternatives to weigh:** (a) fold problem reports into `comment` (loses the "this needs resolving"
signal that drives the pipeline); (b) treat every problem report as an implicit `proposal` to "do
something about X" (overstates intent — a report isn't yet a proposed action); (c) keep `concern` as
proposed here.
**Why it matters:** M1/M2 route and cluster by `type`; if "problem report" has no first-class value,
either intake mislabels its main input or every node invents its own ad-hoc value (exactly the
divergence the enum exists to prevent). It also interacts with the white-paper note that *problems*
and *proposals* are distinct intake kinds (DEVGUIDE §3.1 / CDS M1).
**Blocks:** nothing in the Phase-2 single-loop PoC (the candidate value works today); but it should be
ratified before multiple nodes/working groups submit against the enum, or the field's values fragment.

## Ratification path (suggested)

1. Per-system working groups review their spec (01–05) + relevant OQs.
2. Cross-cutting OQs (01, 04, 07, 08) go to a joint `#specifications` session.
3. 🔴 items (OQ-01, OQ-04) must close before Phase 2 (they are the §5.1 gate).
4. Each closed OQ becomes a `DR-###` decision record in `integral/decisions` — using the
   CDS schema this exercise just defined (OQ-12).
