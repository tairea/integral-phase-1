# Integral · Phase 1 — Candidate Data Structures

**Phase 1 of Integral is a *data-structure proposal*: a concrete, reviewable set of contracts (JSON
Schemas) for the five systems that make a community run — offered to the collective to challenge,
refine, and ratify.**

This repo is how you review it. It gives you three ways in:

1. **[Interactive walkthroughs](https://tairea.github.io/integral-phase-1/)** — step through each
   system one decision at a time and watch exactly which data objects are created and updated.
2. **[The candidate data structures](#the-candidate-data-structures)** — the actual JSON Schemas, below, categorised by system.
3. **[A live simulator](#simulator)** — runs realistic participant input through the *real* contracts and validates every record against the schemas.

> **⚠️ Status: a proposed candidate — not ratified.** Nothing here is adopted. These are Phase-1
> candidate contracts put forward for the contributor community to review. The
> [open questions](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/07-open-questions.md)
> are deliberately still open — that's what Phase 1 is for.

---

## The five systems

Each walkthrough follows one node — **Stillwater** — and one thread (a flooding footbridge), so you
can see the systems hand data to one another in a closed cybernetic loop.

| | System | What it does | Walkthrough | Spec |
|---|--------|--------------|-------------|------|
| 🐴 | **CDS** | Collaborative Decision System — how the community decides | [▶ start](https://tairea.github.io/integral-phase-1/CDS-Start-Here/) | [01-cds.md](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/01-cds.md) |
| 📐 | **OAD** | Open Access Design — how things are designed & certified | [▶ start](https://tairea.github.io/integral-phase-1/OAD-Start-Here/) | [02-oad.md](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/02-oad.md) |
| ⏳ | **ITC** | Integral Time Credits — contribution & access | [▶ start](https://tairea.github.io/integral-phase-1/ITC-Start-Here/) | [03-itc.md](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/03-itc.md) |
| 🛠️ | **COS** | Cooperative Organization System — where work happens | [▶ start](https://tairea.github.io/integral-phase-1/COS-Start-Here/) | [04-cos.md](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/04-cos.md) |
| 📡 | **FRS** | Feedback & Review System — the nervous system | [▶ start](https://tairea.github.io/integral-phase-1/FRS-Start-Here/) | [05-frs.md](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/05-frs.md) |

---

## The candidate data structures

14 candidate contracts. Each links to its **JSON Schema** (the precise, reviewable artifact) and
lives under
[`integral-schema-exercise/schemas/`](https://github.com/tairea/integral-phase-1/tree/main/integral-schema-exercise/schemas).
Click any schema to read its fields, types, and constraints; the matching spec (above) gives the prose.

### 🐴 CDS — Collaborative Decision System
| Object | Schema | What it captures |
|--------|--------|------------------|
| **Issue** | [`cds/issue.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cds/issue.json) | A problem or proposal entering deliberation — the thing being decided. |
| **Submission** | [`cds/submission.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cds/submission.json) | A participant's structured input on an issue (proposal / objection / concern). |
| **DecisionRecord** | [`cds/decision-record.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cds/decision-record.json) | The ratified outcome of deliberation, with provenance back to its submissions. |
| **DispatchPacket** | [`cds/dispatch-packet.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cds/dispatch-packet.json) | The hand-off that routes a ratified decision to the system that will act on it. |

### 📐 OAD — Open Access Design
| Object | Schema | What it captures |
|--------|--------|------------------|
| **CertifiedDesign** | [`oad/certified-design.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/oad/certified-design.json) | A design that has passed review/certification and can be built against. |

### ⏳ ITC — Integral Time Credits
| Object | Schema | What it captures |
|--------|--------|------------------|
| **ITCAccount** | [`itc/itc-account.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/itc/itc-account.json) | A participant's time-credit account and balance. |
| **ITCLedgerEntry** | [`itc/itc-ledger-entry.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/itc/itc-ledger-entry.json) | A single append-only, hash-chained credit or debit on the ledger. |

### 🛠️ COS — Cooperative Organization System
| Object | Schema | What it captures |
|--------|--------|------------------|
| **LaborEvent** | [`cos/labor-event.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cos/labor-event.json) | A recorded unit of contributed work. |
| **MaterialConsumptionEvent** | [`cos/material-consumption-event.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/cos/material-consumption-event.json) | A recorded draw-down of materials/resources against a task. |

### 📡 FRS — Feedback & Review System
| Object | Schema | What it captures |
|--------|--------|------------------|
| **FRSSignalPacket** | [`frs/frs-signal-packet.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/frs/frs-signal-packet.json) | A normalized signal / observation entering the feedback system. |
| **DiagnosticFinding** | [`frs/diagnostic-finding.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/frs/diagnostic-finding.json) | An analyzed finding derived from incoming signals. |
| **Recommendation** | [`frs/recommendation.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/frs/recommendation.json) | A proposed corrective action emitted back into the loop — often seeding a new CDS Issue. |

### 🔗 Shared & cross-cutting
| | Where | What it is |
|--------|-------|------------|
| **Shared sub-objects** | [`shared/defs.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/shared/defs.json) | Reusable sub-structures referenced across all contracts. |
| **Canonical enums** | [`shared/enums.json`](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/shared/enums.json) · [spec](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/00-canonical-enums.md) | The single source of truth for every enumerated value. |
| **Cross-contract matrix** | [spec 06](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/06-cross-contract-matrix.md) | How objects reference each other across systems. |
| **Open questions** | [spec 07](https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/07-open-questions.md) | Unresolved design decisions — the heart of the review. |
| **Decision record** | [DR-001 — adopt schema baseline](https://github.com/tairea/integral-phase-1/tree/main/integral-schema-exercise/decisions/DR-001-adopt-schema-baseline) | The record proposing this baseline for adoption. |

Everything lives in
[`integral-schema-exercise/`](https://github.com/tairea/integral-phase-1/tree/main/integral-schema-exercise)
— `schemas/` (the contracts), `specs/` (the prose), `decisions/` (design records), `sources/` (grounding).

---

## Simulator

[`simulator/`](https://github.com/tairea/integral-phase-1/tree/main/simulator) pushes **realistic,
simulated participant input through the *actual* candidate CDS contracts** so the collective can watch
the Collaborative Decision System work — module by module — and review it. It is **not a mock**: every
`Issue`, `Submission`, `DecisionRecord`, and `DispatchPacket` it emits is **validated live against the
schemas above**. If a deliberation can't pass through the contracts, the run fails — which is the point:
*the simulator tests the data flow.*

- **Two backends, identical output:** a deterministic **offline model** (no key, fully reproducible — reviewers can re-derive every vote) and a **live LLM** mode (OpenRouter / DeepSeek by default, or Anthropic) where personas genuinely reason.
- **Five scenarios** to run it against: `footbridge`, `grain-mill`, `kitchen-hours`, `pump-failure`, `solar-rationing`.
- **Output:** a self-contained HTML report (`out/cds-run.html`) the collective reviews, plus a full JSON trace.

```bash
cd simulator
pip install -r requirements.txt
python run.py                 # offline, deterministic -> out/cds-run.html
python run.py --open          # also open the report
python run.py --live          # live LLM participants (needs a key in .env)
```

**▶ Full instructions, backends, and offline-vs-live notes:
[`simulator/README.md`](https://github.com/tairea/integral-phase-1/blob/main/simulator/README.md)**

---

## How this site is built (commit → deploy)

Everything for the walkthroughs lives in one folder, `integral-start-here/`:

```
integral-start-here/
  index.html                     the hub / landing page
  engine.css  engine.js          shared engine, generated from the CDS template by build.py
  build.py                       extracts the engine from the CDS template + regenerates each thin page
  assemble_site.py               assembles the deployable static site into ../_site/
  CDS-Start-Here/index.html      the CDS walkthrough — self-contained, AND the engine's source template
  OAD/ITC/COS/FRS-Start-Here/    thin index.html + data.js (per-system content over the shared engine)
integral-schema-exercise/        the candidate schemas, specs, decisions, and sources
simulator/                       the data-flow simulator (Python)
.github/workflows/deploy.yml     the build-and-deploy Action
```

A GitHub Action runs `build.py` + `assemble_site.py` and deploys to GitHub Pages on **every push to
`main`** — commit → deploy. The built site is never committed; CI assembles it. To preview locally:
`python3 integral-start-here/build.py && python3 integral-start-here/assemble_site.py`, then open
`_site/index.html`.

## Provenance

Grounded in Integral's [Technical White Paper](https://github.com/Integral-Collective/integral-whitepaper),
[Developer Guide](https://github.com/Integral-Collective/integral-devguide), and the author's walkthrough
(Revolution Now! Ep. 59). Candidate work for the Integral collective.
