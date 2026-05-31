# CDS — Collaborative Decision System Schema (Candidate)

**The keystone gap.** DEVGUIDE §4.3 schematizes records for OAD, COS, ITC, and FRS but
defines **no CDS records at all** — even though §3.1 makes CDS the priority system and
§4.4 references its `DispatchPacket`. This spec builds the CDS schema from the white
paper (`cds-02-architecture-code.md`), applying the minimal-build module selection from
DEVGUIDE §3.1.

**Minimal build (§3.1):** Modules 1, 2 (assisted), 6 (simplified), 7 (full principle),
8 (simplified) are *active*. Modules 3, 4, 5, 9, 10 are *deferred* — but their records
and the fields other records carry on their behalf exist from day one.

**Append-only principle (§3.1 Module 7):** every Issue, Submission, deliberation record,
and Decision is written to an append-only log. Minimal build uses append-only DB write
rules; the `prev_hash`/`entry_hash` fields exist now so cryptographic chaining is a
later policy change, **not a schema migration**.

---

## Record: `Issue` *(active — Module 1)*

The governance question. Root object of the pipeline.

```
Issue {
    issue_id            // [WP id] unique, generated at intake
    node_id             // [FED] originating node — federation-aware from day one
    governance_scope    // [SRC-ep59 R1] coop | node | network — recursion level this issue lives at
    coop_id             // [SRC-ep59 R1] nullable — owning co-op when governance_scope=coop
    escalated_from      // [SRC-ep59 R1] nullable issue_id — the lower-scope issue this was raised from
    title               // [WP]
    description         // [WP]
    created_at          // [WP]
    last_updated_at     // [WP]
    status              // [WP] IssueStatus enum
    priority            // [WP] routine | urgent — nullable
    tags                // [WP] dict<str,str> — [DEFERRED] semantic clustering populates this
    submission_ids      // [WP] list<submission_id> — ordered intake record
    federation_hash     // [FED][DEFERRED] cross-node verification hash
}
```
> **R1 — recursion (Ep.59 30:37–33:24).** Co-ops are sub-nodes with their own scaled-down CDS;
> issues escalate `coop → node → network`. The author calls this "implied but not quite clarified."
> `governance_scope` + `escalated_from` make the escalation lineage explicit and auditable, and
> mean the same schema serves every recursion level. Open question OQ-13.

## Record: `Submission` *(active — Module 1)*

Any input into an issue: proposal, objection, evidence, comment, or system signal.
The `signal` type is how FRS/ITC/COS findings enter governance (manually summarized in
the minimal build; live feed `[DEFERRED]`).

```
Submission {
    submission_id       // [WP id]
    issue_id            // [WP]
    node_id             // [FED]
    author_id           // [WP] node-id:participant-id — globally unique
    type                // [WP] SubmissionType enum (proposal|objection|evidence|comment|signal)
    content             // [WP]
    created_at          // [WP]
    source_system       // [DG] when type=signal: CDS|OAD|COS|ITC|FRS — null otherwise
    source_ref          // [DG] when type=signal: ref to the originating FRS packet / ITC flag
    embedding           // [SRC-ep59 R2][DEFERRED] vector for cosine-similarity dedup (Module 1)
    duplicate_of        // [SRC-ep59 R2] nullable submission_id — if flagged dup, points to the
                        //   retained canonical entry. Duplicates are LINKED, never discarded —
                        //   author+timestamp+metadata preserved (Ep.59 37:13).
    metadata            // [WP][DEFERRED] dict — normalization / dedup data
}
```
> **R2 — dedup is concrete (Ep.59 35:45–37:30).** Module 1 embeds each submission and compares
> against existing submissions on the same issue via cosine similarity; above a threshold it is
> flagged `duplicate_of` the canonical entry rather than dropped. `embedding` is `[DEFERRED]`
> (the field exists; the model wiring is later) but `duplicate_of` is active from day one so the
> linkage is never lost. **Evidence submissions are a pass-through** — they are not clustered by
> Module 2; they are indexed and consumed by Module 3 (Ep.59 39:05, 35:00).

## Record: `Scenario` *(active — Module 1/5)*

A candidate solution path for an issue. Votes and objections attach to scenarios.

