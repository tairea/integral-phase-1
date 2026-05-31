const GH_DG="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md";
const GH_WP="https://github.com/Integral-Collective/integral-whitepaper/blob/main/whitepaper";
const YT="https://youtu.be/NPaBrjjVCtE";
const REF={
  dg34:lnk(GH_DG+"#34-cos--cooperative-organization-system-proposed-core-modules","Developer Guide §3.4"),
  dg43:lnk(GH_DG+"#43-the-cos-labor--materials-schemas","Developer Guide §4.3"),
  dg44:lnk(GH_DG+"#44-api-boundaries-and-inter-system-interfaces","§4.4"),
  dg51:lnk(GH_DG+"#51-phase-1--governance-and-system-definition","Developer Guide §5.1"),
  wpcos:lnk(GH_WP+"/07-modules/07-4-cos/cos-01-overview.md","White Paper §7.4 (COS)"),
  ep:(t,label)=>lnk(YT+(t?"?t="+t:""), label||"Ep.59"),
};

// ----- The status field that visibly advances as you move through the pipeline -----
// Pedagogical lifecycle: one chip per module so the learner can watch the run progress.
// (The spec's literal ProductionPlan.status enum is coarser — planning|active|complete|cancelled;
//  these eight stages narrate the journey from "planned" to "recorded" the spec's "active" covers.)
const STATUS = ["planned","assigned","procured","in_progress","balanced","distributed","qa_checked","recorded"];

// ----- object timeline: which records exist by which module step (module index 1..8) -----
const OBJECTS = [
  {type:"ProductionPlan",           count:1,  tier:"proposed", at:1},
  {type:"TaskDefinition",           count:6,  tier:"proposed", at:1},
  {type:"TaskInstance",             count:6,  tier:"proposed", at:2},
  {type:"LaborEvent",               count:9,  tier:"ratified", at:2},
  {type:"MaterialConsumptionEvent", count:5,  tier:"ratified", at:3},
  {type:"COSEvent",                 count:18, tier:"proposed", at:4},
  {type:"COSDistributionRecord",    count:1,  tier:"proposed", at:6},
  {type:"QAEvent",                  count:4,  tier:"proposed", at:7},
  {type:"ProductionSummary",        count:1,  tier:"proposed", at:8},
];

