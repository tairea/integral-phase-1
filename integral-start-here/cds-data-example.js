const GH_DG="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md";
const GH_WP="https://github.com/Integral-Collective/integral-whitepaper/blob/main/whitepaper";
const YT="https://youtu.be/NPaBrjjVCtE";
const REF={
  dg41:lnk(GH_DG+"#41-why-data-architecture-comes-first","Developer Guide §4.1"),
  dg51:lnk(GH_DG+"#51-phase-1--governance-and-system-definition","Developer Guide §5.1"),
  dg31:lnk(GH_DG+"#31-cds--collaborative-decision-system-proposed-core-modules","Developer Guide §3.1"),
  dg44:lnk(GH_DG+"#44-api-boundaries-and-inter-system-interfaces","§4.4"),
  wpcds:lnk(GH_WP+"/07-modules/07-1-cds/cds-01-overview.md","White Paper §7.1 (CDS)"),
  ep:(t,label)=>lnk(YT+(t?"?t="+t:""), label||"Ep.59"),
};

// ----- Issue status lifecycle (the field that visibly advances) -----
const STATUS = ["intake","structured","context_ready","constrained","deliberation","consensus_check","decided","dispatched"];

// ----- object timeline: which records exist by which module step (module index 1..8) -----
const OBJECTS = [
  {type:"Issue",            count:1,  tier:"ratified", at:1},
  {type:"Submission",       count:8,  tier:"ratified", at:1},
  {type:"StructuredIssueView",count:1,tier:"proposed", at:2},
  {type:"ContextModel",     count:1,  tier:"proposed", at:3},
  {type:"Scenario",         count:4,  tier:"proposed", at:4},
  {type:"ConstraintReport", count:4,  tier:"proposed", at:4},
  {type:"Vote",             count:20, tier:"proposed", at:5},
  {type:"Objection",        count:5,  tier:"proposed", at:5},
  {type:"ConsensusResult",  count:4,  tier:"proposed", at:6},
  {type:"DecisionRecord",   count:1,  tier:"ratified", at:7},
  {type:"DispatchPacket",   count:1,  tier:"ratified", at:8},
];

