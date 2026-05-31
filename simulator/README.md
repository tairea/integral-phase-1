# CDS Data-Flow Simulator

Pushes **realistic, simulated participant input** through the **actual candidate CDS contracts**
(`../integral-schema-exercise/schemas`) so the collective can watch the Collaborative Decision
System work — module by module — and review it.

It is not a mock of the pipeline. Every `Issue`, `DecisionRecord`, and `DispatchPacket` it emits is
**validated live against the real schemas**. If a deliberation can't pass through the contracts, the
run fails — which is the point: *the simulator tests the data flow.*

## Run it

```bash
cd simulator
pip install -r requirements.txt          # jsonschema + referencing (anthropic optional)
python run.py                            # offline, deterministic — writes out/cds-run.html
python run.py --open                     # also open the report in your browser
python run.py --live                     # LIVE LLM participants (OpenRouter / DeepSeek by default)
python run.py --live --scenario scenarios/grain-mill.json
python run.py --live --provider anthropic --model claude-sonnet-4-6   # alternative provider
```

**Live mode setup.** Put your key in a gitignored `.env` beside `run.py`:

```
OPENROUTER_API_KEY=sk-or-...        # default provider; model deepseek/deepseek-v4-flash
# ANTHROPIC_API_KEY=sk-ant-...      # if using --provider anthropic
```

`run.py` loads `.env` automatically. The OpenRouter backend uses only Python stdlib (no extra deps).
Live runs are **stochastic** — the LLM personas reason freely, so outcomes can differ run to run and
from the offline model (see "Offline vs live" below).

Outputs:
- `out/cds-run.html` — the **self-contained report** the collective reviews (no assets, no server).
- `out/cds-run.json` — the full machine trace (every module's input→output).

## Two participant backends, identical output shape

| Backend | When | How participants behave |
|---------|------|-------------------------|
| **offline-model** (default) | no key needed; reproducible | each persona's reaction = dot(their concern-weights, each scenario's declared dimension impacts) → preference gradient + principled objections. Transparent and deterministic, so reviewers can re-derive every vote. |
| **openrouter** (`--live`, default) | `OPENROUTER_API_KEY` set | DeepSeek v4 Flash (`deepseek/deepseek-v4-flash`) roleplays each persona from their `voice`, returning the same structured submissions/objections/votes. Stdlib HTTP, no extra deps. |
| **anthropic** (`--live --provider anthropic`) | `ANTHROPIC_API_KEY` set | Claude roleplays each persona; shared context is prompt-cached. |

The pipeline is identical regardless of backend — it only consumes the structured inputs. The live
backends return free-form JSON which is extracted, validated, and coerced (bad ids dropped, support
clamped to the enum, severity/scope clamped to 0–1); a parse failure falls back to the offline model
for that stage so a run always completes.

### Offline vs live (what we observed with DeepSeek v4 Flash)

The mechanisms are identical; the *outcomes* can differ, because the live personas genuinely reason:

