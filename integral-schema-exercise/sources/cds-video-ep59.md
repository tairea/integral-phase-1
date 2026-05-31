# Source: "Revolution Now! Ep. 59 — Integral's CDS, Explored" (Peter Joseph)

- **URL:** https://youtu.be/NPaBrjjVCtE
- **Author:** Peter Joseph (Integral white-paper author) · **Uploaded:** 2026-04-19 · **Length:** 76.8 min
- **Why it matters:** the author's own module-by-module CDS walkthrough, explicitly flagging
  "caveats and gaps in the white paper." Primary-source authority for refining `specs/01-cds.md`.
- **Ingested:** 2026-05-30 via /watch (native captions; frames 63–65 carry the key on-screen artifacts).

## Schema-relevant claims (with timestamps)

### Confirmations (schema already correct)
- **[46:49–47:00]** Module 5 → 6 hands three things: active scenarios, objections (mapped),
  support gradients. → matches `Scenario` / `Objection` / `Vote`.
- **[55:54–58:08]** Objection carries **severity** (0–1) and **scope** (0–1); objection_index =
  `max(severity × scope)`. → matches `Objection.severity`/`scope`.
- **[28:38–29:23]** CDS does **not** self-monitor; it *responds* to alerts from FRS (holistic) +
  OAD/COS/ITC (internal). → matches `Submission.type=signal` + `source_system` + contract #8.
- **[27:26–27:47, 1:13:46]** Module 7 metadata must be "sound and reviewable" because Module 10
  review depends on it. → matches append-only `DecisionRecord` + `review_triggers`.

### On-screen artifacts (frames)
- **[~1:01:00, frame 65]** Canonical **asymmetric** support gradient:
  `strong_support=1.0, support=0.6, neutral=0.0, concern=-0.4, block=-1.0`.
  Asymmetry intentional — block carries disproportionate negative weight.
- **[~1:03, frame 63]** Module-6 pseudocode: `ConsensusResult(issue_id, scenario_id,
  consensus_score, objection_index, directive, required_conditions, metadata{reason})`.
- **[~1:00, frame 64]** "Threshold parameters set by **Node governance (Prior CDS work)**;
  applied Consensus = 0.72 & Block = 0.30." → thresholds are **policy**, not constants.

### Gaps / refinements the author names (→ schema changes)
1. **[30:37–33:24] Recursive sub-node CDS.** Co-ops are "sub-nodes" with their own scaled-down
   CDS; issues escalate co-op → node → regional network via coordination envelopes. "Not quite
   clarified in the current documentation, even though it is implied." → **R1: governance scope +
   escalation lineage on every CDS object.**
2. **[35:45–37:30] Module-1 dedup is concrete.** text→embedding → cosine similarity vs existing
   submissions on same issue → threshold → flag duplicate. Duplicates **not discarded**: original
   kept canonical, duplicate stored as linked reference w/ author+timestamp+metadata. → **R2:
   `Submission.duplicate_of` + retained dup records + `embedding` [DEFERRED].**
3. **[24:38–25:21, 42:25–43:18] The bridge step is real and was a "paper oversight."** Auto-
   generated candidate scenarios between Module 3 and 4 — in the orchestrator pseudocode but not
   the prose. Scenarios originate 3 ways: initial submission, auto-bridge, invented in Module 5.
   → **R3: `Scenario.origin` enum.**
4. **[51:35–53:37, 1:04:48–1:05:36] Cyclical routing.** Module 5 routes *new/radically-modified*
   scenarios back through Modules 3+4 before re-admitting; revise loops 5↔6. → **R4:
   `Scenario.parent_scenario_id` + `revision_count`.**
5. **[58:22–59:52] Participant weight (Module-6 input #3).** Default 1.0/equal; used only in
   expert edge cases; "controversial." Author: "should have specified the conditionality more
   carefully." → **R5: `Vote.weight` (default 1.0, policy-governed).**
6. **[1:11:31–1:13:20] The orchestrator selects across scenarios.** Module 6 emits a *list* of
   `ConsensusResult` (one per scenario); a separate **orchestrator** step picks the winner
   (highest consensus, lowest objection) and breaks ties. → **R6: `DecisionRecord` records the
   competing set, not just the winner.**
7. **[1:04:48–1:10:39] Module-9 escalation has TWO triggers** ("murky in the white paper"):
   (a) persistent revision failure across cycles (needs a cycle-count threshold); (b) unresolved
   *value conflict* even when numerically approved (sentimental/historical/cultural). A
   constitutional appeal provision can route an approved-but-value-conflicted decision to Module 9.
   → **R7: `escalation_reason` enum + `revision_cycle_count` + value-conflict appeal as policy.**
8. **[59:52–1:01:01, 1:00:45] Thresholds + gradient are node-governance policy**, federated-
   calibratable across nodes. → **R8: enumerate CDS `PolicyRecord` parameter types.**

### Framing (validates the exercise's method)
- **[1:13:57–1:16:06]** "The structure is organized primarily by function… but the way those
  functions are combined and implemented doesn't have to look anything like the pseudocode." LLMs
  are "the secret sauce." → **Lock the data contracts (functional boundaries); stay implementation-
  agnostic.** This is exactly the schema-exercise discipline — and a caution not to over-fit the
  schema to the linear pseudocode pipeline.