```
Scenario {
    scenario_id         // [WP id]
    issue_id            // [WP]
    node_id             // [FED]
    label               // [WP]
    parameters          // [WP] dict — the concrete proposal content
    indicators          // [WP][DEFERRED] dict<str,float> — Module 4 constraint metrics
    origin              // [SRC-ep59 R3] ScenarioOrigin: submission | auto_generated | deliberation
    parent_scenario_id  // [SRC-ep59 R4] nullable — prior scenario this revises (5↔6 cycle lineage)
    revision_count      // [SRC-ep59 R4] int — times revised; feeds the Module-9 escalation trigger
    created_at          // [DG]
}
```
> **R3 — scenario provenance (Ep.59 24:38, 42:25).** Scenarios arrive three ways: the original
> intake (`submission`), the **Module 3→4 bridge step** that auto-generates candidates (`auto_generated`
> — the author calls this "an oversight of the paper," present in the orchestrator pseudocode but
> not the prose), and human invention in Module 5 (`deliberation`).
> **R4 — cyclical refinement (Ep.59 51:35, 1:04:48).** A *new or radically modified* scenario in
> Module 5 must re-run Modules 3+4 before re-admission. `parent_scenario_id` + `revision_count`
> capture that lineage; `revision_count` is the variable the addendum references for "persistent
> disagreement across cycles" → Module-9 escalation.

## Record: `Vote` *(active — Module 6)*

Gradient preference signal — **not** a binary ballot. Captures the §3.1 simplified-
consensus categories.

```
Vote {
    vote_id             // [DG id]
    issue_id            // [WP]
    scenario_id         // [WP]
    node_id             // [FED]
    participant_id      // [WP] node-id:participant-id
    support             // [WP] SupportLevel enum (strong_support..block) → numeric via policy map
    weight              // [SRC-ep59 R5] float, default 1.0 — Module-6 input #3. Equal by default;
                        //   >1.0 only via a CDS-ratified expertise policy for technical edge cases.
    comment             // [WP] reasoning behind the position
    conditions          // [DG] list<str> — conditions attached to a conditional approval
    created_at          // [WP]
}
```
> **R5 — participant weight (Ep.59 58:22–59:52).** `consensus_score = Σ(support×weight)/Σ(weight)`.
> The author flags weighting as "controversial," **default equal (1.0)**, justified only for
> domains needing proven expertise — the elitism-vs-competence tension in DEVGUIDE's Known Hard
> Problems. Modeled as a field defaulting to 1.0 and governed by a `PolicyRecord`, never set ad-hoc.
> Open question OQ-14.

## Record: `Objection` *(active — Module 6)*

A principled objection carrying severity and scope, so a `block` can be evaluated for
substance (the human-judgment step §3.1 keeps with the facilitator).

```
Objection {
    objection_id        // [DG id]
    issue_id            // [WP]
    scenario_id         // [WP]
    node_id             // [FED]
    participant_id      // [WP]
    severity            // [WP] float 0..1
    scope               // [WP] float 0..1
    description         // [WP]
    created_at          // [WP]
    resolved            // [DG] bool — whether facilitator judged it addressed
}
```

## Record: `ConsensusResult` *(active — Module 6, simplified)*

Output of consensus synthesis. In the minimal build the scores are produced by a human
facilitator using the same schema the algorithmic engine will later populate (§3.1).

```
ConsensusResult {
    issue_id            // [WP]
    scenario_id         // [WP]
    node_id             // [FED]
    consensus_score     // [WP] float 0..1   (human-synthesized in minimal build)
    objection_index     // [WP] float 0..1
    directive           // [WP] ConsensusDirective (approve|revise|escalate_to_module9)
    escalation_reason   // [SRC-ep59 R7] nullable EscalationReason — set when directive=escalate_to_module9:
                        //   revision_failure | unresolved_value_conflict
    required_conditions // [WP] list<str>
    synthesized_by      // [DG] participant_id of facilitator (audit of the human step)
    created_at          // [WP]
}
```
> **R6 — one ConsensusResult per scenario; the orchestrator selects (Ep.59 1:11:31).** Module 6
> emits a *list* of these (one per active scenario). A separate **orchestrator** step compares them:
> if ≥1 is `approve`, the highest-consensus / lowest-objection scenario wins → `DecisionRecord`;
> if all `revise`, the whole set returns to Module 5; if the best outcome is `escalate`, it routes
> to Module 9. The competing set is preserved on the `DecisionRecord` for audit (see below).
> **R7 — two escalation triggers (Ep.59 1:04:48–1:10:39).** `revision_failure` (persistent 5↔6
> cycling, gated by `Scenario.revision_count`) and `unresolved_value_conflict` (numerically
> approved but a sentimental/historical/cultural objection persists — routed via a constitutional
> appeal provision held in `PolicyRecord`).