| Scenario | Offline (tuned) | Live (DeepSeek) |
|----------|-----------------|-----------------|
| footbridge | P1 approved @0.92 | P1 approved @0.84 |
| solar-rationing | gridlock → all revise | gridlock → all revise |
| pump-failure | C1 wins on tie-break vs C2 | C1 approved @0.92 (C2 strongly rejected — no tie-break) |
| grain-mill | A1 **escalates to Module 9** | A1 → **revise** (only reached 0.48 consensus, so not "approvable-but-for-the-value-conflict"; Beatrice's value-conflict objection still fired and blocked it) |

This is the point of live mode: the value-conflict objection, the consensus math, the constraint
gates all fire correctly — but *which path a deliberation takes is decided by the deliberation, not a
script*. The offline model is tuned to guarantee each teaching outcome; the live LLM finds its own.

## What you see in the report (the inner workings)

The eight CDS modules, in order, each showing its real input→output:

1. **M1 Intake** — raw submissions in; **dedup** (near-duplicate "cut off" reports merged, links kept).
2. **M2 Structuring** — submissions clustered into themes (evidence passes through to M3).
3. **M3 Context** — the factual landscape pulled from the other four systems.
4. **M4 Constraints** (+ the **bridge step** that auto-generates extra scenarios) — each scenario
   checked against ecological / accessibility / labor / heritage constraints; pass/fail + required
   reviews.
5. **M5 Deliberation** — the participant matrix: every persona's preference gradient on every
   scenario (hover for reasoning) + the **objection map** (severity × scope), value-conflicts flagged.
6. **M6 Weighted Consensus + Orchestrator** — the asymmetric gradient (`1 / .6 / 0 / -.4 / -1`) and
   the `0.72 / 0.30` thresholds applied; consensus & objection bars per scenario; the winner selected.
7. **M7 Decision Record** — append-only record with real `rationale_hash` + `entry_hash`.
8. **M8 Dispatch** — the packet to OAD/COS/FRS, with the FRS monitors that **close the loop**.

Plus, when consensus isn't reached:
- **`↻ REV`** — the revision step: which scenario was refined, which dimension was eased, and the new
  versioned scenario id + parent lineage (e.g. `B2` → `B2.r2`). The round-tagged modules that follow
  (`M4·r2`, `M5·r2`, `M6·r2`) re-run on the revised set.
- **`↻ CAP`** — the hard `MAX_ROUNDS` cap (default 3); persistent disagreement escalates to Module 9
  rather than looping forever.

### Schema visibility (for the collective to review)

Every module card carries a **"📦 schema objects produced / updated at this step"** panel showing:
- which object(s) the step emits, and whether each is a **ratified JSON-Schema contract — validated
  live** (green) or a **proposed shape with no JSON-Schema yet** (amber — an improvement area);
- an expandable view of the actual object JSON (so reviewers see exactly which fields are populated,
  including `null`/`[DEFERRED]` contract fields);
- where the same object is *mutated* across steps (e.g. `Issue.status: intake → decided`).

A **Schema coverage** banner at the top summarizes the whole run: how many object types are
ratified+validated vs proposed-shapes-needing-schema. In the current build that's **3 ratified**
(`Issue`, `DecisionRecord`, `DispatchPacket`) vs **8 proposed shapes** (`Submission`,
`StructuredIssueView`, `ContextModel`, `Scenario`, `ConstraintReport`, `Vote`, `Objection`,
`ConsensusResult`) — i.e. the exact list of objects the collective should formalize next. This makes
the report double as a **schema-coverage review tool**, not just a deliberation viewer.

### The revision loop is bounded (no infinite loop)

`MAX_ROUNDS` (in `pipeline.py`, default 3) caps the M5↔M6 cycle. Each round, the facilitator
deterministically applies a scenario's `required_modifications` (eases its worst-objected / most-
negative dimension). If a scenario converges to consensus it's approved (see `kitchen-hours`); if no
scenario converges within the cap, the issue escalates to Module 9 under the persistent-disagreement
trigger (see `solar-rationing`) — the loop can never run unbounded.

## Scenario catalog

Five personas (engineer, ecologist, elder/heritage-keeper, access coordinator, labor-steward)
deliberate each. Run any with `--scenario scenarios/<file>`. Each was tuned to exercise a **different
CDS outcome**, so together they cover the pipeline's main paths:

| Scenario | Tests | Outcome |
|----------|-------|---------|
| `footbridge.json` | clean approval + constraint filtering + objection map | retrofit-in-place **approved** (0.92); demolish option blocked (ecological budget + heritage objection); reroute fails the accessibility floor |
| `grain-mill.json` | **Module-9 value-conflict escalation** | mill-conversion is popular (0.80) but a heritage value-conflict objection (0.42) blocks it → **routed to Module 9 (Syntegrity)**, no auto-decision — the CDS refuses to override a principled value conflict |
| `solar-rationing.json` | **bounded revision loop → cap → escalation** | a zero-sum split where every option fails a constraint or consensus. The lead option is refined for `MAX_ROUNDS` (3) rounds without converging → hits the hard cap → escalates to Module 9 under the *persistent-disagreement* trigger. **Demonstrates the infinite-loop guard.** |
| `pump-failure.json` | **FRS-originated intake + orchestrator tie-break** | the issue starts as an FRS *signal*; **two** options clear consensus → the orchestrator selects the one with the lower objection index (repair+redundancy over the new controller, whose cost drew a non-blocking objection) |
| `kitchen-hours.json` | **productive convergence** | a popular option is blocked round 1 by a single (non-value) cost objection → the facilitator eases that dimension → it **approves in round 2** (`D1` → `D1.r2`). Shows the revision loop *working*, and a Scenario object being versioned across rounds. |

Write another JSON to the same shape to simulate any issue. Each scenario declares the candidate
options' impact on six decision dimensions, the constraints, and the `intake` submissions (including
system signals and intentional near-duplicates to exercise M1 dedup).

## What this already found

On its first run the simulator surfaced a real contract defect: `DispatchPacket.target_systems`
reused FRS's `TargetSystem` enum, which has **no `FRS`** value — so a dispatch *to* FRS (the
`frs_monitors` channel, §2.3) could not be expressed. Fixed in the schema repo by introducing a
distinct `SystemId` enum. This is exactly why the data flow gets simulated before it gets built.

## Layout

```
run.py                     CLI
cds_sim/schema.py          binds + validates against ../integral-schema-exercise/schemas
cds_sim/personas.py        5 personas: voice (for LLM) + concern-weights (for offline model)
cds_sim/llm.py             LiveLLM (Anthropic) + ModelLLM (offline), same output contract
cds_sim/pipeline.py        the CDS Module 1→8 engine + trace, faithful to specs/01-cds.md
cds_sim/report.py          renders the trace → self-contained HTML
scenarios/footbridge.json  seed issue (copy the shape for new ones)
out/                       generated report + trace
```