// ===================================================================== STEPS
// kind: "concept" (foundations/recap) or "module" (full scaffold). mod = module number 1..8.
const STEPS = [
{kind:"concept", nav:"Welcome", group:"Orientation", badge:"00", title:"What you're about to learn",
 body:`
 <p class="lead">Integral coordinates a community's production and decisions <b>without money and without bosses</b>. Once a community has <b>decided</b> what to do (via the CDS) and <b>designed and certified</b> how to build it (via the OAD), something has to turn that paper into a finished thing — break it into tasks, find the hands, draw the materials, check the quality. That's the <b>COS</b>: the Cooperative Organization System, what the white paper calls the federation's <b>"operational musculature."</b></p>
 <p>COS is <b>where the work actually happens</b> — and where Integral's economy touches the physical world. As it organises that work it generates the most consequential raw data in the whole federation: <b>who did how many hours</b> and <b>what materials were consumed</b>. Two other systems live on those facts — <b>ITC</b> computes fair access without prices, <b>FRS</b> watches reliability and ecology — so if COS records the wrong number, every value and every signal built on it is wrong too.</p>
 <p>For all of this to work, each step must hand the next its information in an <b>agreed shape</b>. Those agreed shapes are called <b>schemas</b> (or "data contracts"). This walkthrough teaches you those shapes — gently, one step at a time — by following a single real production run from a certified design to finished, recorded work.</p>
 <div class="callout"><b>You don't need to be a programmer.</b> We start in plain language. The technical detail is always optional (look for the "Actual object (JSON)" toggles). By the end you'll understand the data structure behind the production system — enough to review it and suggest improvements.</div>
 <div class="callout warn"><b>⚠️ Status: a proposed candidate — not ratified.</b> Everything described here — the schemas, the example records — is <b>Phase-1 candidate work</b> (${REF.dg51}), offered to the contributor community to <b>review, challenge, and ratify</b>. COS in particular is the <b>largest schema-coverage gap</b> in the whole project: the Developer Guide schematized only <b>2</b> of its records, while the white paper describes <b>43</b>. Treat this as a starting point for deliberation, not a settled blueprint.
 <div class="prov" style="margin-top:10px"><b>Already familiar with the system?</b> Skip ahead to the candidate specs &amp; contracts (local repo):
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/04-cos.md">COS schema spec</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/00-canonical-enums.md">canonical enums</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/06-cross-contract-matrix.md">cross-contract matrix</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/07-open-questions.md">open questions (ratification register)</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/README.md">schema exercise overview</a><br>
 Source material (GitHub): ${lnk(GH_DG,"Developer Guide")} ·
 ${lnk("https://github.com/Integral-Collective/integral-whitepaper/tree/main/whitepaper","Technical White Paper")} ·
 ${REF.ep(0,"Revolution Now! Ep.59")}.</div></div>
 <div class="sec"><div class="lbl">How to use this</div>
 <p>Move with <b>Next / Back</b> (or the ← → arrow keys), or jump around using the menu on the left. The panel on the right — <b>"The data so far"</b> — fills up as you go, so you can literally watch the records being created and the production plan's status advance.</p></div>
 `},

{kind:"concept", nav:"COS's job", group:"Foundations", badge:"01", title:"Where the work actually happens",
 body:`
 <div class="sec"><div class="lbl">The four systems, in one breath</div>
 <p><b>CDS</b> decides <i>what the community should do</i>. <b>OAD</b> works out <i>what should exist and how to build it</i> — and <b>certifies</b> the design. <b>COS</b> — this system — <i>organises the actual production</i>. <b>ITC</b> then turns COS's labor and materials facts into fair <i>access values</i> (without prices), and <b>FRS</b> watches whether reality matches the plan.</p></div>
 <div class="sec"><div class="lbl">Coordination without command</div>
 <p>COS replaces the firm, the manager, and the wage relation. Nobody is <i>ordered</i> to a task. Work is broken down transparently, people <b>self-select</b> the tasks they're skilled for, and shortages surface as <b>signals</b> — not orders. The white paper calls COS the <b>"operational musculature"</b> of Integral: ${REF.wpcos} describes coordination through shared awareness of what is needed, when, and by whom.</p></div>
 <div class="sec"><div class="lbl">Two hard truths about COS data</div>
 <div class="obj">
 <div class="field"><span class="fn">COS REQUIRES a certified design</span><span class="fnote">it cannot start a production plan without a <i>certified</i> OAD design_ref — an architectural dependency, not a nicety</span></div>
 <div class="field"><span class="fn">COS data is the source of truth</span><span class="fnote">if COS's labor &amp; materials records are wrong, both ITC and FRS are compromised — so they're append-only and verified</span></div></div></div>
 <p class="prov">In plain terms: COS takes a finished design and a community mandate, then produces the trustworthy record of <i>what work was really done</i>. We'll watch one such record being built.</p>
 `},

{kind:"concept", nav:"The pipeline", group:"Foundations", badge:"02", title:"The COS pipeline at a glance",
 body:`
 <p class="lead">Picture a <b>relay race</b>. Each runner (a module) hands a baton (the data) to the next. If the baton is the wrong shape, the next runner drops it. A <b>schema</b> is the written-down, agreed shape of that baton — its fields, their types, the allowed values.</p>
 <p>COS organises production as a <b>sequence of transformations</b>: a certified design is planned into tasks → people are assigned → materials are drawn → work runs → bottlenecks are balanced → goods are distributed → quality is checked → everything is recorded. Each step is a "module":</p>
 <div class="obj"><div class="field"><span class="fn">M1 · Planning</span><span class="fnote">turn a certified design into a work breakdown (tasks + estimates)</span></div>
 <div class="field"><span class="fn">M2 · Labor</span><span class="fnote">people self-select tasks; each completion emits a labor record</span></div>
 <div class="field"><span class="fn">M3 · Materials</span><span class="fnote">draw materials; log every consumption with ecological flags</span></div>
 <div class="field"><span class="fn">M4 · Execution</span><span class="fnote">run the workflow; log task state to the operational ledger</span></div>
 <div class="field"><span class="fn">M5 · Balancing</span><span class="fnote">detect bottlenecks; reroute labor; signal scarcity to ITC</span></div>
 <div class="field"><span class="fn">M6 · Distribution</span><span class="fnote">route the finished good to an access center; link to ITC access</span></div>
 <div class="field"><span class="fn">M7 · QA</span><span class="fnote">test safety/durability; pass or fail; feed FRS &amp; OAD</span></div>
 <div class="field"><span class="fn">M8 · Ledger</span><span class="fnote">close the loop: aggregate clean data for ITC &amp; FRS</span></div></div>
 <p class="prov">(The white paper lists nine COS modules. We fold its Module 8 — inter-coop integration, deferred in the minimal build — into the others, so this walkthrough covers the eight that produce distinct records: WP modules 1–7 plus the Module 9 ledger. The left menu mirrors them.)</p>
 <div class="sec"><div class="lbl">A field can be present but empty</div>
 <p>Some fields exist in a shape from day one even though they aren't filled in yet — reserved for later (e.g. for when nodes connect into a federation, or for a hash chain). You'll see these tags on the fields ahead:</p>
 <div class="contract">
   ${tag("WP")} from the <b>White Paper</b> &nbsp; ${tag("DG")} from the <b>Developer Guide</b> &nbsp;
   ${tag("DEFERRED")} reserved, filled later &nbsp; ${tag("FED")} for federation (mostly empty for now)
 </div></div>
 <div class="check" id="chk-schema"><div class="q">🤔 Why write schemas before code?</div>
 <button onclick="document.getElementById('chk-schema').classList.add('show')">Show answer</button>
 <div class="a">Because changing a data shape <i>after</i> records exist means re-formatting all of history — and COS's history (every labor-hour, every kilogram) is the ledger ITC and FRS trust. The shape is the contract every module relies on, so it's agreed first.</div></div>
 `},

{kind:"concept", nav:"The scenario & cast", group:"Foundations", badge:"03", title:"Building the footbridge, for real",
 body:`
 <p class="lead">We'll follow one real production run, inside a single community — a node named <b>Stillwater</b>. (That's why every id looks like <code>stillwater:…</code> — it's the node id.) This run picks up exactly where the other systems left off:</p>
 <div class="callout"><b>Stillwater's CDS decided</b> to fix the footbridge to the vertical farm (it floods during storms). <b>The chosen option was P1: raise &amp; reinforce the existing 60-year-old timber bridge.</b> <b>OAD then designed and certified</b> that retrofit — call it <code>BRIDGE-RETRO v1.0</code>. Now <b>COS organises the build</b>: break it into tasks, assign labor, draw materials, check quality, and route the finished crossing into use.</p>
 <div class="sec"><div class="lbl">Why COS can even start</div>
 <p>COS holds two things before it does anything: a <b>certified</b> <code>design_ref</code> (BRIDGE-RETRO v1.0 from OAD) and a <b>CDS mandate</b> (the DispatchPacket / DecisionRecord that authorised production). Without the certification, COS refuses to plan. With it, the metabolism switches on.</p></div>
 <div class="sec"><div class="lbl">The cast — members of Stillwater doing the work</div>
 <div class="obj">
 <div class="field"><span class="fn">Maya</span><span class="fnote">fabrication / welding — leads the structural reinforcement tasks</span></div>
 <div class="field"><span class="fn">Sam</span><span class="fnote">labor &amp; materials coordination — tracks hours and material draws</span></div>
 <div class="field"><span class="fn">Devon</span><span class="fnote">access — verifies the finished crossing is usable by everyone</span></div>
 <div class="field"><span class="fn">Priya</span><span class="fnote">apprentice carpenter — takes lower-tier tasks, building skill</span></div>
 <div class="field"><span class="fn">Tomas</span><span class="fnote">ecology — watches material ecological flags &amp; QA eco-compliance</span></div></div></div>
 <p>These are <i>simulated</i> participants; what matters for us is the <b>data they produce</b> as the build moves along. Let's begin. →</p>
 `},

// ----------------------------------------------------------------- M1
{kind:"module", mod:1, nav:"M1 · Planning", group:"The pipeline", badge:"M1", title:"Production Planning & Work Breakdown",
 job:"Turn a certified OAD design into an executable work breakdown.",
 story:`Stillwater holds a certified design — <code>BRIDGE-RETRO v1.0</code> — and a CDS mandate to build it. COS takes the design's labor-step decomposition and turns it into a concrete, node-specific plan: which tasks, in what order, needing which skills and materials, and roughly how many hours.`,
 community:`Sam opens the certified design package and builds the Work Breakdown Structure. The retrofit decomposes into six task templates — site prep, pier reinforcement, deck removal, steel-frame welding, deck rebuild, and rail/finish — each tagged with a skill tier, an hours estimate, required tools, and material draws.`,
 dataIntro:`M1 produces one <b>ProductionPlan</b> (the OAD→COS contract realised) plus a <b>TaskDefinition</b> per work template. The plan <b>cannot exist</b> without a certified <code>design_ref</code>. Watch its <code>status</code> field — it starts at <code>planned</code> and advances at every module →.`,
 objects:[
   {type:"ProductionPlan", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"plan_id", ty:"string", t:["WP"], note:"unique id for this production run", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"which node — here, Stillwater", s:"new"},
     {fn:"governance_scope", ty:"enum", t:["DG"], note:"coop | node | network — the level that authorised this plan", s:"new"},
     {fn:"design_ref", ty:"string", t:["WP"], note:"OAD certified design + version — REQUIRED, must be certified", s:"new"},
     {fn:"cds_mandate_ref", ty:"string", t:["DG"], note:"the CDS DispatchPacket/DecisionRecord authorising production", s:"new"},
     {fn:"batch_size", ty:"integer", t:["WP"], note:"how many units — here, 1 bridge retrofit", s:"new"},
     {fn:"task_definition_ids", ty:"array", t:["WP"], note:"links to the TaskDefinition templates", s:"new"},
     {fn:"expected_labor_hours_by_skill", ty:"object", t:["WP"], note:"projected hours per skill tier → an early signal to ITC", s:"new"},
     {fn:"status", ty:"enum", t:["DG"], note:'ProductionPlanStatus (spec: planning | active | complete | cancelled) — we narrate it as 8 stages so you can watch it advance every module →', s:"new"},
    ],
    json:`{
  "plan_id": "stillwater:PP-001",
  "node_id": "stillwater",
  "governance_scope": "node",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "cds_mandate_ref": "stillwater:DSP-001",
  "batch_id": "stillwater:BATCH-001",
  "batch_size": 1,
  "task_definition_ids": ["stillwater:TD-01", "... ×6"],
  "expected_labor_hours_by_skill": {"expert": 28, "high": 46, "medium": 40, "low": 18},
  "expected_materials": {"steel_section_kg": 320, "timber_decking_kg": 180},
  "expected_cycle_time_hours": 96,
  "status": "planning"          // spec enum: planning|active|complete|cancelled (narrated below as 8 stages)
}`},
   {type:"TaskDefinition", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"task_definition_id", ty:"string", t:["WP"], note:"id for this work template", s:"new"},
     {fn:"design_ref", ty:"string", t:["WP"], note:"the certified design this step derives from", s:"new"},
     {fn:"name", ty:"string", t:["WP"], note:'e.g. "steel_frame_welding"', s:"new"},
     {fn:"skill_tier", ty:"enum", t:["WP"], note:"SkillTier (shared with ITC): low|medium|high|expert", s:"new"},
     {fn:"estimated_hours_per_unit", ty:"number", t:["WP"], note:"the planning estimate (compared to reality later)", s:"new"},
     {fn:"required_tools", ty:"array", t:["WP"], note:"tools/jigs the task needs (e.g. mig_welder)", s:"new"},
     {fn:"required_materials", ty:"object", t:["WP"], note:"material_id → quantity needed", s:"new"},
     {fn:"predecessors", ty:"array", t:["WP"], note:"task ids that must finish first (the build order)", s:"new"},
     {fn:"required_clearances", ty:"array", t:["WP"], note:"safety clearances (e.g. hot-work, working-at-height)", s:"new"},
    ],
    json:`{
  "task_definition_id": "stillwater:TD-04",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "name": "steel_frame_welding",
  "skill_tier": "expert",
  "estimated_hours_per_unit": 28,
  "required_tools": ["mig_welder", "frame_jig"],
  "required_materials": {"steel_section_kg": 320, "welding_gas_m3": 4},
  "predecessors": ["stillwater:TD-02"],
  "required_clearances": ["hot_work", "structural_signoff"]
}`},
 ],
 handoff:`A concrete work breakdown — tasks, order, skills, materials, estimates — ready for people to pick up.`,
 prov:`${REF.wpcos} (Module 1: Production Planning &amp; Work Breakdown) and ${REF.dg34}. The "${REF.ep(0,"Ep.59")}" walkthrough frames COS as turning certified designs into operational facts. The architectural rule that COS needs a certified design is the §2.2 dependency. These shapes are <b>proposed</b> — written in ${LSPEC("specs/04-cos.md")} but not yet schematized.`,
 check:{q:"Why can't COS just start building from a sketch?", a:"Because a ProductionPlan REQUIRES a certified design_ref. The certification is an architectural dependency — it guarantees the design was reviewed (safety, ecology, lifecycle) before any labor-hour or material is committed to it."}},