## Record: `DecisionRecord` *(active — Module 7, full principle)*

**Non-negotiable, from day one (§3.1).** The canonical governance output. Append-only;
`rationale_hash` + `prev_hash`/`entry_hash` anticipate cryptographic chaining without a
schema change.

```
DecisionRecord {
    decision_id             // [WP id]
    issue_id                // [WP]
    scenario_id             // [WP]
    node_id                 // [FED]
    governance_scope        // [R1-prop] coop | node | network — level this decision governs
                            //   (inherited from the Issue; matches DispatchPacket targets' scope)
    status                  // [WP] DecisionStatus enum
    consensus_score         // [WP] float 0..1  (snapshot from ConsensusResult)
    objection_index         // [WP] float 0..1
    decided_at              // [WP]
    decided_by              // [DG] list<participant_id> — who finalized (audit trail)
    considered_scenario_ids // [SRC-ep59 R6] list<scenario_id> — the full competing set the
                            //   orchestrator chose from (winner is scenario_id above); losers
                            //   retained for transparency / Module-10 review
    consensus_results       // [SRC-ep59 R6] list — snapshot of each scenario's ConsensusResult
    rationale               // [DG] human-authored decision reasoning (the §3.1 judgment artifact)
    rationale_hash          // [WP] hash of the rationale + inputs
    supersedes_decision_id  // [WP] nullable — Module 10 amendment/revocation lineage
    // --- Module 10 review-trigger conditions, recorded from day one (§3.1) ---
    review_triggers         // [WP][DEFERRED-module] list<ReviewReason> conditions that should reopen this
    frs_monitor_keys        // [DG] list<str> — what FRS should watch as success/failure indicators
    // --- append-only ledger integrity ---
    prev_hash               // [DG][DEFERRED] previous record hash (chaining later)
    entry_hash              // [DG][DEFERRED] this record's hash
    created_at              // [WP]
}
```

## Record: `DispatchPacket` *(active — Module 8, simplified)*

**The primary contract between CDS and every other system** (§3.1, §4.4). Format is
standardized from day one even though the minimal build may have operators act on it
manually rather than via an automated API. Field names align with the §4.4
`notify_dispatch(dispatch_packet)` payload description.

```
DispatchPacket {
    packet_id           // [WP id]
    decision_id         // [WP] the DecisionRecord this implements
    issue_id            // [WP]
    scenario_id         // [WP]
    node_id             // [FED]
    created_at          // [WP]

    target_systems      // [DG] list<TargetSystem> — which systems must act

    // system-specific payloads (§4.4 DispatchPacket shape) — each nullable
    oad_flags           // [WP] dict — design mandates / standards / cert-policy changes for OAD
    tasks               // [WP] list<dict> — production / cooperative-formation directives for COS
    materials           // [WP] dict — resource requirements for COS
    schedule            // [WP] dict — scheduling windows / ordering for COS
    itc_adjustments     // [WP] dict — weighting / decay / access policy changes for ITC
    frs_monitors        // [WP] list<str> — monitoring params + success metrics for FRS

    acknowledgement_refs // [DG][DEFERRED] list — AcknowledgementRecord refs once APIs exist
    metadata            // [WP] dict — { consensus_score, generated_at, ... }
}
```

## Record: `PolicyRecord` / `DecayRule` *(active — CDS owns ITC policy)*

CDS is the policy authority for ITC (§2.1, DEVGUIDE §3.3). The `DecayRule` is the
specific, named policy object ITC accounts reference. **It exists in CDS's store from day
one** even though sophisticated decay policy is deferred — the minimal build just sets
conservative parameters (§2.4).

```
PolicyRecord {
    policy_id           // unique
    node_id             // [FED]
    system              // CDS|OAD|COS|ITC|FRS — which system this policy binds
    policy_type         // weighting | decay | fairness_threshold | access | anti_coercion | ...
    decision_ref        // the DecisionRecord that ratified this policy
    effective_from      // timestamp
    parameters          // dict — the bound parameter set
    superseded_by       // nullable policy_id
}

DecayRule (a PolicyRecord with policy_type=decay; parameters shape, per §2.4 / §3.3) {
    decay_half_life_days        // [WP] exponential half-life beyond grace
    decay_inactivity_grace_days // [WP] no decay within this window
    decay_min_balance_protected // [WP] protected floor
    decay_max_annual_fraction   // [WP] CDS safety bound on annual decay
}
```