// ===================================================================== STEPS
// kind: "concept" (foundations/recap) or "module" (full scaffold). mod = module number 1..8.
const STEPS = [
{kind:"concept", nav:"Welcome", group:"Orientation", badge:"00", title:"What you're about to learn",
 body:`
 <p class="lead">Integral coordinates a community's production and decisions <b>without money and without bosses</b>. To do that, every decision flows through a pipeline of eight steps called the <b>CDS</b> — the Collaborative Decision System.</p>
 <p>For that pipeline to work, each step must hand the next step its information in an <b>agreed shape</b>. Those agreed shapes are called <b>schemas</b> (or "data contracts"). This walkthrough teaches you those shapes — gently, one step at a time — by following a single real decision from start to finish.</p>
 <div class="callout"><b>You don't need to be a programmer.</b> We start in plain language. The technical detail is always optional (look for the "see the actual schema" toggles). By the end you'll understand the data structure behind the whole system — enough to review it and suggest improvements.</div>
 <div class="callout warn"><b>⚠️ Status: a proposed candidate — not ratified.</b> Everything described here — the schemas, the simulator, the example decision records — is <b>Phase-1 candidate work</b> (${REF.dg51}), offered to the contributor community to <b>review, challenge, and ratify</b>. Nothing here is adopted, and the substantive design questions are deliberately still open (there are <b>17 open questions</b>; two of them gate Phase 2). Treat it as a starting point for deliberation, not a settled blueprint.
 <div class="prov" style="margin-top:10px"><b>Already familiar with the system?</b> Skip ahead to the candidate specs &amp; contracts (local repo):
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/01-cds.md" target="_blank" rel="noopener">CDS schema spec</a> ·
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/00-canonical-enums.md" target="_blank" rel="noopener">canonical enums</a> ·
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/06-cross-contract-matrix.md" target="_blank" rel="noopener">cross-contract matrix</a> ·
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/specs/07-open-questions.md" target="_blank" rel="noopener">open questions (ratification register)</a> ·
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/decisions/DR-001-adopt-schema-baseline/DR-001.md" target="_blank" rel="noopener">candidate ratification record (DR-001)</a> ·
 <a href="https://github.com/tairea/integral-data-start-here/blob/main/integral-schema-exercise/README.md" target="_blank" rel="noopener">schema exercise overview</a><br>
 Source material (GitHub): ${lnk(GH_DG,"Developer Guide")} ·
 ${lnk("https://github.com/Integral-Collective/integral-whitepaper/tree/main/whitepaper","Technical White Paper")} ·
 ${REF.ep(0,"Revolution Now! Ep.59 (CDS walkthrough)")}.</div></div>
 <div class="sec"><div class="lbl">How to use this</div>
 <p>Move with <b>Next / Back</b> (or the ← → arrow keys), or jump around using the menu on the left. The panel on the right — <b>"The data so far"</b> — fills up as you go, so you can literally watch the records being created and the Issue's status advance.</p></div>
 `},

{kind:"concept", nav:"The setting & the CDS", group:"Foundations", badge:"01", title:"A node, a co-op, and a pipeline",
 body:`
 <div class="sec"><div class="lbl">The setting</div>
 <p>An Integral <b>node</b> is a community (think: a town or neighborhood). Inside it are <b>co-ops</b> — smaller working groups (a farm, a workshop, a transport crew). When something needs deciding that affects the whole node, it goes to the node's CDS.</p></div>
 <div class="sec"><div class="lbl">The CDS pipeline — 8 steps</div>
 <p>A decision is a <b>sequence of transformations</b>: something is noticed → defined → understood → checked → discussed → weighed → recorded → dispatched. Each step is a "module":</p>
 <div class="obj"><div class="field"><span class="fn">M1 · Intake</span><span class="fnote">capture what people raise; remove duplicates</span></div>
 <div class="field"><span class="fn">M2 · Structuring</span><span class="fnote">group related submissions into themes</span></div>
 <div class="field"><span class="fn">M3 · Context</span><span class="fnote">gather the facts around the issue</span></div>
 <div class="field"><span class="fn">M4 · Constraints</span><span class="fnote">check options against hard limits (+ auto-generate options)</span></div>
 <div class="field"><span class="fn">M5 · Deliberation</span><span class="fnote">the community weighs in: preferences + objections</span></div>
 <div class="field"><span class="fn">M6 · Consensus</span><span class="fnote">do the math; pick a winner — or send back / escalate</span></div>
 <div class="field"><span class="fn">M7 · Record</span><span class="fnote">write the decision into a permanent ledger</span></div>
 <div class="field"><span class="fn">M8 · Dispatch</span><span class="fnote">send the decision out to act on, and set up monitoring</span></div></div>
 <p class="prov">We'll visit each one. The left menu mirrors these eight steps.</p></div>
 `},

{kind:"concept", nav:"What's a schema?", group:"Foundations", badge:"02", title:"Schemas: the agreed shape of the data",
 body:`
 <p class="lead">Picture a <b>relay race</b>. Each runner (a module) hands a baton (the data) to the next. If the baton is the wrong shape, the next runner drops it.</p>
 <p>A <b>schema</b> is the written-down, agreed shape of the baton — what fields it has, what type each field is, which values are allowed. Integral writes these shapes down <b>before building anything</b>, on purpose.</p>
 <div class="callout warn"><b>Why before?</b> If two modules disagree on the shape after records already exist, you can't just patch it — you'd have to re-format every record ever written, which destroys the community's history. (This is the core argument in the ${REF.dg41}.) Getting the shapes right early is the cheapest insurance the project has.</div>
 <div class="sec"><div class="lbl">A field can be present but empty</div>
 <p>Some fields exist in the shape from day one even though they aren't filled in yet — they're reserved for later (e.g. for when nodes connect into a federation). You'll see these tags on fields:</p>
 <div class="contract">
   ${tag("WP")} from the <b>White Paper</b> &nbsp; ${tag("DG")} from the <b>Developer Guide</b> &nbsp;
   ${tag("DEFERRED")} reserved, filled later &nbsp; ${tag("FED")} for federation (mostly empty for now)
 </div></div>
 <div class="check" id="chk-schema"><div class="q">🤔 Why write schemas before code?</div>
 <button onclick="document.getElementById('chk-schema').classList.add('show')">Show answer</button>
 <div class="a">Because changing a data shape <i>after</i> records exist means re-formatting all of history — slow, costly, and trust-destroying. The shape is the contract every module relies on, so it's agreed first.</div></div>
 `},

{kind:"concept", nav:"The cast & the scenario", group:"Foundations", badge:"03", title:"Five neighbors, one footbridge",
 body:`
 <p class="lead">We'll follow one real decision the whole way, inside a single community — a node named <b>Stillwater</b>. (That's why every id in the data looks like <code>stillwater:…</code> — it's the node id.) The scenario:</p>
 <div class="callout"><b>In Stillwater, the footbridge to the vertical farm floods during storms.</b> It's the only path to the farm, it's a 60-year-old timber bridge with deep local meaning, it crosses a salmon-bearing creek (Mill Creek), and the node has limited labor-hours. What should they do?</div>
 <div class="sec"><div class="lbl">The five participants — all members of Stillwater (each cares about different things)</div>
 <div class="obj">
 <div class="field"><span class="fn">Maya</span><span class="fnote">fabrication — wants a fix that actually holds</span></div>
 <div class="field"><span class="fn">Tomas</span><span class="fnote">ecology — watches embodied carbon & the watershed</span></div>
 <div class="field"><span class="fn">Beatrice</span><span class="fnote">elder — the old bridge carries communal memory</span></div>
 <div class="field"><span class="fn">Devon</span><span class="fnote">access — every member must still reach the farm</span></div>
 <div class="field"><span class="fn">Sam</span><span class="fnote">labor/materials — who carries the work, and the cost?</span></div></div></div>
 <p>These are <i>simulated</i> participants. In the live simulator they're played by an AI model; offline they're driven by a transparent value model. Either way, what matters for us is the <b>data they produce</b> as the decision moves along. Let's begin. →</p>
 `},

// ----------------------------------------------------------------- M1
{kind:"module", mod:1, nav:"M1 · Intake", group:"The pipeline", badge:"M1", title:"Issue Capture & Signal Intake",
 job:"Capture what people raise — and quietly remove duplicates.",
 story:`Storms keep cutting off the farm. Several neighbors report it within the same hour, sometimes saying almost the same thing. A couple of them propose fixes. One report could even come from another system as an automated alert.`,
 community:`People in Stillwater submit short concerns or proposals through a simple form — and these <b>Submission</b> records are the very first objects created, <i>before</i> any Issue exists. Eight arrive within the hour. Notice that three of them (Maya, Devon, Sam) describe being "cut off" in almost the same words: M1 keeps the first as the <b>canonical</b> entry and <b>links</b> the other two to it as duplicates — nothing is discarded.`,
 submissions:[
   {id:"SUB-001", who:"Maya", dup:null, content:"Every storm the crossing fails and the crew is cut off — we need a fix that actually holds."},
   {id:"SUB-002", who:"Maya", dup:null, content:"When Mill Creek floods, the farm crew gets cut off and produce can't move."},
   {id:"SUB-003", who:"Tomas", dup:null, content:"Mill Creek is salmon-bearing; whatever we do can't disturb the stream or import high-carbon material."},
   {id:"SUB-004", who:"Beatrice", dup:null, content:"That bridge was raised by our own hands sixty years ago. It is not just lumber to some of us."},
   {id:"SUB-005", who:"Devon", dup:null, content:"When it floods, our elderly and wheelchair members can't reach the farm at all. People get stranded."},
   {id:"SUB-006", who:"Devon", dup:"SUB-002", content:"When the creek floods, the farm crew is cut off and deliveries can't move."},
   {id:"SUB-007", who:"Sam", dup:null, content:"We have ~140 labor-hours this window. A heavy build eats all of it — who carries that load?"},
   {id:"SUB-008", who:"Sam", dup:"SUB-002", content:"When Mill Creek floods the farm crew is cut off and produce can't move."},
 ],
 submissionObj:{type:"Submission", tier:"ratified", contract:"schemas/cds/submission.json",
   fields:[
    {fn:"submission_id", ty:"string", t:["WP"], note:"unique id for this one input", s:"new"},
    {fn:"author_id", ty:"string", t:["FED"], note:"node-id:person-id — who submitted it (globally unique)", s:"new"},
    {fn:"type", ty:"enum", t:["WP"], note:"concern | proposal | objection | evidence | comment | signal", s:"new"},
    {fn:"content", ty:"string", t:["WP"], note:"what they actually wrote", s:"new"},
    {fn:"duplicate_of", ty:"string|null", t:["DG"], note:"if a near-duplicate, points to the canonical one (kept, not deleted)", s:"new"},
    {fn:"embedding", ty:"array|null", t:["DG","DEFERRED"], note:"reserved — the numeric 'meaning' used to spot duplicates", s:"new"},
   ]},
 dataIntro:`From those eight submissions, M1 assembles the root <b>Issue</b> that bundles them (de-duplicated). Watch its <code>status</code> field — it starts at <code>intake</code> and advances at every module →.`,
 objects:[
   {type:"Issue", tier:"ratified", contract:"schemas/cds/issue.json",
    fields:[
     {fn:"issue_id", ty:"string", t:["WP"], note:"unique id for this whole decision", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"which node — here, Stillwater; federation-aware from day one", s:"new"},
     {fn:"governance_scope", ty:"enum", t:["DG"], note:"coop | node | network — which level owns this", s:"new"},
     {fn:"status", ty:"enum", t:["WP"], note:'starts at "intake" — this field advances every module →', s:"new"},
     {fn:"submission_ids", ty:"array", t:["WP"], note:"links to every submission (incl. duplicates)", s:"new"},
     {fn:"federation_hash", ty:"string|null", t:["FED","DEFERRED"], note:"reserved (null) until nodes connect", s:"new"},
    ],
    json:`{
  "issue_id": "stillwater:ISS-001",
  "node_id": "stillwater",
  "governance_scope": "node",
  "status": "intake",
  "title": "The footbridge to the vertical farm floods during storms",
  "submission_ids": ["stillwater:SUB-001", "... ×8"],
  "federation_hash": null
}`},
 ],
 handoff:`A clean, de-duplicated set of submissions, bundled under one Issue — ready to be organised.`,
 prov:`${REF.wpcds} defines intake + cosine-similarity de-duplication. The mechanism was detailed by the author in ${REF.ep(2145,"Ep.59 (~35:45)")}. Schema: ${LSPEC("specs/01-cds.md")} → ${LSPEC("schemas/cds/issue.json")}.`,
 check:{q:"What happens to a duplicate submission?", a:"It's kept and linked to the original (the canonical entry) — with its author and timestamp — never discarded. The community's input is preserved."}},

// ----------------------------------------------------------------- M2
{kind:"module", mod:2, nav:"M2 · Structuring", group:"The pipeline", badge:"M2", title:"Issue Structuring & Framing",
 job:"Group related submissions into clear themes.",
 story:`The raw pile of concerns is messy. Some are about safety, some about the creek's ecology, some about the bridge's heritage, some about who can still reach the farm, some about cost.`,
 community:`A facilitator (later, software) clusters the submissions so the discussion space is navigable instead of a flat list.`,
 dataIntro:`M2 produces a <b>StructuredIssueView</b>: the same submissions, grouped by theme, with traceable links back to each original. Note the Issue's <code>status</code> has advanced to <code>structured</code>.`,
 object:{type:"StructuredIssueView", tier:"proposed", contract:"(proposed shape — not yet a JSON-Schema contract)",
   fields:[
    {fn:"issue_id", ty:"string", t:["WP"], note:"the Issue this view belongs to", s:"carried"},
    {fn:"clusters", ty:"array", t:["WP"], note:"groups of submission_ids by theme (traceable back to M1)", s:"new"},
    {fn:"themes", ty:"array", t:["WP"], note:"the topic labels found: resilience, ecology, heritage, equity, cost", s:"new"},
    {fn:"metadata", ty:"object", t:["WP"], note:"how the grouping was produced (transparency)", s:"new"},
   ]},
 jsonPeek:`{
  "issue_id": "stillwater:ISS-001",
  "themes": ["resilience", "ecology", "heritage", "equity", "cost"],
  "clusters": [
    {"label": "heritage", "submission_ids": ["stillwater:SUB-004"]},
    {"label": "equity",   "submission_ids": ["stillwater:SUB-003"]}
  ]
}`,
 handoff:`A themed map of the issue, so the next step knows what facts to gather.`,
 prov:`${REF.wpcds} (M2: semantic clustering + argument mapping). Evidence submissions are a "pass-through" to M3 (not clustered) — author, ${REF.ep(2345,"Ep.59 ~39:05")}. This object is a <b>proposed shape</b> in ${LSPEC("specs/01-cds.md")} with no JSON Schema yet — an area to formalise.`,
 check:{q:"Why is StructuredIssueView amber (proposed), not green (ratified)?", a:"Only the records that cross between systems were given strict JSON-Schema contracts so far. Internal CDS shapes like this one are written in the spec prose but not yet schematized — exactly the kind of gap the collective can close."}},

// ----------------------------------------------------------------- M3
{kind:"module", mod:3, nav:"M3 · Context", group:"The pipeline", badge:"M3", title:"Knowledge Integration & Context Engine",
 job:"Build the factual landscape around the issue before anyone argues.",
 story:`Before debating, the node pulls the relevant facts: the bridge's history, the creek's ecological constraints, what materials and labor-hours are on hand, which co-ops depend on the crossing.`,
 community:`A reviewer (later, automated retrieval) gathers context from the other four systems (OAD, COS, ITC, FRS) so the deliberation is informed, not guesswork.`,
 dataIntro:`M3 produces a <b>ContextModel</b> — a structured snapshot of the surrounding reality. Status is now <code>context_ready</code>.`,
 object:{type:"ContextModel", tier:"proposed", contract:"(proposed shape — not yet a JSON-Schema contract)",
   fields:[
    {fn:"issue_id", ty:"string", t:["WP"], note:"the Issue", s:"carried"},
    {fn:"historical", ty:"string", t:["WP"], note:"e.g. built 1966, 3 flood closures this season", s:"new"},
    {fn:"ecological", ty:"string", t:["WP"], note:"salmon-bearing creek; in-stream works constrained", s:"new"},
    {fn:"labor", ty:"string", t:["WP"], note:"~140 skilled labor-hours available this window", s:"new"},
    {fn:"dependencies", ty:"string", t:["WP"], note:"farm + transport co-ops rely on this crossing", s:"new"},
    {fn:"evidence_index", ty:"array", t:["WP"], note:"links to logs, inspection reports, maps", s:"new"},
   ]},
 jsonPeek:`{
  "issue_id": "stillwater:ISS-001",
  "historical": "Bridge built 1966; 3 flood closures already this season.",
  "ecological": "Mill Creek is salmon-bearing; in-stream works constrained.",
  "labor": "~140 skilled labor-hours available next window.",
  "evidence_index": ["flood-log-2026.csv", "bridge-inspection-2024.pdf"]
}`,
 handoff:`The facts. Next, the system turns the issue into concrete options and checks them against hard limits.`,
 prov:`${REF.wpcds} (M3: knowledge integration / retrieval from the other systems). The author notes large language models can power this retrieval — ${REF.ep(2545,"Ep.59 ~42:25")}.`,
 check:null},

// ----------------------------------------------------------------- M4
{kind:"module", mod:4, nav:"M4 · Constraints", group:"The pipeline", badge:"M4", title:"Constraint Checking (+ auto-generated options)",
 job:"Turn the issue into options, then test each against the node's hard limits.",
 story:`Two fixes were proposed by members. The system also <b>auto-generates</b> two more options worth considering — an automatic step that sits between Modules 3 and 4. Now each is checked against the rules the node has set for itself.`,
 community:`The four options: raise the bridge in place (P1), demolish & rebuild in composite (P2), reroute around the ridge (P3), seasonal floating walkway (P4).`,
 dataIntro:`M4 creates a <b>Scenario</b> object per option and a <b>ConstraintReport</b> per scenario. Two options fail hard limits: <b>P2</b> blows the ecological budget, <b>P3</b> breaks the accessibility floor. Status → <code>constrained</code>.`,
 object:{type:"Scenario", tier:"proposed", contract:"(proposed shape — defined in spec, not yet schematized)",
   fields:[
    {fn:"scenario_id", ty:"string", t:["WP"], note:"id for this option", s:"new"},
    {fn:"label", ty:"string", t:["WP"], note:'e.g. "Raise & reinforce the existing bridge"', s:"new"},
    {fn:"indicators", ty:"object", t:["WP","DEFERRED"], note:"its impact on each dimension (ecology, equity, …)", s:"new"},
    {fn:"origin", ty:"enum", t:["DG"], note:"submission | auto_generated | deliberation — where it came from", s:"new"},
    {fn:"parent_scenario_id", ty:"string|null", t:["DG"], note:"reserved — set if this is a revised version of another", s:"new"},
    {fn:"revision_count", ty:"integer", t:["DG"], note:"0 now — increases if the option is refined later", s:"new"},
   ]},
 jsonPeek:`Scenario P1: {"scenario_id":"stillwater:P1","origin":"submission","revision_count":0, ...}
Scenario P3: {"origin":"auto_generated", ...}        // the auto-generation step made this one

ConstraintReport for P2: {
  "passed": false,
  "violations": [{"constraint":"ecological_budget","value":-0.6,"threshold":-0.5}]
}
ConstraintReport for P3: {"passed": false, "violations":[{"constraint":"accessibility_floor", ...}]}`,
 handoff:`A set of viable options (and clearly-flagged non-viable ones), ready for the community to weigh.`,
 prov:`${REF.wpcds} (M4: constraint checking). This auto-generation step — which the white paper calls the "bridge step" (it bridges Modules 3 and 4; no relation to our footbridge) — was in the pseudocode but missing from the prose, which the author calls "an oversight of the paper" (${REF.ep(2545,"Ep.59 ~42:25")}), now made explicit. <code>origin</code>/<code>parent_scenario_id</code>/<code>revision_count</code> are devguide additions (see ${LSPEC("specs/01-cds.md")}).`,
 check:{q:"Where did option P3 come from, if no member proposed it?", a:"The M3→M4 auto-generation step produced it as a logical option to evaluate. Its origin field records that as auto_generated — so the trail of where every option came from is preserved."}},

// ----------------------------------------------------------------- M5
{kind:"module", mod:5, nav:"M5 · Deliberation", group:"The pipeline", badge:"M5", title:"Participatory Deliberation Workspace",
 job:"The community weighs every option — preferences and principled objections.",
 story:`Now the humans engage. Each of the five reviews every option, expresses how strongly they support or oppose it, and raises specific objections where their core values are harmed. Beatrice objects to demolishing the historic bridge — a value-based objection.`,
 community:`This is the heart of it: people deliberate using a <b>preference gradient</b> (strong support → block) and an <b>objection map</b>.`,
 dataIntro:`M5 produces a <b>Vote</b> per person per option (here, 5×4 = 20) and an <b>Objection</b> for each principled concern. Each objection carries a <b>severity</b> and a <b>scope</b>. Status → <code>deliberation</code>.`,
 object:{type:"Objection", tier:"proposed", contract:"(proposed shape — not yet a JSON-Schema contract)",
   fields:[
    {fn:"participant_id", ty:"string", t:["WP"], note:"node-id:person-id — who objects", s:"new"},
    {fn:"scenario_id", ty:"string", t:["WP"], note:"which option", s:"new"},
    {fn:"severity", ty:"number", t:["WP"], note:"0–1: how serious the harm", s:"new"},
    {fn:"scope", ty:"number", t:["WP"], note:"0–1: how broadly it applies", s:"new"},
    {fn:"description", ty:"string", t:["WP"], note:"the reasoning, in the person's own voice", s:"new"},
   ]},
 jsonPeek:`Vote (Maya on P1): {"support":"strong_support","comment":"Raising it in place is the durable fix..."}

Objection (Beatrice on P2): {
  "participant_id": "stillwater:beatrice",
  "severity": 0.94, "scope": 0.6,          // → "objection index" = 0.94 × 0.6 = 0.56
  "description": "Demolishing the original bridge removes a communal landmark..."
}`,
 handoff:`A complete picture of support and objection for every option — the raw material for the math in M6.`,
 prov:`${REF.wpcds} (M5: objection mapping, preference gradients). The five-level support gradient is white-paper canonical; objection severity×scope follows formal risk-assessment (FMEA). See ${LSPEC("specs/01-cds.md")}.`,
 check:{q:"What two numbers does every objection carry, and why?", a:"Severity (how serious) and scope (how widespread). Multiplied together they give the 'objection index' — so a serious, wide concern can block a popular option, but a minor, narrow one won't."}},

// ----------------------------------------------------------------- M6
{kind:"module", mod:6, nav:"M6 · Consensus", group:"The pipeline", badge:"M6", title:"Weighted Consensus + Orchestrator",
 job:"Do the math for each option; pick a winner — or send back / escalate.",
 story:`The system converts the gradient votes into a consensus score and takes the strongest objection as the objection index, for each option. Then it compares them to the node's thresholds.`,
 community:`No raw majority vote. A <b>blocking objection</b> can stop a popular option (that's the safeguard against the majority steamrolling a serious concern).`,
 dataIntro:`M6 produces a <b>ConsensusResult</b> per option. The gradient is asymmetric — a block (−1.0) drags harder than strong support (+1.0) lifts. P1 wins; P2 & P3 are sent back. Status → <code>consensus_check</code>.`,
 object:{type:"ConsensusResult", tier:"proposed", contract:"(proposed shape — not yet a JSON-Schema contract)",
   fields:[
    {fn:"scenario_id", ty:"string", t:["WP"], note:"which option", s:"new"},
    {fn:"consensus_score", ty:"number", t:["WP"], note:"weighted average of preferences (−1…+1)", s:"new"},
    {fn:"objection_index", ty:"number", t:["WP"], note:"max(severity × scope) across its objections", s:"new"},
    {fn:"directive", ty:"enum", t:["WP"], note:"approve | revise | escalate_to_module9", s:"new"},
    {fn:"escalation_reason", ty:"string|null", t:["DG"], note:"set only if escalated (value conflict / revision failure)", s:"new"},
   ]},
 jsonPeek:`Thresholds (set by node governance): consensus ≥ 0.72, block < 0.30
support gradient: strong_support=1.0, support=0.6, neutral=0.0, concern=-0.4, block=-1.0

P1: consensus +0.92, objection 0.00 → approve   ✅  (orchestrator selects it)
P2: consensus -0.36, objection 0.56 → revise     (blocked by Beatrice's objection)
P3: consensus -0.32, objection 0.42 → revise
P4: consensus +0.48, objection 0.00 → revise     (not enough support)`,
 handoff:`One approved option (P1). The orchestrator hands it to M7 to be recorded.`,
 prov:`${REF.wpcds} (M6: weighted consensus). The exact gradient values & thresholds (0.72 / 0.30) are on-screen in ${REF.ep(3660,"Ep.59 (~1:01:00)")} and are <i>node-governance policy</i>, not hardcoded. If no option is approvable, M6 can send the set back to M5 (a bounded revision loop) or escalate to Module 9.`,
 check:{q:"A wildly popular option has one serious, well-grounded objection. What happens?", a:"It can be blocked. The objection index (severity×scope) crossing the threshold halts it regardless of support — the system's protection for principled minority concerns."}},

// ----------------------------------------------------------------- M7
{kind:"module", mod:7, nav:"M7 · Record", group:"The pipeline", badge:"M7", title:"Decision Recording, Versioning & Accountability",
 job:"Write the decision into a permanent, tamper-evident ledger.",
 story:`The approved option becomes an official, append-only record of what was decided and exactly how the community got there — so it can be reviewed honestly later.`,
 community:`Nothing in Integral is decided without a traceable record. This is non-negotiable from day one.`,
 dataIntro:`M7 creates the <b>DecisionRecord</b> — a fully-ratified, schema-validated object with real hashes. And the Issue's <code>status</code> updates to <code>decided</code> — the <i>same Issue object</i> we created in M1, now mutated by its journey.`,
 object:{type:"DecisionRecord", tier:"ratified", contract:"schemas/cds/decision-record.json",
   fields:[
    {fn:"decision_id", ty:"string", t:["WP"], note:"the permanent decision id", s:"new"},
    {fn:"scenario_id", ty:"string", t:["WP"], note:"the winning option (P1)", s:"new"},
    {fn:"consensus_results", ty:"array", t:["DG"], note:"every option's result — winners AND losers kept for transparency", s:"new"},
    {fn:"rationale_hash", ty:"string", t:["WP"], note:"hash of the reasoning (tamper-evidence)", s:"new"},
    {fn:"prev_hash", ty:"string", t:["DG","DEFERRED"], note:'"GENESIS" here — chains records into a ledger', s:"new"},
    {fn:"review_triggers", ty:"array", t:["WP","DEFERRED"], note:"conditions that could reopen this later (M10)", s:"new"},
   ]},
 jsonPeek:`{
  "decision_id": "stillwater:DR-001",
  "scenario_id": "stillwater:P1",
  "status": "approved",
  "consensus_score": 0.92,
  "considered_scenario_ids": ["stillwater:P1","P2","P3","P4"],   // losers kept too
  "rationale_hash": "sha256:dfcd46f168463...",
  "prev_hash": "GENESIS"
}
// ↻ Issue.status: "consensus_check" → "decided"  (same object, mutated across the pipeline)`,
 handoff:`A signed, recorded decision — ready to be dispatched into action.`,
 prov:`${REF.wpcds} (M7: recording, versioning, accountability) — "no decision exists without a traceable record." Schema: ${LSPEC("schemas/cds/decision-record.json")} (validated live). The append-only ledger + hashing is in ${LSPEC("specs/01-cds.md")}.`,
 check:{q:"The Issue object you saw in M1 — is the M7 Issue a different object?", a:"No — it's the same Issue, mutated as it travelled. Its status field advanced intake → … → decided. Watching one field change across steps is the clearest picture of 'data updated across the pipeline'."}},

// ----------------------------------------------------------------- M8
{kind:"module", mod:8, nav:"M8 · Dispatch", group:"The pipeline", badge:"M8", title:"Implementation Dispatch Interface",
 job:"Send the decision out to act on — and set up the feedback that closes the loop.",
 story:`The decision is packaged and sent to the systems that will carry it out: OAD designs the raised bridge, COS organises the build, and FRS is told what to watch (flood closures, farm access) to see if it actually worked.`,
 community:`This is where governance becomes action — and where the system arranges to learn from the outcome.`,
 dataIntro:`M8 produces the <b>DispatchPacket</b> — the contract between the CDS and every other system. Status → <code>dispatched</code>. The monitors it sets will eventually feed results back to the CDS, closing the cybernetic loop.`,
 object:{type:"DispatchPacket", tier:"ratified", contract:"schemas/cds/dispatch-packet.json",
   fields:[
    {fn:"decision_id", ty:"string", t:["WP"], note:"the decision being implemented", s:"new"},
    {fn:"target_systems", ty:"array", t:["DG"], note:"OAD, COS, FRS — who must act", s:"new"},
    {fn:"oad_flags", ty:"object", t:["WP"], note:"design instructions for OAD", s:"new"},
    {fn:"tasks", ty:"array", t:["WP"], note:"production directives for COS", s:"new"},
    {fn:"frs_monitors", ty:"array", t:["WP"], note:"what FRS should watch → closes the loop", s:"new"},
   ]},
 jsonPeek:`{
  "packet_id": "stillwater:DSP-001",
  "decision_id": "stillwater:DR-001",
  "target_systems": ["OAD", "COS", "FRS"],
  "oad_flags": {"design_task": "Detailed design for: Raise & reinforce the existing bridge"},
  "frs_monitors": ["flood-closure-rate", "farm-access-continuity"]
}`,
 handoff:`Action begins. FRS will watch the monitors and, if something drifts, raise a new signal back into M1 — and the whole cycle starts again.`,
 prov:`${REF.wpcds} (M8: dispatch). The packet is "the primary contract between CDS and every other system" (${REF.dg31}, ${REF.dg44}). Schema: ${LSPEC("schemas/cds/dispatch-packet.json")}. <b>Note:</b> the simulator caught a real bug here — the packet couldn't originally target FRS — which drove a fix to the schema (a <code>SystemId</code> enum). Simulating the data flow finds gaps before they're built on.`,
 check:null},

// ----------------------------------------------------------------- Recap
{kind:"concept", nav:"Recap & where to help", group:"Wrap-up", badge:"✓", title:"You've followed the data end to end",
 body:`
 <p class="lead">One concern became a recorded, accountable decision — and every step handed the next a well-shaped baton.</p>
 <div class="sec"><div class="lbl">What you saw</div>
 <p>An <b>Issue</b> was born at M1 and its <code>status</code> advanced through eight stages to <code>decided</code> then <code>dispatched</code>. Along the way the pipeline created Submissions, a StructuredIssueView, a ContextModel, Scenarios + ConstraintReports, Votes + Objections, ConsensusResults, a DecisionRecord, and a DispatchPacket — <b>11 object types</b> in all.</p></div>
 <div class="callout teal"><b>The schema coverage map (where you can help).</b> Only <b>4</b> of those object types currently have a machine-checkable JSON-Schema contract that the simulator validates against — <code>Issue</code>, <code>Submission</code>, <code>DecisionRecord</code>, <code>DispatchPacket</code> (green). The other <b>7</b> are <b>proposed shapes</b> written in the spec prose but not yet schematized (amber). Formalising those is one of the clearest, most useful contributions available right now. (To be clear: even the green ones are <i>candidate</i> — having a schema isn't the same as the community having ratified it.)</div>
 <div class="sec"><div class="lbl">Go deeper</div>
 <p>• Run the live simulator and watch a real deliberation: <code>simulator/</code> (try <code>python run.py --open</code>).<br>
 • Read the schemas & open questions: <code>integral-schema-exercise/specs/</code> and <code>schemas/</code>.<br>
 • The five scenarios each show a different outcome — approval, value-conflict escalation, gridlock, tie-break, and a converging revision loop.<br>
 • Provenance throughout traces to the ${REF.wpcds}, the ${REF.dg51} (and §3–5), and the author's ${REF.ep(0,"Ep.59")} walkthrough.</p></div>
 <div class="callout"><b>Thank you for onboarding.</b> Understanding the data structure is the foundation for improving it — and improving it together is the whole point.</div>
 `},
];

// META — per-system labels the engine uses for the title, header, and data panel.
const META = {
  key: "cds",
  emoji: "🐴",
  title: "CDS · Start Here",
  sub: "The data structures behind Integral's Collaborative Decision System — one step at a time",
  panelHint: "Watch the records accumulate — and the Issue's <code>status</code> field advance — as you move through the pipeline.",
  statusObjectName: "Issue",            // the object whose status field advances
  statusEnumName: "IssueStatus",
  statusObjectId: "stillwater:ISS-001",
};