// ----------------------------------------------------------------- M2
{kind:"module", mod:2, nav:"M2 · Labor", group:"The pipeline", badge:"M2", title:"Labor Organization & Skill-Matching",
 job:"People self-select tasks — and every completed task emits a labor record.",
 story:`The plan is made visible. Maya takes the expert welding; Priya, an apprentice, takes site prep and clamp work to build skill; Devon and Sam split the medium-tier deck rebuild. Nobody is assigned by a manager — they choose based on skill and availability.`,
 community:`Each work template (TaskDefinition) is scheduled as a concrete <b>TaskInstance</b> with a real assignee and a <code>TaskStatus</code>. As each instance is worked and completed, it emits one or more <b>LaborEvent</b> records — the raw, value-neutral record of hours that ITC will later weight.`,
 dataIntro:`M2 produces a <b>TaskInstance</b> per scheduled task (its status moves <code>pending → in_progress → done</code>) and a <b>LaborEvent</b> per completion. The LaborEvent is one of only <b>two COS records with a ratified JSON Schema</b>. Plan status → <code>assigned</code>.`,
 objects:[
   {type:"TaskInstance", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"task_instance_id", ty:"string", t:["WP"], note:"id for this scheduled/executed task", s:"new"},
     {fn:"definition_id", ty:"string", t:["WP"], note:"which TaskDefinition template it realises", s:"carried"},
     {fn:"plan_id", ty:"string", t:["DG"], note:"back-ref to the ProductionPlan", s:"carried"},
     {fn:"assigned_coop_id", ty:"string", t:["WP"], note:"the co-op / crew that took it on", s:"new"},
     {fn:"status", ty:"enum", t:["WP"], note:"TaskStatus: pending | in_progress | blocked | done | cancelled", s:"new"},
     {fn:"actual_hours", ty:"number", t:["WP"], note:"the real hours — compared against the estimate", s:"new"},
     {fn:"participants", ty:"array", t:["WP"], note:"node-id:participant-id of who actually worked it", s:"new"},
    ],
    json:`{
  "task_instance_id": "stillwater:TI-04",
  "definition_id": "stillwater:TD-04",
  "plan_id": "stillwater:PP-001",
  "batch_id": "stillwater:BATCH-001",
  "assigned_coop_id": "stillwater:fabrication-crew",
  "status": "done",
  "actual_hours": 31,
  "participants": ["stillwater:maya", "stillwater:priya"],
  "notes": "Estimate was 28h; ran 31h (one weld re-done)."
}`},
   {type:"LaborEvent", tier:"ratified", contract:"schemas/cos/labor-event.json",
    fields:[
     {fn:"event_id", ty:"string", t:["DG"], note:"unique id for this labor record", s:"new"},
     {fn:"timestamp", ty:"string", t:["DG"], note:"when the work was logged (ISO date-time)", s:"new"},
     {fn:"participant_id", ty:"string", t:["FED"], note:"node-id:person-id — who did the work", s:"new"},
     {fn:"task_ref", ty:"string", t:["DG"], note:"the TaskInstance this labor was for", s:"new"},
     {fn:"hours", ty:"number", t:["DG"], note:"raw, value-neutral hours (>0) — NOT yet weighted", s:"new"},
     {fn:"skill_tier", ty:"enum", t:["DG"], note:"SkillTier — the input ITC uses to weight", s:"new"},
     {fn:"context", ty:"object", t:["DG"], note:"weighting signals — the primary input to ITC Module 2 (never omit)", s:"new"},
     {fn:"verification_status", ty:"enum", t:["DG"], note:"pending | verified | disputed — keeps the ledger honest", s:"new"},
     {fn:"itc_weighted_hours", ty:"number|null", t:["DG","DEFERRED"], note:"null at COS — ITC fills this in later", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:LE-007",
  "timestamp": "2026-06-04T15:02:00Z",
  "participant_id": "stillwater:maya",
  "coop_id": "stillwater:fabrication-crew",
  "governance_scope": "node",
  "task_ref": "stillwater:TI-04",
  "production_plan_ref": "stillwater:PP-001",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "node_id": "stillwater",
  "hours": 31,
  "skill_tier": "expert",
  "context": {"hot_work": true, "structural": true},
  "verification_status": "verified",
  "itc_weighted_hours": null
}`},
   ],
 handoff:`A stream of verified labor records — the COS→ITC labor contract in motion — plus task instances tracking real progress.`,
 prov:`${REF.wpcos} (Module 2) describes self-selection and scarcity-as-signal; ${REF.dg43} schematizes <b>LaborEvent</b>, the COS-owned record consumed by ITC and FRS. The schema deliberately separates <b>raw hours</b> (captured here) from <b>weighted hours</b> (ITC's output) — open question OQ-03. Schema: ${LSPEC("schemas/cos/labor-event.json")} (validated live). TaskInstance remains a ${LSPEC("specs/04-cos.md")} proposed shape.`,
 check:{q:"COS writes 'hours' but leaves 'itc_weighted_hours' null. Why?", a:"COS owns the raw, value-neutral fact of how many hours were worked. ITC owns the weighting (skill scarcity, context). Keeping them in separate fields preserves the boundary — COS never decides what an hour is 'worth'."}},

// ----------------------------------------------------------------- M3
{kind:"module", mod:3, nav:"M3 · Materials", group:"The pipeline", badge:"M3", title:"Resource Procurement & Materials Management",
 job:"Draw materials from inventory — and log every consumption with its ecological flag.",
 story:`Welding the new frame draws steel section and welding gas; rebuilding the deck draws reclaimed timber. Tomas watches the ecological flags: the steel is partly recycled (low flag), the timber is reclaimed (low flag), but the welding gas carries a higher ecological note.`,
 community:`Sam reserves materials for the batch and tracks inventory. Every draw becomes a <b>MaterialConsumptionEvent</b> — what was used, how much, what's left, and its ecological flag. These records flow to ITC (scarcity → access-value) and FRS (ecological stress).`,
 dataIntro:`M3 produces a <b>MaterialConsumptionEvent</b> per material draw — the <b>second of the two COS records with a ratified JSON Schema</b>. Plan status → <code>procured</code>.`,
 objects:[
   {type:"MaterialConsumptionEvent", tier:"ratified", contract:"schemas/cos/material-consumption-event.json",
    fields:[
     {fn:"event_id", ty:"string", t:["DG"], note:"unique id for this consumption record", s:"new"},
     {fn:"timestamp", ty:"string", t:["DG"], note:"when the material was drawn", s:"new"},
     {fn:"task_ref", ty:"string|null", t:["DG"], note:"the TaskInstance that used it", s:"new"},
     {fn:"design_ref", ty:"string|null", t:["DG"], note:"the certified design (for traceability)", s:"new"},
     {fn:"material_id", ty:"string", t:["DG"], note:"which material", s:"new"},
     {fn:"quantity_consumed", ty:"number", t:["DG"], note:"how much was used", s:"new"},
     {fn:"unit", ty:"string", t:["DG"], note:"kg, m³, … the measurement unit", s:"new"},
     {fn:"quantity_remaining", ty:"number|null", t:["DG"], note:"inventory level after this draw", s:"new"},
     {fn:"ecological_flag", ty:"enum", t:["DG"], note:"EcologicalFlag — carried from the OAD design → FRS reads this", s:"new"},
     {fn:"source", ty:"enum", t:["DG"], note:"internal | external_dependency — keep external sourcing transparent", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:MCE-002",
  "timestamp": "2026-06-04T11:20:00Z",
  "task_ref": "stillwater:TI-04",
  "production_plan_ref": "stillwater:PP-001",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "node_id": "stillwater",
  "governance_scope": "node",
  "material_id": "steel_section",
  "material_name": "Recycled structural steel section",
  "quantity_consumed": 320,
  "unit": "kg",
  "quantity_remaining": 140,
  "ecological_flag": "low",
  "source": "internal"
}`},
 ],
 handoff:`A transparent record of every material drawn — the COS→ITC/FRS materials contract — with ecological flags intact.`,
 prov:`${REF.wpcos} (Module 3) describes the real-time material ledger and scarcity signals; ${REF.dg43} schematizes <b>MaterialConsumptionEvent</b>. The coarse <code>source</code> enum is derived from a richer 4-value white-paper source (open question OQ-09). Schema: ${LSPEC("schemas/cos/material-consumption-event.json")} (validated live). Full spec: ${LSPEC("specs/04-cos.md")}.`,
 check:{q:"Why does a materials record carry an ecological_flag at all?", a:"Because FRS (the feedback/reliability system) reads it to track the node's ecological stress, and ITC factors scarcity into access-values. COS is the only place this fact is captured at the moment of consumption — so it travels with the record."}},

// ----------------------------------------------------------------- M4
{kind:"module", mod:4, nav:"M4 · Execution", group:"The pipeline", badge:"M4", title:"Cooperative Workflow Execution",
 job:"Run the workflow in real time — and write every operational event to an append-only ledger.",
 story:`The build runs. Site prep finishes; pier reinforcement starts; the welding station opens. Progress is visible to everyone, so when one task finishes early the worker drifts to the next without anyone directing them.`,
 community:`As tasks change state and labor/materials are logged, COS streams each event into the <b>COSEvent</b> ledger — an <b>append-only</b> operational history. This is the §2.2 source-of-truth principle in action: nothing is overwritten, so ITC and FRS can always reconstruct what really happened.`,
 dataIntro:`M4 produces <b>COSEvent</b> ledger entries — one per operational event (labor logged, material drawn, task state change). They're append-only and hash-chained. Plan status → <code>in_progress</code>.`,
 objects:[
   {type:"COSEvent", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"event_id", ty:"string", t:["WP"], note:"unique id for this ledger entry", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"which node", s:"new"},
     {fn:"timestamp", ty:"string", t:["WP"], note:"when it happened", s:"new"},
     {fn:"event_type", ty:"enum", t:["WP"], note:"COSEventType: labor | material | workflow | qa | distribution | coordination", s:"new"},
     {fn:"design_ref", ty:"string", t:["WP"], note:"the design this event relates to", s:"new"},
     {fn:"payload", ty:"object", t:["WP"], note:"event-type-specific detail (e.g. the task state change)", s:"new"},
     {fn:"prev_hash", ty:"string|null", t:["WP","DEFERRED"], note:"chains entries into a tamper-evident ledger", s:"new"},
     {fn:"event_hash", ty:"string|null", t:["WP","DEFERRED"], note:"this entry's hash", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:CE-011",
  "node_id": "stillwater",
  "timestamp": "2026-06-04T15:02:00Z",
  "event_type": "workflow",
  "coop_unit_id": "stillwater:fabrication-crew",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "payload": {"task_ref": "stillwater:TI-04", "transition": "in_progress→done", "actual_hours": 31},
  "prev_hash": "sha256:9af1c2...",
  "event_hash": "sha256:b7e034..."
}`},
 ],
 handoff:`A complete, ordered, append-only trace of the build — the spine of COS's transparency.`,
 prov:`${REF.wpcos} (Module 4: workflow execution; Module 9: ledger) — COS logs labor, materials, throughput, failures, and distribution for full cybernetic traceability. The append-only <code>COSEvent</code> ledger exists from day one (§2.2 source-of-truth principle). A <b>proposed shape</b> in ${LSPEC("specs/04-cos.md")} — not yet schematized.`,
 check:{q:"Why must the COSEvent ledger be append-only?", a:"Because it's the single source of truth ITC and FRS depend on. If entries could be edited or deleted, the labor and materials history (and therefore every access-value and reliability signal built on it) would be untrustworthy. You only ever add."}},

// ----------------------------------------------------------------- M5
{kind:"module", mod:5, nav:"M5 · Balancing", group:"The pipeline", badge:"M5", title:"Capacity, Throughput & Constraint Balancing",
 job:"Spot bottlenecks, reroute labor, and signal scarcity upward — without halting the build.",
 story:`The single welding rig becomes a bottleneck: Maya can only weld one frame section at a time, and the deck-rebuild crew is now waiting on her. COS makes the constraint visible. Devon and Sam shift to non-blocked tasks (rail prep) while the weld finishes.`,
 community:`Rather than a manager rebalancing, COS surfaces the constraint and people self-reconfigure. Crucially, COS <b>signals ITC</b> that expert welding is temporarily scarce — so the weighting can edge up modestly, drawing more help without coercion.`,
 dataIntro:`M5 doesn't mint a new boundary record in the minimal build — it updates <b>TaskInstance</b> states (some <code>blocked</code>) and writes <code>coordination</code>-type entries to the <b>COSEvent</b> ledger. Plan status → <code>balanced</code>.`,
 objects:[
   {type:"COSEvent", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"event_type", ty:"enum", t:["WP"], note:'here: "coordination" — a rebalancing event', s:"new"},
     {fn:"payload", ty:"object", t:["WP"], note:"the bottleneck, the reroute, and the scarcity signal sent to ITC", s:"new"},
     {fn:"timestamp", ty:"string", t:["WP"], note:"when the rebalance happened", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:CE-014",
  "node_id": "stillwater",
  "timestamp": "2026-06-04T16:40:00Z",
  "event_type": "coordination",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "payload": {
    "bottleneck": "expert_welding (single rig)",
    "blocked_tasks": ["stillwater:TI-05"],
    "reroute": "deck crew → rail prep until weld clears",
    "itc_scarcity_signal": {"skill_tier": "expert", "direction": "temporary_uplift"}
  }
}`},
 ],
 handoff:`A still-flowing build, plus a scarcity signal to ITC — the system absorbing variety to stay viable.`,
 prov:`${REF.wpcos} (Module 5: capacity, throughput &amp; constraint balancing) — "absorbing variety to maintain viability," classic cybernetics. The dedicated capacity/constraint records (COSCapacitySnapshot, COSConstraint, ConstraintSignal) are <b>deferred</b> module-internal shapes; the minimal build expresses balancing through TaskInstance states and COSEvent entries. See ${LSPEC("specs/04-cos.md")}.`,
 check:{q:"A skill becomes scarce mid-build. How does COS get more hands without ordering anyone?", a:"It signals ITC that the skill is temporarily scarce. ITC nudges the weighting up modestly, which draws volunteers — coordination through transparent signals, not command."}},

// ----------------------------------------------------------------- M6
{kind:"module", mod:6, nav:"M6 · Distribution", group:"The pipeline", badge:"M6", title:"Distribution & Access Flow Coordination",
 job:"Route the finished good into use — and link it to ITC's access logic.",
 story:`The retrofitted bridge is complete. It's not a product to be sold — it's shared community infrastructure. COS routes it into <b>shared use</b>: anyone in Stillwater can cross it, and no credits are extinguished (shared use, not personal acquisition).`,
 community:`COS records the distribution and the <b>access mode</b>. The <code>access_mode</code> enum is <b>shared with ITC</b> — so the COS side of "credits extinguished on access" and the ITC side can never silently diverge.`,
 dataIntro:`M6 produces a <b>COSDistributionRecord</b> linking the finished unit to its access mode and (if relevant) the ITC access valuation. Here the mode is <code>shared_use_lock</code>. Plan status → <code>distributed</code>.`,
 objects:[
   {type:"COSDistributionRecord", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"distribution_id", ty:"string", t:["WP"], note:"id for this distribution event", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"which node", s:"new"},
     {fn:"design_ref", ty:"string", t:["WP"], note:"the design / unit being distributed", s:"new"},
     {fn:"unit_serial", ty:"string", t:["WP"], note:"the specific finished unit", s:"new"},
     {fn:"access_mode", ty:"enum", t:["WP"], note:"AccessMode (shared with ITC): permanent_acquisition | shared_use_lock | service_use", s:"new"},
     {fn:"assigned_center_id", ty:"string|null", t:["WP"], note:"access center / fleet — null for fixed infrastructure", s:"new"},
     {fn:"access_valuation_ref", ty:"string|null", t:["WP"], note:"link to the ITC AccessValuation used (if any)", s:"new"},
    ],
    json:`{
  "distribution_id": "stillwater:DIST-001",
  "node_id": "stillwater",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "unit_serial": "stillwater:BRIDGE-RETRO-0001",
  "timestamp": "2026-06-05T09:00:00Z",
  "access_mode": "shared_use_lock",
  "assigned_center_id": null,
  "access_valuation_ref": null,
  "notes": "Fixed community infrastructure — shared use, no credit extinguishment."
}`},
 ],
 handoff:`The finished crossing is in use. For an acquirable good, this record would link to an ITC RedemptionRecord that extinguishes credits.`,
 prov:`${REF.wpcos} (Module 6: distribution &amp; access flow coordination). The shared <code>access_mode</code> enum is the COS side of the §1.3 "credits extinguished on access" loop (open question OQ-08) — a <code>permanent_acquisition</code> distribution corresponds to an ITC RedemptionRecord. A <b>proposed shape</b> in ${LSPEC("specs/04-cos.md")}.`,
 check:{q:"Why is access_mode a shared enum between COS and ITC?", a:"Because distribution (COS) and credit extinguishment (ITC) are two sides of the same event. If each system defined its own access modes, they could drift apart and the 'credits extinguished on permanent acquisition' rule would break. One shared enum keeps them locked together."}},

// ----------------------------------------------------------------- M7
{kind:"module", mod:7, nav:"M7 · QA", group:"The pipeline", badge:"M7", title:"Quality Assurance & Safety Verification",
 job:"Test the finished work — and feed the result to FRS and OAD.",
 story:`Before the bridge opens, it's checked: load test (safety), weld inspection (durability), and an accessibility check (Devon verifies wheelchair and elderly access). Tomas adds an eco-compliance check on the finish. The structure passes; one weld fails inspection and is re-done.`,
 community:`Each check becomes a <b>QAEvent</b>: what was tested, pass or fail, the metrics, and a severity index FRS uses. Failures flow to OAD (possible redesign) and FRS (lifecycle/reliability tracking).`,
 dataIntro:`M7 produces a <b>QAEvent</b> per test. The DevGuide FRS schema <i>requires</i> QA data but §4.3 never schematized it — so this is a known boundary gap. Plan status → <code>qa_checked</code>.`,
 objects:[
   {type:"QAEvent", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"qa_event_id", ty:"string", t:["WP"], note:"id for this QA result", s:"new"},
     {fn:"design_ref", ty:"string", t:["WP"], note:"the design being verified", s:"new"},
     {fn:"test_type", ty:"enum", t:["WP"], note:"QATestType: functional | safety | durability | maintainability | eco_compliance", s:"new"},
     {fn:"passed", ty:"boolean", t:["WP"], note:"the headline result", s:"new"},
     {fn:"metrics", ty:"object", t:["WP"], note:"measured values (e.g. load held, repair_time_hours)", s:"new"},
     {fn:"failure_rate", ty:"number", t:["WP"], note:"batch-level unit failure rate", s:"new"},
     {fn:"severity_index", ty:"number", t:["DG"], note:"feeds FRS severity mapping for any failure", s:"new"},
    ],
    json:`{
  "qa_event_id": "stillwater:QA-002",
  "node_id": "stillwater",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "batch_id": "stillwater:BATCH-001",
  "timestamp": "2026-06-05T08:10:00Z",
  "test_type": "safety",
  "passed": true,
  "metrics": {"design_load_kN": 50, "tested_load_kN": 75, "deflection_mm": 6},
  "failure_rate": 0.0,
  "severity_index": 0,
  "notes": "One weld failed inspection and was re-done before this pass."
}`},
 ],
 handoff:`A verified safety/quality record — the COS→FRS quality contract — feeding reliability monitoring and any redesign.`,
 prov:`${REF.wpcos} (Module 7: QA &amp; safety verification). The DevGuide FRS schema (<code>FRSSignalPacket.qa_summary</code>, diagnostic type <code>quality_reliability_drift</code>) <b>requires</b> QA data, yet ${REF.dg43} never schematizes it — drawn here from the white paper's QATestResult/QABatchSummary. A <b>proposed shape</b> in ${LSPEC("specs/04-cos.md")}; promoting it is tracked in OQ-10.`,
 check:{q:"FRS needs QA data, but no QA schema was written. What does that tell you?", a:"It's a real boundary gap: a consumer (FRS) expects data a producer (COS) was never given a contract to emit. Spotting and closing exactly these gaps — by schematizing QAEvent — is one of the most useful contributions available."}},

// ----------------------------------------------------------------- M8
{kind:"module", mod:8, nav:"M8 · Ledger", group:"The pipeline", badge:"M8", title:"Transparency, Ledger & Audit",
 job:"Close the loop — aggregate the clean data ITC and FRS depend on.",
 story:`The build is done. COS now rolls its append-only ledger into the period aggregates the other systems read: a labor/materials summary for ITC to value, and a production trace for FRS to monitor. The ProductionPlan's status reaches its final state.`,
 community:`Nothing in Integral is trusted without a traceable record. COS hands ITC and FRS <b>derived summaries</b> built from the COSEvent ledger — not raw guesses — so valuation and ecological monitoring rest on real production facts.`,
 dataIntro:`M8 emits two interface aggregates: a <b>ProductionSummary</b> for ITC and an <b>OperationalSignalData</b> trace for FRS, both derived from the ledger. Plan status → <code>recorded</code> — the same ProductionPlan from M1, now complete.`,
 objects:[
   {type:"ProductionSummary", tier:"proposed", contract:"(proposed shape)",
    fields:[
     {fn:"plan_id", ty:"string", t:["WP"], note:"the production run summarised", s:"carried"},
     {fn:"total_weighted_hours_by_tier", ty:"object", t:["WP"], note:"for ITC valuation (after weighting)", s:"new"},
     {fn:"total_raw_hours_by_tier", ty:"object", t:["WP"], note:"the raw labor reality COS captured", s:"new"},
     {fn:"material_consumption", ty:"object", t:["WP"], note:"totals per material, with ecological flags", s:"new"},
     {fn:"units_completed", ty:"integer", t:["WP"], note:"how many units finished", s:"new"},
     {fn:"units_failed_qa", ty:"integer", t:["WP"], note:"how many failed QA (feeds reliability)", s:"new"},
    ],
    json:`{
  "plan_id": "stillwater:PP-001",
  "node_id": "stillwater",
  "design_ref": "stillwater:BRIDGE-RETRO@v1.0",
  "total_raw_hours_by_tier": {"expert": 31, "high": 44, "medium": 43, "low": 16},
  "material_consumption": {"steel_section_kg": 320, "timber_decking_kg": 180, "welding_gas_m3": 4},
  "units_completed": 1,
  "units_failed_qa": 0
}
// → consumed by ITC (valuation). A parallel OperationalSignalData trace → FRS.
// ↻ ProductionPlan.status: "qa_checked" → "recorded"  (same object, mutated across the pipeline)`},
 ],
 handoff:`The loop is closed: ITC computes access-values from these facts, FRS watches the bridge in service, and any drift raises a fresh signal back into the CDS — and the whole cycle begins again.`,
 prov:`${REF.wpcos} (Module 9: transparency, ledger &amp; audit). The interface aggregates (<code>ProductionSummary</code> / <code>ITCProductionSummary</code> and <code>OperationalSignalData</code> / <code>FRSProductionTrace</code>) are the §4.4 promised shapes COS hands to ITC and FRS. <b>Proposed shapes</b> in ${LSPEC("specs/04-cos.md")}.`,
 check:{q:"The ProductionPlan from M1 — is the M8 plan a different object?", a:"No — it's the same ProductionPlan, mutated as it travelled. Its status advanced planned → … → recorded. Watching that one field move across steps is the clearest picture of 'data updated across the pipeline.'"}},

// ----------------------------------------------------------------- Recap
{kind:"concept", nav:"Recap & where to help", group:"Wrap-up", badge:"✓", title:"You've followed production end to end",
 body:`
 <p class="lead">A certified design became a finished, verified, recorded bridge — and every step handed the next a well-shaped baton, while COS quietly produced the labor and materials facts that ITC and FRS live on.</p>
 <div class="sec"><div class="lbl">What you saw</div>
 <p>A <b>ProductionPlan</b> was born at M1 and its <code>status</code> advanced through eight stages to <code>recorded</code>. Along the way COS created TaskDefinitions, TaskInstances, LaborEvents, MaterialConsumptionEvents, a COSEvent ledger, a COSDistributionRecord, QAEvents, and the ITC/FRS interface summaries — turning a design into trustworthy production data.</p></div>
 <div class="callout teal"><b>The schema coverage map (where you can help).</b> COS is the <b>largest schema-coverage gap in the whole project.</b> The white paper describes <b>43</b> COS objects across 9 modules, but only <b>2</b> have a machine-checkable JSON-Schema contract today — <code>LaborEvent</code> and <code>MaterialConsumptionEvent</code> (the two records that cross into ITC and FRS). <i>Everything else you saw</i> — ProductionPlan, TaskDefinition, TaskInstance, COSEvent, COSDistributionRecord, QAEvent, the interface summaries — is a <b>proposed shape</b> written in the spec prose but not yet schematized. Formalising even one of them (QAEvent is a standout — FRS already expects it) is among the clearest, most useful contributions available right now. (To be clear: even the two schema-backed records are <i>candidate</i>, not ratified.)</div>
 <div class="sec"><div class="lbl">Go deeper</div>
 <p>• Read the COS spec &amp; its 43-object inventory: <code>integral-schema-exercise/specs/04-cos.md</code>.<br>
 • See the two ratified COS schemas: <code>schemas/cos/labor-event.json</code> and <code>schemas/cos/material-consumption-event.json</code>.<br>
 • Track the open questions (OQ-03 raw vs weighted hours, OQ-08 access-mode loop, OQ-09 material source, OQ-10 promoting deferred shapes): <code>specs/07-open-questions.md</code>.<br>
 • Provenance throughout traces to the ${REF.wpcos}, the ${REF.dg34} (and §4.3, §4.4, §5.1), and the author's ${REF.ep(0,"Ep.59")} walkthrough.</p></div>
 <div class="callout"><b>Thank you for onboarding.</b> COS is where governance and design become physical reality — and its data is the ground truth the rest of the federation stands on. Helping schematize it is helping build that ground.</div>
 `},
];

// META — per-system labels the engine uses for the title, header, and data panel.
const META = {
  key: "cos",
  emoji: "🛠️",
  title: "COS · Start Here",
  sub: "The data structures behind Integral's Cooperative Organization System — one step at a time",
  panelHint: "Watch the records accumulate — and the ProductionPlan's <code>status</code> field advance — as you move through the pipeline.",
  statusObjectName: "ProductionPlan",   // the object whose status field advances
  statusEnumName: "ProductionPlanStatus",
  statusObjectId: "stillwater:PP-001",
};
