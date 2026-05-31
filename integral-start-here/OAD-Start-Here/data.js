const GH_DG="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md";
const GH_WP="https://github.com/Integral-Collective/integral-whitepaper/blob/main/whitepaper";
const YT="https://youtu.be/NPaBrjjVCtE";
const REF={
  dg32:lnk(GH_DG+"#32-oad--open-access-design-proposed-core-modules","Developer Guide §3.2"),
  dg43:lnk(GH_DG+"#43-fields-that-must-exist-from-day-one-even-if-empty","Developer Guide §4.3"),
  dg51:lnk(GH_DG+"#51-phase-1--governance-and-system-definition","Developer Guide §5.1"),
  dg44:lnk(GH_DG+"#44-api-boundaries-and-inter-system-interfaces","§4.4"),
  wpoad:lnk(GH_WP+"/07-modules/07-2-oad/oad-01-overview.md","White Paper §7.2 (OAD)"),
  wpcds:lnk(GH_WP+"/07-modules/07-1-cds/cds-01-overview.md","White Paper §7.1 (CDS)"),
  ep:(t,label)=>lnk(YT+(t?"?t="+t:""), label||"Ep.59"),
};

// ----- Design status lifecycle (the field that visibly advances) -----
// Canonical DesignStatus enum is draft|under_review|optimized|ready_for_certification|certified|deprecated.
// We show one label per module so you can watch the design mature; the intermediate
// engineering states (eco_assessed, lifecycle_modeled, …) are this walkthrough's plain-language
// stand-ins for the work happening while the record sits in under_review.
const STATUS = ["draft","under_review","eco_assessed","lifecycle_modeled","labor_decomposed","integration_checked","optimized","certified"];

// ----- object timeline: which records exist by which module step (module index 1..8) -----
const OBJECTS = [
  {type:"CertifiedDesign",          count:1, tier:"ratified", at:1},
  {type:"MaterialRequirement",      count:5, tier:"proposed", at:1},
  {type:"DesignEvent",              count:8, tier:"proposed", at:2},
  {type:"EcologicalAssessment",     count:1, tier:"proposed", at:3},
  {type:"LaborStep",                count:7, tier:"proposed", at:5},
  {type:"CertificationChangeEvent", count:1, tier:"proposed", at:8},
];