**CDS-internal policy parameters** are *also* `PolicyRecord`s (Ep.59 confirms thresholds + gradient
are "node governance / prior CDS work," federated-calibratable — R8). Enumerated so the consensus
math has no hardcoded constants:

```
ConsensusPolicy (policy_type=consensus) {
    consensus_threshold         // [SRC-ep59] min consensus_score for approval (spec default 0.72)
    block_threshold             // [SRC-ep59] max objection_index before block (spec default 0.30)
    support_gradient_map        // [SRC-ep59] {strong_support:1.0, support:0.6, neutral:0.0,
                                //   concern:-0.4, block:-1.0} — the asymmetric scale (frame 65)
    revision_cycle_limit        // [SRC-ep59 R7] 5↔6 cycles before revision_failure escalation
    participant_weight_policy   // [SRC-ep59 R5] rules for any weight≠1.0 (default: all equal)
    value_conflict_appeal       // [SRC-ep59 R7] constitutional provision enabling Module-9 appeal
                                //   on an approved-but-value-conflicted decision
}
```
> These refine across the federation as nodes learn (Ep.59 1:00:45) — exactly the
> `[DEFERRED]`-federation-calibration pattern, with the parameter *fields* present from day one.
> The schema field names here are **identical** to the inline DecayRule summary on the
> ITC `ITCAccount` record (spec 03) — the account holds a snapshot, this is the
> authoritative policy record. They must stay in sync; see OQ-04.

---

## Deferred-module records (defined now; nullable / unpopulated in minimal build)

These exist so the append-only ledger never has to be re-formatted when the module ships.

| Record | Module | Why deferred (§3.1) | Carried fields that must exist now |
|--------|--------|---------------------|-----------------------------------|
| `StructuredIssueView` + `SubmissionCluster` | 2 | Automated semantic clustering deferred; humans structure issues | `Issue.tags`, cluster ids |
| `ContextModel` | 3 | Knowledge-integration engine deferred; reviewer does it manually | `evidence_refs` on findings |
| `ConstraintReport` | 4 | Automated constraint-checking deferred | `Scenario.indicators` |
| `DeliberationState` | 5 | Real-time deliberation workspace deferred | — |
| `Module9Outcome` | 9 | Syntegrity protocol deferred; facilitated deliberation only | recorded via Module 7 |
| `ReviewRequest` + `ReviewOutcome` | 10 | Review/override engine deferred | `DecisionRecord.review_triggers` |

### `Module9Outcome` *(deferred, schema present — §3.1 says data structures exist from day one)*
```
Module9Outcome {
    issue_id  scenario_id  node_id
    outcome_summary         // str
    modifications           // list<str>
    unresolved_notes        // str
    syntegrity_session_ref  // [DEFERRED] link to a Syntegrity session record (see sytengrity-sessions/)
    concluded_at
}
```
> Note: the project's own `sytengrity-sessions/` directory is the real-world analog of
> this record for Phase 1 governance. See OQ-12 on whether Phase-1 facilitated
> deliberations should already be logged in this shape.

### `ReviewRequest` *(deferred)* / `ReviewOutcome` *(deferred)*
```
ReviewRequest  { review_id issue_id decision_id reason(ReviewReason) submitted_by evidence_refs created_at }
ReviewOutcome  { review_id issue_id decision_id status(ReviewOutcomeStatus) amendments new_constraints rationale decided_at }
```

---

## Module-coverage summary

| Module | §3.1 status | Records | This spec |
|--------|-------------|---------|-----------|
| 1 Issue Capture | active | Issue, Submission | ✅ active |
| 2 Structuring | assisted | StructuredIssueView, SubmissionCluster | schema present, deferred |
| 3 Knowledge Integration | deferred | ContextModel | schema present, deferred |
| 4 Constraint Checking | deferred | ConstraintReport | schema present, deferred |
| 5 Deliberation | deferred | DeliberationState | schema present, deferred |
| 6 Weighted Consensus | simplified | Vote, Objection, ConsensusResult | ✅ active |
| 7 Decision Recording | full principle | DecisionRecord | ✅ active |
| 8 Dispatch | simplified | DispatchPacket | ✅ active |
| 9 Human Resolution | deferred | Module9Outcome | schema present, deferred |
| 10 Review/Override | deferred | ReviewRequest, ReviewOutcome | schema present, deferred |
