# Integral — Phase 1 Schema Design Exercise (Candidate)

**Status:** Candidate work for community deliberation. **Not ratified.**
**Scope:** The Phase 1 *schema design exercise* described in DEVGUIDE §5.1 — the
condition for Phase 2 to begin.
**Authored:** 2026-05-30, as a proposal to bring to the contributor community
(per the "Proposing candidate work" framing — nothing here is unilaterally adopted).

---

## What this is

DEVGUIDE §5.1 names one concrete technical deliverable for Phase 1:

> a ratified, complete schema for each system — with all deferred fields present
> as typed, nullable placeholders — before the first line of production code is
> written … Its completion is a condition for Phase 2 to begin.

This repository is a **first complete candidate** for that schema set. It reconciles:

1. **DEVGUIDE §4** — the consolidated Phase-2 data contracts (8 records + 12
   cross-system contracts + the §4.4 interface signatures), and
2. **The Technical White Paper §7 module specs** — the un-consolidated object/field
   inventory for all five systems (CDS, OAD, ITC, COS, FRS),

and for every object and every field asks the §5.1 question:

> *will the full system eventually need this, and if so, is it represented in the schema?*

## The discipline applied here

Three rules, taken from DEVGUIDE §1.2, §4.2, and §4.3:

- **Every field the full system will ever need exists from day one** — active if it
  is in the minimal slice, or marked `[DEFERRED]` (typed, nullable) if its module is
  deferred. A *module* can be deferred; its *data structure* cannot.
- **Federation-aware from day one** (§4.2). Every participant reference is
  `node-id:participant-id`. Every record carries `node_id`. Cross-node fields
  (`federation_hash`, `federation_scope`, `scope`) exist as nullable placeholders.
- **Consolidation is preserved, not erased.** Where the devguide collapses several
  white-paper objects into one Phase-2 record (e.g. `CertifiedDesign`), every source
  object and field is traced in a provenance note so the un-consolidation path is
  recoverable.

## What is in scope vs. deliberately bounded

**In scope (this cut):** the complete schema for every record that **crosses a system
boundary** — these are the contracts §4 exists to protect, and the ones whose later
incompatibility §4.1 calls "catastrophic." That includes the 8 devguide records, the
**entire CDS core** (which the devguide never schematized), and the shared sub-objects
and enums.

**Bounded, with provenance kept (not dropped):** the dozens of *module-internal*
objects the white paper defines (COS alone defines 43). These are captured in full in
each system's `specs/0X-*.md` inventory so nothing is lost, but only the
boundary-crossing subset gets a machine-checkable JSON Schema in this first cut. This
is a deliberate scoping choice for a Phase-1 *candidate*, flagged openly here rather
than presented as total coverage. Promoting internal objects to full JSON Schema is
tracked in `specs/07-open-questions.md`.

## Layout

```
specs/
  00-canonical-enums.md      Shared + per-system enums (single source of truth)
  01-cds.md                  CDS schema — built from the white paper (devguide gap)
  02-oad.md                  OAD schema — CertifiedDesign + un-consolidated provenance
  03-itc.md                  ITC schema — accounts, ledger, valuation, decay, policy
  04-cos.md                  COS schema — labor/materials/QA + full 43-object inventory
  05-frs.md                  FRS schema — envelope/packet/finding/recommendation
  06-cross-contract-matrix.md  The 12 data contracts + §4.4 interfaces, field-checked
  07-open-questions.md       Every decision that needs community ratification
schemas/
  shared/                    Shared enums + sub-objects as JSON Schema
  cds/ oad/ itc/ cos/ frs/   JSON Schema (Draft 2020-12) for boundary-crossing records
sources/                     Provenance notes (white-paper + video extraction summaries)
decisions/                   Append-only governance record (DR-001+), per DEVGUIDE §6.2
  DR-001-adopt-schema-baseline/   The schema's own ratification, recorded *with* the CDS schema
    DR-001.md                       human-readable decision record (+ honesty framing)
    build_and_validate.py           constructs + validates the full pipeline; real hashes
    instances/*.json                schema-valid Issue→…→DecisionRecord→DispatchPacket
```

## How to read it

- **Non-technical contributors:** read the `specs/0X-*.md` files. Every field has a
  plain-language purpose; `[DEFERRED]` marks "exists but not filled in yet."
- **Builders:** the `schemas/**/*.json` files are the machine-checkable contracts.
  `specs/06-cross-contract-matrix.md` shows which record flows between which systems.
- **Thinkers / Practitioners:** `specs/07-open-questions.md` is where the genuinely
  contested schema decisions are surfaced for deliberation.

## Provenance key (used throughout)

| Tag | Meaning |
|-----|---------|
| `[WP]` | Field/object originates in the white paper module spec |
| `[DG]` | Field originates in DEVGUIDE §4 (devguide extension, noted where not in WP) |
| `[DEFERRED]` | Module not in minimal build; field present but nullable |
| `[FED]` | Federation field; mostly null in single-node Phase 2 |
| `[CONSOLIDATED ← X]` | This field was lifted from white-paper object X |