// ===================================================================== STEPS
// kind: "concept" (foundations/recap) or "module" (full scaffold). mod = module number 1..8.
const STEPS = [
{kind:"concept", nav:"Welcome", group:"Orientation", badge:"00", title:"What you're about to learn",
 body:`
 <p class="lead">Integral coordinates a community's production <b>without money and without patents</b>. Nothing gets built until it's first <b>designed in the open</b> — ecologically checked, broken into real labor and materials, and finally <b>certified</b>. That whole journey is the <b>OAD</b>: the Open Access Design system.</p>
 <p>OAD's output is the keystone document of Integral's production chain: a <b>CertifiedDesign</b>. The build system (COS) builds from it, the value system (ITC) prices from it, and the feedback system (FRS) monitors against it. For three other systems to read it without ambiguity, it has to arrive in an <b>agreed shape</b> — a <b>schema</b> (or "data contract"). This walkthrough teaches you that shape, gently, one step at a time, by following a single real design from a rough idea to a certified, buildable package.</p>
 <div class="callout"><b>You don't need to be a programmer.</b> We start in plain language. The technical detail is always optional (look for the "see the actual schema" toggles). By the end you'll understand the data structure behind the whole design commons — enough to review it and suggest improvements.</div>
 <div class="callout warn"><b>⚠️ Status: a proposed candidate — not ratified.</b> Everything described here — the schema, the example design record, the pipeline — is <b>Phase-1/2 candidate work</b> (${REF.dg51}), offered to the contributor community to <b>review, challenge, and ratify</b>. Nothing here is adopted. Of the OAD records you'll meet, only <b>one</b> (<code>CertifiedDesign</code>) has a machine-checkable contract so far; the rest are proposed shapes. Treat it as a starting point for deliberation, not a settled blueprint.
 <div class="prov" style="margin-top:10px"><b>Already familiar with the system?</b> Skip ahead to the candidate specs &amp; contracts (local repo):
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/02-oad.md">OAD schema spec</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/schemas/oad/certified-design.json">CertifiedDesign JSON Schema</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/00-canonical-enums.md">canonical enums</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/06-cross-contract-matrix.md">cross-contract matrix</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/07-open-questions.md">open questions (ratification register)</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/README.md">schema exercise overview</a><br>
 Source material (GitHub): ${lnk(GH_DG,"Developer Guide")} ·
 ${lnk("https://github.com/Integral-Collective/integral-whitepaper/tree/main/whitepaper","Technical White Paper")} ·
 ${REF.ep(0,"Revolution Now! Ep.59")}.</div></div>
 <div class="sec"><div class="lbl">How to use this</div>
 <p>Move with <b>Next / Back</b> (or the ← → arrow keys), or jump around using the menu on the left. The panel on the right — <b>"The data so far"</b> — fills up as you go, so you can literally watch the design record being created and its <code>status</code> advance.</p></div>
 `},

{kind:"concept", nav:"The setting & the OAD", group:"Foundations", badge:"01", title:"A node, the commons, and a pipeline",
 body:`
 <p class="lead">An Integral <b>node</b> is a community (think: a town or neighborhood). Inside it are <b>co-ops</b> — smaller working groups (a farm, a workshop, a fabrication crew). When the node needs something <i>made</i>, OAD is where the thing is designed — openly, so any node can reuse and improve it.</p>
 <div class="sec"><div class="lbl">What OAD is for</div>
 <p>In a market economy, design is locked behind secrecy and patents. OAD replaces that with a <b>global design commons</b>: all designs are open, every improvement benefits everyone, and a design's ecological and labor implications are made <b>visible up front</b>. OAD is the system that turns "we should build X" into a computable, buildable, certified specification — the design intelligence that COS and ITC can't function without.</p></div>
 <div class="sec"><div class="lbl">The OAD pipeline — 8 steps</div>
 <p>A design is a <b>sequence of refinements</b>: an idea is submitted → refined → ecologically checked → its lifecycle modeled → broken into labor → fitted to the node → optimized → and finally certified. Each step is a "module":</p>
 <div class="obj"><div class="field"><span class="fn">M1 · Submission</span><span class="fnote">capture the idea as a structured, versioned design</span></div>
 <div class="field"><span class="fn">M2 · Workspace</span><span class="fnote">open, traceable refinement; every change logged</span></div>
 <div class="field"><span class="fn">M3 · Ecology</span><span class="fnote">flag the environmental footprint of the materials</span></div>
 <div class="field"><span class="fn">M4 · Lifecycle</span><span class="fnote">model maintenance, repair, and lifespan</span></div>
 <div class="field"><span class="fn">M5 · Labor</span><span class="fnote">break the design into explicit production steps</span></div>
 <div class="field"><span class="fn">M6 · Integration</span><span class="fnote">check it fits the node's existing infrastructure</span></div>
 <div class="field"><span class="fn">M7 · Optimization</span><span class="fnote">cut material, labor, and impact where possible</span></div>
 <div class="field"><span class="fn">M8 · Certification</span><span class="fnote">the non-negotiable gate — sign it off for production</span></div></div>
 <p class="prov">The white paper describes ten OAD modules; this minimal walkthrough folds two of them into the surrounding steps — <b>feasibility simulation</b> (WP Module 5) and the <b>commons repository</b> (WP Module 10) — and follows the eight that produce the data COS, ITC and FRS read (${REF.dg32}). That's why the module numbers in each step's provenance (e.g. "WP Module 6") run ahead of the step numbers here. The left menu mirrors these eight steps.</p></div>
 `},

{kind:"concept", nav:"What's a schema?", group:"Foundations", badge:"02", title:"Schemas: the agreed shape of the data",
 body:`
 <p class="lead">Picture a <b>relay race</b>. Each runner (a module) hands a baton (the data) to the next. If the baton is the wrong shape, the next runner drops it.</p>
 <p>A <b>schema</b> is the written-down, agreed shape of the baton — what fields it has, what type each field is, which values are allowed. Integral writes these shapes down <b>before building anything</b>, on purpose. For OAD this matters twice over: the <b>CertifiedDesign</b> isn't just passed inside OAD — it's the contract handed to <i>other whole systems</i> (COS builds from it, ITC prices from it, FRS monitors against it).</p>
 <div class="callout warn"><b>Why before?</b> If two systems disagree on the shape after designs already exist, you can't just patch it — you'd have to re-format every design ever certified, which destroys the commons' history and lineage. (This is the core argument in ${REF.dg43}.) Getting the shape right early is the cheapest insurance the project has.</div>
 <div class="sec"><div class="lbl">A field can be present but empty</div>
 <p>Some fields exist in the shape from day one even though they aren't filled in yet — they're reserved for later (e.g. structured ecological coefficients, or federation links). You'll see these tags on fields:</p>
 <div class="contract">
   ${tag("WP")} from the <b>White Paper</b> &nbsp; ${tag("DG")} from the <b>Developer Guide</b> &nbsp;
   ${tag("DEFERRED")} reserved, filled later &nbsp; ${tag("FED")} for federation (mostly empty for now)
 </div></div>
 <div class="check" id="chk-schema"><div class="q">🤔 Why write schemas before code?</div>
 <button onclick="document.getElementById('chk-schema').classList.add('show')">Show answer</button>
 <div class="a">Because changing a data shape <i>after</i> records exist means re-formatting all of history — slow, costly, and trust-destroying. The CertifiedDesign is the contract three other systems rely on, so its shape is agreed first.</div></div>
 `},

{kind:"concept", nav:"The cast & the scenario", group:"Foundations", badge:"03", title:"One node, one footbridge to design",
 body:`
 <p class="lead">We'll follow one real design the whole way, inside a single community — a node named <b>Stillwater</b>. (That's why every id in the data looks like <code>stillwater:…</code> — it's the node id.) The scenario picks up <i>exactly where the CDS walkthrough left off</i>:</p>
 <div class="callout"><b>Stillwater's CDS just decided to raise &amp; reinforce the flood-prone footbridge to the vertical farm</b> (decision <code>stillwater:DR-001</code>). That decision dispatched a <b>design task</b> to OAD. Now OAD has to turn "raise &amp; reinforce the bridge" into a real, certified, buildable design — material list, labor plan, ecological check and all — without disturbing the salmon-bearing creek beneath it.</div>
 <div class="sec"><div class="lbl">The people involved — all members of Stillwater</div>
 <div class="obj">
 <div class="field"><span class="fn">Maya</span><span class="fnote">fabrication — authors the structural design</span></div>
 <div class="field"><span class="fn">Tomas</span><span class="fnote">ecology — runs the material &amp; ecological assessment</span></div>
 <div class="field"><span class="fn">Sam</span><span class="fnote">labor/materials — decomposes the build into steps</span></div>
 <div class="field"><span class="fn">Devon</span><span class="fnote">access — checks it integrates with the existing path</span></div>
 <div class="field"><span class="fn">The certification panel</span><span class="fnote">signs the design off for production (a list, not one person)</span></div></div></div>
 <p>What matters for us is the <b>data they produce</b> as the design matures. A single <b>CertifiedDesign</b> record is born in Module 1 and grows, field by field, all the way to certification. Let's begin. →</p>
 `},

// ----------------------------------------------------------------- M1
{kind:"module", mod:1, nav:"M1 · Submission", group:"The pipeline", badge:"M1", title:"Design Submission & Structured Specification",
 job:"Capture the idea as a structured, versioned design object — the 'front door'.",
 story:`The CDS decision lands in OAD as a design task: "raise &amp; reinforce the existing footbridge." Maya, who runs fabrication, drafts the first version — a name, a description, the bill of materials she expects (timber, steel brackets, fixings), a rough production outline, and a first guess at the ecological flag. It's rough, but it's structured.`,
 community:`Designs aren't co-edited in real time yet (that's deferred); a member or small group submits a structured form. The key rule, non-negotiable from day one: <b>every design is a versioned object</b>. Revisions create new versions — nothing is overwritten — because the white paper's entire OAD logic depends on design lineage being traceable. So the very first thing created is a <b>CertifiedDesign</b> at <code>version</code> "0.1.0" with <code>status</code> "draft".`,
 dataIntro:`M1 creates the root <b>CertifiedDesign</b> — the object we'll watch grow for the rest of the pipeline. It already carries a back-reference (<code>cds_mandate_ref</code>) to the CDS decision that authorized it. Its <code>bill_of_materials</code> is a list of <b>MaterialRequirement</b> sub-objects. Watch its <code>status</code> field: it starts at <code>draft</code> and matures at every module →.`,
 objects:[
   {type:"CertifiedDesign", tier:"ratified", contract:"schemas/oad/certified-design.json",
    fields:[
     {fn:"design_id", ty:"string", t:["WP"], note:"unique id, generated at first submission", s:"new"},
     {fn:"version", ty:"string", t:["WP"], note:'semantic version string, e.g. "0.1.0" — every revision is a new version', s:"new"},
     {fn:"title", ty:"string", t:["WP"], note:"what's being designed", s:"new"},
     {fn:"authored_by", ty:"array", t:["WP","FED"], note:"list of node-id:participant-id — who drafted it", s:"new"},
     {fn:"cds_mandate_ref", ty:"string|null", t:["DG"], note:"the CDS DecisionRecord that authorized this design work", s:"new"},
     {fn:"status", ty:"enum", t:["WP"], note:'DesignStatus — starts "draft"; this field matures every module →', s:"new"},
     {fn:"bill_of_materials", ty:"array", t:["WP"], note:"list of MaterialRequirement (the materials this design needs)", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"originating node — here, Stillwater", s:"new"},
     {fn:"governance_scope", ty:"enum", t:["DG"], note:"coop | node | network — the level this design is certified at", s:"new"},
     {fn:"federation_hash", ty:"string|null", t:["FED","DEFERRED"], note:"reserved (null) until designs cross nodes", s:"new"},
    ],
    json:`{
  "design_id": "stillwater:DES-001",
  "version": "0.1.0",
  "title": "Raised & reinforced footbridge — vertical farm crossing",
  "authored_by": ["stillwater:maya"],
  "cds_mandate_ref": "stillwater:DR-001",
  "status": "draft",
  "bill_of_materials": [
    {"material_id": "MAT-01", "material_name": "Douglas-fir glulam beam", "quantity": 6, "unit": "ea"},
    {"material_id": "MAT-02", "material_name": "galvanized steel bracket", "quantity": 24, "unit": "ea"},
    "... ×3 more line items"
  ],
  "node_id": "stillwater",
  "governance_scope": "node",
  "federation_hash": null
}`},
   {type:"MaterialRequirement", tier:"proposed", contract:"(proposed shape — a sub-object inside bill_of_materials)",
    fields:[
     {fn:"material_id", ty:"string", t:["DG"], note:"id for this line item", s:"new"},
     {fn:"material_name", ty:"string", t:["WP"], note:'e.g. "Douglas-fir glulam beam"', s:"new"},
     {fn:"quantity", ty:"number", t:["WP"], note:"how much is needed", s:"new"},
     {fn:"unit", ty:"string", t:["DG"], note:'e.g. "kg", "ea", "m"', s:"new"},
     {fn:"eco_coefficients", ty:"object|null", t:["WP","DEFERRED"], note:"reserved — embodied energy, carbon, toxicity… filled by M3 later", s:"new"},
    ]},
 ],
 handoff:`A structured, versioned draft design with its materials listed — ready to be refined in the open.`,
 prov:`${REF.wpoad} (Module 1: structured submission) and ${REF.dg32} (minimal OAD: "a design can be created, ecologically flagged, certified, and used by COS"). Versioning-from-day-one is a ${REF.dg43} mandate. Schema: ${LSPEC("specs/02-oad.md")} → ${LSPEC("schemas/oad/certified-design.json")} (validated live). <code>MaterialRequirement</code> is a proposed sub-object shape.`,
 check:{q:"Why is the design a 'versioned object' from the very first draft?", a:"Because OAD's whole logic depends on design lineage being traceable. Revisions create new versions instead of overwriting — so you can always see how a certified design evolved, and other nodes can branch from any point."}},

// ----------------------------------------------------------------- M2
{kind:"module", mod:2, nav:"M2 · Workspace", group:"The pipeline", badge:"M2", title:"Collaborative Design Workspace",
 job:"Refine the design in the open — with every change traceably logged.",
 story:`Maya's draft gets eyes on it. Tomas flags that the original timber spec imports high-carbon hardware; Devon notes the deck width must stay wheelchair-accessible. Maya revises — bumping the version to 0.2.0 — and every one of those changes is recorded, not silently absorbed.`,
 community:`Real-time co-editing is deferred, but <b>transparent versioning is here from day one</b>. The status moves to <code>under_review</code>. Each meaningful change becomes a first-class <b>DesignEvent</b> — because the feedback system (FRS) needs to consume the design's history <i>structurally</i>, not as free-text change-log notes.`,
 dataIntro:`M2 produces a stream of <b>DesignEvent</b> records — a structured audit trail of what changed, when, and by whom. The CertifiedDesign's <code>status</code> is now <code>under_review</code>, and a new field, <code>design_lineage</code>, points back to the version this one branched from.`,
 object:{type:"DesignEvent", tier:"proposed", contract:"(proposed shape — promoted from WP DesignVersion.change_log; see OQ-05)",
   fields:[
    {fn:"event_id", ty:"string", t:["DG"], note:"id for this single change event", s:"new"},
    {fn:"design_id", ty:"string", t:["WP"], note:"the design it belongs to", s:"carried"},
    {fn:"version", ty:"string", t:["WP"], note:"which version this event produced", s:"new"},
    {fn:"node_id", ty:"string", t:["FED"], note:"originating node — lets FRS pull events per node", s:"new"},
    {fn:"event_type", ty:"enum", t:["DG"], note:"submitted | version_updated | status_changed | certified | revoked | superseded", s:"new"},
    {fn:"author_id", ty:"string", t:["FED"], note:"node-id:participant-id — who made the change", s:"new"},
    {fn:"detail", ty:"object", t:["DG"], note:"the specifics of the change", s:"new"},
   ]},
 jsonPeek:`{
  "event_id": "stillwater:DES-001:EVT-003",
  "design_id": "stillwater:DES-001",
  "version": "0.2.0",
  "event_type": "version_updated",
  "author_id": "stillwater:maya",
  "detail": {"changed": "bill_of_materials", "reason": "swap imported brackets for local recycled steel (Tomas)"}
}
// ↻ CertifiedDesign.status: "draft" → "under_review";  design_lineage → "stillwater:DES-001@0.1.0"`,
 handoff:`A reviewed, re-versioned design with a structured change history — ready for ecological assessment.`,
 prov:`${REF.wpoad} (Module 2: transparent versioning, branch/merge). The white paper embeds change history inside <code>DesignVersion.change_log</code> as free text; promoting it to a first-class <b>DesignEvent</b> object is required because FRS consumes it structurally (the OAD→FRS <code>get_design_events</code> interface, ${REF.dg44}). This is a proposed shape — see ${LSPEC("specs/02-oad.md")} and open question OQ-05.`,
 check:{q:"Why turn a free-text change log into structured DesignEvent records?", a:"Because the Feedback & Review System (FRS) reads the design's history programmatically — it can't reliably parse prose. A typed event with event_type, author and detail makes the OAD→FRS contract honest."}},

// ----------------------------------------------------------------- M3
{kind:"module", mod:3, nav:"M3 · Ecology", group:"The pipeline", badge:"M3", title:"Material & Ecological Coefficient Engine",
 job:"Make the design's environmental footprint visible — before it's built.",
 story:`Tomas runs the design through ecological assessment. The recycled-steel-and-glulam combination scores well: low embodied carbon, the timber is renewable and local, and crucially nothing in the build requires in-stream work that would disturb the salmon-bearing creek. He sets the ecological flag and writes a short narrative explaining it.`,
 community:`This is OAD's <b>ecological intelligence layer</b>. In the minimal build the output is a coarse <b>flag</b> (low / medium / high) plus human notes; the structured numeric coefficients (embodied energy, carbon, toxicity per material) are <code>[DEFERRED]</code> — reserved in the shape, filled later. The flag is what COS and ITC read to weigh ecological cost.`,
 dataIntro:`M3 sets <code>ecological_flag</code> and <code>ecological_notes</code> on the CertifiedDesign, and produces an <b>EcologicalAssessment</b> — the structured form FRS will later recalibrate. Status advances to <code>eco_assessed</code> (still <code>under_review</code> underneath, until certification).`,
 object:{type:"EcologicalAssessment", tier:"proposed", contract:"(proposed shape — structured form of ecological_detail; interface stable, content DEFERRED)",
   fields:[
    {fn:"design_id", ty:"string", t:["WP"], note:"the design assessed", s:"carried"},
    {fn:"version", ty:"string", t:["WP"], note:"the version assessed", s:"carried"},
    {fn:"ecological_flag", ty:"enum", t:["WP"], note:"low | medium | high — the coarse Phase-2 signal", s:"new"},
    {fn:"embodied_energy", ty:"number|null", t:["WP","DEFERRED"], note:"reserved — total embodied energy (MJ)", s:"new"},
    {fn:"carbon_intensity", ty:"number|null", t:["WP","DEFERRED"], note:"reserved — kg CO₂e", s:"new"},
    {fn:"recyclability", ty:"number|null", t:["WP","DEFERRED"], note:"reserved — 0–1 recyclability index", s:"new"},
    {fn:"water_use", ty:"number|null", t:["WP","DEFERRED"], note:"reserved — water footprint (L)", s:"new"},
   ]},
 jsonPeek:`// On the CertifiedDesign:
"ecological_flag": "low",
"ecological_notes": "Recycled steel + local glulam; no in-stream works; salmon habitat undisturbed.",
"ecological_detail": null,                     // [DEFERRED] structured coefficients filled later

// EcologicalAssessment (the structured companion FRS can recalibrate):
{"design_id":"stillwater:DES-001","version":"0.2.0","ecological_flag":"low",
 "embodied_energy": null, "carbon_intensity": null}   // [DEFERRED] numbers come later`,
 handoff:`A design with a stated, reviewable ecological footprint — ready for lifecycle modeling.`,
 prov:`${REF.wpoad} (Module 3: ecological coefficients) — required by COS for sustainable production and by ITC for fair access values. The coarse <code>EcologicalFlag</code> enum (low|medium|high) is canonical (${LSPEC("specs/00-canonical-enums.md")}); the numeric coefficients are <code>[DEFERRED]</code> per ${REF.dg43}. FRS can recalibrate them later via the OAD↔FRS interface (${REF.dg44}). Proposed shape: ${LSPEC("specs/02-oad.md")}.`,
 check:{q:"Why is ecological_flag filled now but ecological_detail left null?", a:"The minimal build commits to making ecology visible (the coarse flag) without pretending to have precise lab coefficients yet. The structured detail is DEFERRED — reserved in the shape so it can be filled in later without changing the contract."}},

// ----------------------------------------------------------------- M4
{kind:"module", mod:4, nav:"M4 · Lifecycle", group:"The pipeline", badge:"M4", title:"Lifecycle & Maintainability Modeling",
 job:"Make the design's future maintenance labor explicit — not hidden.",
 story:`A bridge isn't built once and forgotten. The team models how long it lasts, how often the deck needs inspection, how many hours a maintenance crew spends per year, and how hard it is to disassemble for repair. A raised glulam deck turns out to need far less upkeep than a low timber one that floods.`,
 community:`The point is to make <b>lifetime labor visible up front</b> instead of deferred and hidden. Those numbers feed ITC (long-term labor burden affects a thing's access cost) and COS (which plans maintenance co-ops). In the minimal build this whole structured model is <code>[DEFERRED]</code> — a reserved field, with a short note standing in for now.`,
 dataIntro:`M4 attaches a <code>lifecycle_detail</code> object to the CertifiedDesign. The field exists in the contract today but its rich structure is reserved (<code>[DEFERRED]</code>); we show the shape it will take. Status advances to <code>lifecycle_modeled</code>.`,
 object:{type:"CertifiedDesign", tier:"ratified", contract:"schemas/oad/certified-design.json",
   fields:[
    {fn:"design_id", ty:"string", t:["WP"], note:"(carried) the same design, still maturing", s:"carried"},
    {fn:"status", ty:"enum", t:["WP"], note:"(updated) advancing toward certification", s:"updated"},
    {fn:"lifecycle_detail", ty:"object|null", t:["WP","DEFERRED"], note:"reserved — the structured lifecycle model (shape shown below)", s:"new"},
   ]},
 jsonPeek:`// CertifiedDesign.lifecycle_detail — the DEFERRED structure, shape illustrated:
"lifecycle_detail": {
  "expected_lifetime_years": 40,
  "maintenance_interval_days": 365,
  "maintenance_labor_hours_per_interval": 6,
  "disassembly_hours": 12,
  "dominant_failure_modes": ["deck-board wear", "bracket corrosion"],
  "lifecycle_burden_index": 0.18
}
// In the minimal build this may be null + a note; the contract reserves the field so no migration is needed later.`,
 handoff:`A design whose long-term labor cost is on the record — ready to be broken into build steps.`,
 prov:`${REF.wpoad} (Module 4: lifecycle &amp; maintainability) — outputs feed COS (maintenance co-ops) and ITC (long-term labor burden). <code>lifecycle_detail</code> is a real but <code>[DEFERRED]</code> field on the ratified contract (${LSPEC("schemas/oad/certified-design.json")}); FRS recalibrates these assumptions from real-world performance. See ${LSPEC("specs/02-oad.md")}.`,
 check:{q:"Why model maintenance labor before the bridge even exists?", a:"Because in Integral a thing's access cost (ITC) and the crews to maintain it (COS) both depend on lifetime labor. Hiding maintenance cost would distort the whole economic calculation, so OAD makes it explicit and computable up front."}},

// ----------------------------------------------------------------- M5
{kind:"module", mod:5, nav:"M5 · Labor", group:"The pipeline", badge:"M5", title:"Skill & Labor-Step Decomposition",
 job:"Convert the design into an explicit, computable labor plan.",
 story:`Sam breaks the build into concrete tasks, in order: prep the footings, set the glulam beams, fit the brackets, lay the deck, install railings, inspect, load-test. Each task gets an hour estimate, a skill tier, the tools it needs, and safety notes. This is the step that turns a drawing into a plan you can actually staff.`,
 community:`This is the <b>bridge between design intelligence and economic coordination</b> — without it, Integral literally can't do non-market calculation. COS reads the steps to schedule work and form crews; ITC reads them to compute a fair access value from real labor effort. Each task is a <b>LaborStep</b>; the totals roll up into <code>skill_requirements</code> (hours by skill tier).`,
 dataIntro:`M5 fills <code>production_steps</code> (an ordered list of <b>LaborStep</b>) and <code>skill_requirements</code> on the CertifiedDesign. The <code>skill_tier</code> on each step uses the shared <b>SkillTier</b> enum (low | medium | high | expert). Status advances to <code>labor_decomposed</code>.`,
 object:{type:"LaborStep", tier:"proposed", contract:"(proposed shape — WP LaborStep; a sub-object inside production_steps)",
   fields:[
    {fn:"name", ty:"string", t:["WP"], note:'e.g. "set glulam beams"', s:"new"},
    {fn:"estimated_hours", ty:"number", t:["WP"], note:"time estimate for this step", s:"new"},
    {fn:"skill_tier", ty:"enum", t:["WP"], note:"low | medium | high | expert — shared SkillTier enum", s:"new"},
    {fn:"tools_required", ty:"array", t:["WP"], note:"list of tools/equipment needed", s:"new"},
    {fn:"sequence_index", ty:"integer", t:["WP"], note:"ordering of this step in the build", s:"new"},
    {fn:"safety_notes", ty:"string", t:["WP"], note:"hazards and precautions", s:"new"},
    {fn:"ergonomics_flags", ty:"array", t:["WP","DEFERRED"], note:"reserved — repetitive_motion, awkward_posture, …", s:"new"},
   ]},
 jsonPeek:`// CertifiedDesign.production_steps (one of 7 LaborSteps shown):
{"name":"set glulam beams","sequence_index":2,"estimated_hours":16,
 "skill_tier":"high","tools_required":["crane","levels"],
 "safety_notes":"creek-edge work; harness + spotter required"}

// CertifiedDesign.skill_requirements (hours rolled up by tier):
"skill_requirements": {"low": 8, "medium": 22, "high": 24, "expert": 4}`,
 handoff:`A complete, staffable labor plan — the data COS and ITC have been waiting for.`,
 prov:`${REF.wpoad} (Module 6: labor-step decomposition) — "the bridge between design intelligence and economic coordination." The <code>SkillTier</code> enum is canonical and shared with ITC and COS (${LSPEC("specs/00-canonical-enums.md")}); <code>production_steps</code> and <code>skill_requirements</code> are <b>active</b> fields on the ratified contract. <code>LaborStep</code> itself is a proposed sub-object shape (${LSPEC("specs/02-oad.md")}).`,
 check:{q:"Two other systems read this labor plan directly — which, and for what?", a:"COS reads it to schedule the build and form the right crews; ITC reads it to compute the design's fair access value from real labor hours and skill tiers. The shared SkillTier enum is what lets all three agree."}},

// ----------------------------------------------------------------- M6
{kind:"module", mod:6, nav:"M6 · Integration", group:"The pipeline", badge:"M6", title:"Systems Integration & Architectural Coordination",
 job:"Make sure the design fits the node's existing infrastructure and standards.",
 story:`Devon checks the raised bridge against what's already there: does the new deck height still meet the path's accessibility grade? Do the footings clear the existing creek bank reinforcement? Does it use the node's standard railing module so parts are interchangeable later? One clash surfaces — the approach ramp is too steep — and is resolved before certification.`,
 community:`This step stops a <b>locally clever design from becoming systemically incompatible</b>. It also checks the design against <b>federated Integral standards</b>, so a design certified in Stillwater can be adopted by another node without friction.`,
 dataIntro:`M6 doesn't add a big new object in the minimal build — it logs its checks as <b>DesignEvent</b>s (M2's shape) and confirms the design is interoperable. The CertifiedDesign's <code>commons_visible</code> flag is considered here (can other nodes see/reuse it?). Status advances to <code>integration_checked</code>.`,
 object:{type:"CertifiedDesign", tier:"ratified", contract:"schemas/oad/certified-design.json",
   fields:[
    {fn:"status", ty:"enum", t:["WP"], note:"(updated) integration checks passed", s:"updated"},
    {fn:"commons_visible", ty:"boolean", t:["WP"], note:"published to the commons for other nodes to find &amp; reuse", s:"new"},
    {fn:"coop_id", ty:"string|null", t:["DG"], note:"reserved — owning co-op, set if certified at coop scope (R1)", s:"new"},
    {fn:"promoted_from_scope", ty:"enum|null", t:["DG"], note:"reserved — prior governance level, if promoted upward toward the commons (R1)", s:"new"},
   ]},
 jsonPeek:`// Integration recorded as a DesignEvent; CertifiedDesign updated:
{"event_type":"status_changed","detail":{"check":"interoperability",
 "result":"pass","note":"uses standard railing module; approach ramp regraded to 1:12"}}

"commons_visible": true,            // sharable as a candidate design across the federation
"governance_scope": "node",         // certified at node level
"promoted_from_scope": null         // [R1] would record a prior level if promoted upward`,
 handoff:`A design confirmed to fit the node and the federation's standards — ready for a final optimization pass.`,
 prov:`${REF.wpoad} (Module 7: systems integration &amp; architectural coordination) — prevents brittle, siloed designs and aligns with federated standards. <code>commons_visible</code> and the recursion fields (<code>governance_scope</code>, <code>coop_id</code>, <code>promoted_from_scope</code>) are on the ratified contract; their recursion semantics (R1) come from the author's ${REF.ep(1837,"Ep.59 (~30:37)")} and ${LSPEC("specs/02-oad.md")}.`,
 check:{q:"What does commons_visible let a different node do?", a:"Find and pull this design from the global commons to adapt for its own conditions — the start of OAD's recursive reuse. Note it's orthogonal to governance_scope: a design can be shared as a candidate without being certified at the higher level."}},

// ----------------------------------------------------------------- M7
{kind:"module", mod:7, nav:"M7 · Optimization", group:"The pipeline", badge:"M7", title:"Optimization & Efficiency Engine",
 job:"Cut material, labor, and impact where it's possible without losing what matters.",
 story:`A last refinement pass. By switching to a modular gasketed deck-fixing, the build drops a fabrication step and reduces steel use by about a fifth — which lowers both the labor hours and the eventual access cost, with no loss of strength. Maya bumps the version and the labor plan and bill-of-materials update accordingly.`,
 community:`Optimization can be algorithmic or participatory; here it's mostly the latter — the crew spotting a simpler way. Its outputs flow straight into <b>COS production efficiency</b> and <b>ITC access values</b>, because every hour or kilo saved lowers the thing's real cost.`,
 dataIntro:`M7 updates the CertifiedDesign's <code>bill_of_materials</code> and <code>production_steps</code> (re-derived), bumps the <code>version</code>, and — because the labor and materials are now final — computes the first <code>itc_access_cost</code>. Status reaches the canonical <code>optimized</code> state.`,
 object:{type:"CertifiedDesign", tier:"ratified", contract:"schemas/oad/certified-design.json",
   fields:[
    {fn:"version", ty:"string", t:["WP"], note:'(updated) e.g. "0.9.0" — optimization is a new version', s:"updated"},
    {fn:"status", ty:"enum", t:["WP"], note:'(updated) reaches the canonical "optimized" state', s:"updated"},
    {fn:"itc_access_cost", ty:"number|null", t:["DG"], note:"computed access cost in time credits (from labor + materials)", s:"new"},
    {fn:"itc_access_cost_method", ty:"enum", t:["DG"], note:"simple_embodied | (future methods) — how the cost was computed", s:"new"},
    {fn:"design_lineage", ty:"string|null", t:["WP"], note:"(updated) points back through the version chain", s:"updated"},
   ]},
 jsonPeek:`"version": "0.9.0",
"status": "optimized",
"itc_access_cost": 58.0,                 // time credits, down from ~72 pre-optimization
"itc_access_cost_method": "simple_embodied",
"skill_requirements": {"low": 8, "medium": 18, "high": 20, "expert": 4}   // ↓ from M5 after the saved step`,
 handoff:`A leaner, final design with a first access-cost estimate — ready for the certification gate.`,
 prov:`${REF.wpoad} (Module 8: optimization &amp; efficiency) — outputs directly influence COS efficiency and ITC access values. <code>optimized</code> is a canonical <code>DesignStatus</code> value the ${REF.dg43} explicitly warns not to omit. <code>itc_access_cost</code> / <code>itc_access_cost_method</code> are devguide additions on the ratified contract (${LSPEC("specs/02-oad.md")}).`,
 check:{q:"Why does optimization change the ITC access cost?", a:"Because access cost is computed from real labor and materials. Dropping a build step and cutting steel reduces both — so the optimized design is genuinely 'cheaper' to access, and the record reflects that."}},

// ----------------------------------------------------------------- M8
{kind:"module", mod:8, nav:"M8 · Certification", group:"The pipeline", badge:"M8", title:"Validation, Certification & Release Manager",
 job:"The non-negotiable gate: sign the design off as production-ready — by a panel, on the record.",
 story:`Nothing gets built until this step says so. A certification panel reviews the whole bundle — ecological flag, lifecycle model, labor plan, integration checks — and signs it off. The version is stamped to 1.0.0, a certification timestamp is set, and the panel members are all recorded (a <i>list</i>, not a single signature — accountability has to be a full audit trail).`,
 community:`The devguide is emphatic: <b>skipping certification is a corruption, not a simplification</b> (§2.4). This is the moment a design becomes the authoritative source COS builds from and ITC prices from — so the certification panel must be a recorded list, and the status change must itself be a logged event that FRS can later act on.`,
 dataIntro:`M8 sets <code>certified_at</code>, the <code>certified_by</code> panel list, bumps <code>version</code> to 1.0.0, and moves <code>status</code> to <code>certified</code>. It also emits a <b>CertificationChangeEvent</b> — the structured record FRS watches, so a future field problem can revoke or supersede this exact version. The design is now production-ready.`,
 objects:[
   {type:"CertifiedDesign", tier:"ratified", contract:"schemas/oad/certified-design.json",
    fields:[
     {fn:"version", ty:"string", t:["WP"], note:'(updated) stamped to "1.0.0" at certification', s:"updated"},
     {fn:"status", ty:"enum", t:["WP"], note:'(updated) → "certified" — the same object, matured the whole pipeline', s:"updated"},
     {fn:"certified_at", ty:"string|null", t:["WP"], note:"timestamp of certification", s:"new"},
     {fn:"certified_by", ty:"array", t:["WP"], note:"the full certification panel — MUST be a list (audit trail, §4.3)", s:"new"},
     {fn:"superseded_by", ty:"string|null", t:["WP"], note:"reserved (null) — set if a later version replaces this one", s:"new"},
    ],
    json:`{
  "design_id": "stillwater:DES-001",
  "version": "1.0.0",
  "status": "certified",
  "certified_at": "2026-06-14T09:00:00Z",
  "certified_by": ["stillwater:beatrice", "stillwater:tomas", "stillwater:devon"],
  "itc_access_cost": 58.0,
  "commons_visible": true,
  "superseded_by": null
}
// ↻ CertifiedDesign.status: draft → … → "certified"  (one object, matured across 8 modules)`},
   {type:"CertificationChangeEvent", tier:"proposed", contract:"(proposed shape — the OAD→FRS get_certification_changes record)",
    fields:[
     {fn:"event_id", ty:"string", t:["DG"], note:"id for this certification change", s:"new"},
     {fn:"design_id", ty:"string", t:["WP"], note:"the design certified", s:"carried"},
     {fn:"version", ty:"string", t:["WP"], note:"the version certified (1.0.0)", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"originating node — lets FRS route the change", s:"new"},
     {fn:"old_status", ty:"enum", t:["DG"], note:'prior DesignStatus — here "optimized"', s:"new"},
     {fn:"new_status", ty:"enum", t:["DG"], note:'new DesignStatus — here "certified"', s:"new"},
     {fn:"reason", ty:"string", t:["DG"], note:"why it changed", s:"new"},
     {fn:"superseded_by_version", ty:"string|null", t:["DG"], note:"reserved (null) — set if this change supersedes an earlier certified version", s:"new"},
     {fn:"triggering_frs_finding_ref", ty:"string|null", t:["DG","DEFERRED"], note:"reserved — the FRS finding that prompted a future revoke, if any", s:"new"},
    ]},
 ],
 handoff:`A certified, buildable design. COS can now begin production, ITC can price access, and FRS can monitor it — and if reality diverges, FRS can trigger a re-certification, starting the loop again.`,
 prov:`${REF.wpoad} (Module 9: validation, certification &amp; release). <code>certified_by</code> "MUST be a list" — a full panel audit trail per ${REF.dg43}. The certification gate is non-negotiable (${REF.dg32}, §2.4: skipping it is a corruption). <code>CertificationChangeEvent</code> is the OAD→FRS contract object (${REF.dg44}) — a proposed shape in ${LSPEC("specs/02-oad.md")}. Schema validated live: ${LSPEC("schemas/oad/certified-design.json")}.`,
 check:{q:"Why must certified_by be a list, and why log the certification as its own event?", a:"A list captures the whole panel, so accountability is a real audit trail rather than one name. Logging it as a CertificationChangeEvent lets FRS watch certified designs and, if field data diverges, trigger a revoke or re-certification of that exact version."}},

// ----------------------------------------------------------------- Recap
{kind:"concept", nav:"Recap & where to help", group:"Wrap-up", badge:"✓", title:"You've followed a design from idea to certified",
 body:`
 <p class="lead">A CDS decision ("raise the bridge") became a certified, buildable design — and every module handed the next a well-shaped baton, growing one CertifiedDesign record the whole way.</p>
 <div class="sec"><div class="lbl">What you saw</div>
 <p>A <b>CertifiedDesign</b> was born at M1 and its <code>status</code> matured across eight modules — <code>draft</code> → <code>under_review</code> → (eco-assessed, lifecycle-modeled, labor-decomposed, integration-checked) → <code>optimized</code> → <code>certified</code>. Along the way the pipeline produced MaterialRequirements, DesignEvents, an EcologicalAssessment, LaborSteps, and a CertificationChangeEvent — <b>6 object types</b> in all, all feeding the design intelligence that COS and ITC depend on.</p></div>
 <div class="callout teal"><b>The schema coverage map (where you can help).</b> Only <b>1</b> of those object types currently has a machine-checkable JSON-Schema contract that the simulator validates against — <code>CertifiedDesign</code> (green), which deliberately consolidates seven white-paper objects. The other <b>5</b> are <b>proposed shapes</b> — MaterialRequirement and LaborStep (sub-objects), and the FRS-facing helper records DesignEvent, EcologicalAssessment, and CertificationChangeEvent — written in the spec prose but not yet schematized (amber). Formalising those is one of the clearest, most useful contributions available right now. (To be clear: even the green one is <i>candidate</i> — having a schema isn't the same as the community having ratified it.)</div>
 <div class="sec"><div class="lbl">Go deeper</div>
 <p>• Read the OAD spec &amp; the live contract: <code>integral-schema-exercise/specs/02-oad.md</code> and <code>schemas/oad/certified-design.json</code>.<br>
 • See how this design plugs into the rest: the <b>OAD→COS</b>, <b>OAD→ITC</b> and <b>OAD→FRS</b> interfaces are the reason every field above exists (${REF.dg44}).<br>
 • Open question <b>OQ-02</b>: should the design's ITC-facing valuation (<code>OADValuationProfile</code>) be a stored record or computed on read from the CertifiedDesign? That choice shapes the OAD→ITC contract.<br>
 • Provenance throughout traces to the ${REF.wpoad}, the ${REF.dg32} / ${REF.dg43}, and the author's ${REF.ep(0,"Ep.59")} walkthrough.</p></div>
 <div class="callout"><b>Thank you for onboarding.</b> Understanding the data structure is the foundation for improving it — and improving it together is the whole point.</div>
 `},
];

// META — per-system labels the engine uses for the title, header, and data panel.
const META = {
  key: "oad",
  emoji: "📐",
  title: "OAD · Start Here",
  sub: "The data structures behind Integral's Open Access Design system — one step at a time",
  panelHint: "Watch the records accumulate — and the design's <code>status</code> field advance — as you move through the pipeline.",
  statusObjectName: "CertifiedDesign",   // the object whose status field advances
  statusEnumName: "DesignStatus",
  statusObjectId: "stillwater:DES-001",
};
