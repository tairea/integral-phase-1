# ValueFlows → Integral: a deep read of the mapping

> **Deep research note.** A close reading of the proposed mapping between **ValueFlows (VF)** and
> **Integral**, grounded in the Integral Technical White Paper, the Dev Guide, and the ValueFlows
> specification. This is the long-form analysis behind the working-group proposal
> (`../html-artifacts/valueflows-integral-proposal.html`).
>
> **Sources read:**
> - The mapping itself — [`valueflows/valueflows-mappings/integral-vf.md`](https://codeberg.org/valueflows/valueflows-mappings/src/branch/main/integral-vf.md) and all five of its diagrams (incl. the full `Integral-Valueflows-2.png` master, read section by section)
> - The ValueFlows model — [valueflo.ws/specification/model-text](https://www.valueflo.ws/specification/model-text/) and its seven model diagrams (recipe, planning, observation, resource, agent, proposal, misc)
> - Integral **Technical White Paper** v0.1 (§4.5, §5.4, §10, §11) and **Dev Guide** (§1.2, §4.1–§4.3, §5.1, module specs)

---

## 1. What this mapping actually is

The mapping (`integral-vf.md`) is short prose plus one large UML-style class diagram
(`Integral-Valueflows-2.png`) and four supporting VF diagrams. It is authored from the **ValueFlows
side**, working against Integral's *Dev Guide schemas* — it quotes `CertifiedDesign`, `LaborEvent`,
`MaterialConsumptionEvent`, `ITCAccount`, and `ITCLedgerEntry` field by field — not the white-paper
theory.

The author is explicit about its status:

> *"This is almost certainly not correct right now, but hopefully gives the basic ideas. A more exact
> mapping can happen later."*

Treat it as a **feasibility sketch**, not a spec. The single most important structural fact: it maps
**only three of Integral's five subsystems** — OAD, COS, ITC. **CDS and FRS are entirely absent**, and
that omission turns out to be the most revealing thing in the whole document (§5 below).

---

## 2. The foundational fit is genuinely good

ValueFlows is **REA** (Resources–Events–Agents) plus an **IPO** (Input-Process-Output) pattern,
organised across three layers. That triple-layer structure is what makes it line up with Integral's
pipeline cleanly:

| VF layer | Meaning | Integral equivalent |
|---|---|---|
| **Knowledge** | classifications, recipes, rules, patterns | **OAD** — the certified design commons + resource/process taxonomies |
| **Plan** | offers, requests, schedules, promises | **CDS-authorised production plans + COS planning** (Commitments, Intents, Plan-from-Recipe) |
| **Observation** | what really happened | **COS execution + the ITC ledger** (EconomicEvents acting on EconomicResources) |

Integral's value loop — *OAD design → COS production → ITC accounting* — is literally a
knowledge→plan→observation traversal. REA's core sentence (*"agents perform economic events that
provide inputs to processes and take outputs from processes and move economic resources"*) is a
restatement of COS as the operational engine. The fit at this level is not forced.

---

## 3. The three mapped subsystems, precisely

### 3.1 OAD ↔ Recipe / knowledge layer

`CertifiedDesign` maps to a VF **Recipe**, decomposed into **RecipeProcess** nodes and **RecipeFlow**
inputs/outputs, with **ResourceSpecification** and **ProcessSpecification** carrying the user-defined
taxonomies. The author's notes:

- Recipes handle `bill_of_materials` and `production_steps`; input flows handle consumables, work,
  equipment usage.
- **Critically:** *"In VF, recipes are thought of more like templates to generate repeatable plans,
  rather than designs. Designs might be CAD files, etc., and would show lineage just like other
  economic resources."*

That is a sharp distinction. Integral folds "the blueprint" and "the production template" into one
`CertifiedDesign` object. VF splits them: the **Recipe** is the executable template; the **design
artefact itself** (CAD file, doc) is just another EconomicResource with version lineage. This is
arguably *cleaner* than Integral's schema — it separates OAD's two jobs (being a knowledge artefact
vs. driving production), and `design_lineage` / `superseded_by` map naturally onto resource lineage.
Costs (the §4.5 "True Economic Calculation" inputs) come from *instantiating a Plan from the Recipe
so quantities multiply out* — exactly Integral's BOM × target-quantity step.

> One thing VF will **not** do for us: enforce that production may only use a *certified* design.
> Per Dev Guide OAD Module 9, *"Uncertified designs cannot enter production. This constraint is
> enforced architecturally."* That gate is an Integral rule and must live in our layer above VF.

### 3.2 COS ↔ EconomicEvent + planning layer

This is the richest part of the mapping and where VF is strongest. Both `LaborEvent` and
`MaterialConsumptionEvent` collapse to a **single VF class — `EconomicEvent`** — distinguished only
by their **Action**:

- `LaborEvent` → an event with the **`work`** action
- `MaterialConsumptionEvent` → an event with the **`consume`** action
- equipment/tool wear → **`use`**; referencing a design → **`cite`**; output → **`produce`**

The author's note nails the elegance: *"All actions know how they should affect economic resources…
inventory is maintained automatically by the economic events; in fact it cannot be changed without an
economic event."* This is the REA "no inventory mutation without a recorded event" invariant — which
is **exactly Integral's non-negotiable append-only-ledger principle**. They arrive at the same
constraint from opposite directions: VF as accounting hygiene, Integral as anti-accumulation
architecture. VF's `corrects` self-relation on EconomicEvent even matches Integral's "corrections are
themselves new ledger entries" rule.

The planning layer (**Plan → Process → Commitment**, with **Intent** for un-paired offers) covers
COS's task planning, skill matching, and capacity signalling. `production_plan_ref` / `task_ref` in
the Integral schemas become VF Commitment/Process references.

### 3.3 ITC ↔ EconomicResource + raise/lower/consume events

The most conceptually interesting mapping, and the one most at risk of being misread.

`ITCAccount` maps to an **EconomicResource** — *"In VF, accounts are economic resources, just like
material stocks, since they have very similar behaviour."* The dynamics:

- **Credit issuance** = a *reciprocal* EconomicEvent paired to the work event. Per the mapping's own
  note: *"The raw work hours would be entered as an economic event in COS… some logic would calculate
  the credits from the work hours… the credits would be another economic event, reciprocal to the
  work event. There could be an Agreement in the planning layer… Another entity called Claim might be
  involved."*
- **Decay** = *"an economic event, generated by the system based on the rules."*
- **Extinguishment / access redemption** = an EconomicEvent that **consumes / lowers** the balance.

---

## 4. The single best idea: non-transferability as an action-set constraint

The deepest insight in the entire mapping — though the author doesn't state it outright — hides in
VF's action vocabulary. VF distinguishes **`raise` / `lower`** (change a resource quantity *in place*)
from **`transfer` / `move` / `copy`** (hand a resource *to another agent*). Integral's defining ITC
property — `transferable: false`, non-savable, extinguished-on-use — becomes a clean, **checkable**
statement in VF terms:

> The ITC-account ResourceSpecification is **only ever** the object of `raise` (issue),
> `lower` / `consume` (decay, extinguish) — and is **never** the object of `transfer` / `move` /
> `copy`.

Non-transferability stops being a special-cased boolean and becomes a constraint on the allowed
action set — a stronger, more native, and auditable expression of the principle than a flag someone
could flip. This aligns with what the white paper and Dev Guide already demand:

- White Paper: *"Non-transferable time credits prevent accumulation and eliminate the possibility of
  converting contribution into long-term power"*; *"extinguishing of credits upon use, preventing
  accumulation, trade, speculation, or conversion into power."*
- Dev Guide: *"These four properties — honest recording, embodied valuation, decay, and
  non-transferability — are the ITC's foundational principles… None of them are deferrable."* And:
  *"Credits must not be transferable between participants, even in the prototype."*

---

## 5. What's *not* mapped — and why that's the real finding

**CDS (governance) and FRS (cybernetic feedback) have no mapping, and shouldn't.** ValueFlows is a
*resource-flow accounting ontology*. It describes what is planned and what happened to resources,
agents, and events. It has no vocabulary for:

- **CDS** — democratic deliberation, weighted consensus, objection mapping, proposal authorisation.
  VF's nearest neighbours are **Proposal** (a bundle of Intents = an offer/request) and **Agreement** —
  but those are *commercial* offer/accept primitives, not collective decision-making. A CDS "ratified
  decision dispatching a packet to another system" has no REA analog, because authorising action is
  not a resource flow. And crucially, per Dev Guide §4.2, *"ITC does not set its own policy — CDS
  does"*: CDS is what sets the weighting and decay rules ITC then executes.
- **FRS** — diagnostics, pathology detection, recommendations, threshold monitoring. VF is
  *descriptive*, not *normative/corrective*. FRS **reads** the VF observation layer as its raw signal,
  but its judgments live entirely outside VF. The Dev Guide is emphatic that FRS *"flags the
  divergence. It does not pull the trigger"* — exactly the kind of normative authority VF has no way
  to express.

Map this to the white paper's village (§2): VF cleanly covers the **communal ledger** (ITC), the
**shared design notebook** (OAD), and the **rotating work-team** coordination (COS). It says nothing
about the **open meetings** (CDS) or the **household feedback visits** (FRS). That is not a gap in
either system — it is a clean **scope boundary**. VF is the *metabolic and accounting substrate*;
CDS/FRS are the *cognitive and nervous-system layers* that sit above it. The honest conclusion: **VF
is a candidate standard for three of Integral's five organs, not a replacement for the architecture.**

---

## 6. The tensions worth flagging

### Tension 1 — Value-neutrality vs. a post-monetary thesis
VF is deliberately ideology-agnostic — it models a capitalist market as easily as a commons. Its
ResourceSpecification carries a **`mediumOfExchange`** flag and a **`substitutable`** flag; its
Proposals can encode price-like reciprocal Intents. Adopting VF wholesale risks importing
market-shaped affordances into a system whose entire thesis (White Paper §3, §4.5) is escaping
price-mediated coordination — *"price signals… reflect only the willingness and ability to pay."* The
Dev Guide names this exact failure mode (§1.2): approximating a foundational principle away is *"not a
simplification — it is a corruption… a different system with Integral's name."*
**Mitigation:** adopt VF as a *constrained profile* — ITC resources flagged non-`mediumOfExchange`,
never the object of a transfer action (§4).

### Tension 2 — The valuation function is Integral-specific policy VF doesn't express
VF gives `effortQuantity` and `resourceQuantity` on every event — the raw labour-hours and material
amounts. But Integral's `itc_weight_multiplier`, `itc_weight_breakdown`, and skill-tier/difficulty/
urgency weighting (White Paper §5.4, §7.3) is a *transform applied on top*. The mapping correctly
externalises this — *"some logic that would calculate the credits from the work hours"* — but it means
VF carries the **substrate**, not the **economics**. This mirrors the Dev Guide's own insistence
(§4.3) that raw `LaborEvent` capture stay *"value-neutral until weighting is applied."* VF does not
solve True Economic Calculation; it gives it clean inputs.

### Tension 3 — Federation: expressible, not enforced
Integral puts `node_id` + `federation_hash` on every record from day one (Dev Guide non-deferrable
principle). VF handles multi-party scope through **Agent** (organisations/networks are Agents) +
`inScopeOf` + **SpatialThing**. The subtle point: Integral's cross-node reciprocity (White Paper §10)
is **"recognition without conversion"** — no ITC ever crosses a node boundary; the home node mints a
*fresh local* issuance event from a Contribution Receipt. VF *can* represent this (two unlinked
events, no `transfer` edge) — but VF won't *enforce* the no-conversion rule. **Mitigation:**
enforcement lives in the same action-set discipline + an Integral validation layer above VF.

---

## 7. Verdict

The mapping is a credible, honest first sketch that gets the **substrate** right and is refreshingly
clear about its own incompleteness.

- **What VF buys Integral:** a mature, ~20-year REA-grounded vocabulary; off-the-shelf semantics for
  inventory, recipe, process, and event-sourced ledgers (which match Integral's append-only principle
  natively); and **interoperability** with the wider commons-economy ecosystem already on VF (hREA,
  Bonfire, and others). COS/OAD/ITC would not have to reinvent resource-flow accounting.
- **What it costs:** VF covers **3 of 5 subsystems only**; CDS and FRS remain Integral-native. And
  VF's value-neutrality means Integral must adopt it as a **deliberately constrained profile** (no
  transferable credits, no `mediumOfExchange` on ITC) or risk diluting its post-monetary core.
- **The single best idea to carry forward:** express Integral's non-transferability as a **restriction
  on VF's action set** (`raise` / `lower` / `consume` only, never `transfer` / `move` / `copy`). It is
  more native, more checkable, and more faithful to the architecture than a boolean field.

**One-line framing:** *ValueFlows is a strong candidate accounting/coordination standard for Integral's
metabolic layer (OAD + COS + ITC), but it is silent by design on Integral's cognitive (CDS) and
cybernetic (FRS) layers — and adopting it safely requires constraining it so its market-capable
affordances stay switched off.*

The governing test, from the Dev Guide §1.2: *"if this simplification were never revisited, would the
system still be recognizably Integral?"* With the constraints in place, the answer stays **yes**.

---

## 8. Open questions for the working group

A cross-system architectural choice — a **Tier-2** decision (documented consensus, not a single call):

1. **Profile, not adoption.** Adopt VF as a *constrained profile* for OAD/COS/ITC rather than
   wholesale — and who drafts the constraint list (forbidden actions, non-`mediumOfExchange`
   resources)?
2. **Schema reconciliation.** Do the Phase-1 canonical schemas *target* VF classes directly, or do we
   keep Integral-native schemas with a VF *serialisation/export* mapping?
3. **Recipe vs. design split.** Do we follow VF in separating the executable `Recipe` from the design
   artefact (EconomicResource with lineage), restructuring `CertifiedDesign` accordingly?
4. **Issuance modelling.** Confirm the credit-issuance pattern: reciprocal EconomicEvent, and whether
   an `Agreement` / `Claim` mediates it (the mapping leaves this open).
5. **Federation enforcement.** Where does "recognition without conversion" live — in the VF profile,
   or an Integral validation layer above it?

> Helpfully, we already have ValueFlows expertise in the room: **Lynn Foster** (ValueFlows maintainer)
> and **Leanne** (builds ValueFlows accounting models) are both on the ITC workstream.

---

*Prepared as background research for the Integral working groups. A distillation for deliberation, not
a ratified position — the mapping author calls it a sketch, and Integral's whole method is to earn
complexity through use.*
