const GH_DG="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md";
const GH_WP="https://github.com/Integral-Collective/integral-whitepaper/blob/main/whitepaper";
const YT="https://youtu.be/NPaBrjjVCtE";
const REF={
  dg35:lnk(GH_DG+"#35-frs--feedback-and-review-system-proposed-core-modules","Developer Guide §3.5"),
  dg43:lnk(GH_DG+"#43-frs-records","Developer Guide §4.3"),
  dg44:lnk(GH_DG+"#44-api-boundaries-and-inter-system-interfaces","§4.4"),
  dg51:lnk(GH_DG+"#51-phase-1--governance-and-system-definition","Developer Guide §5.1"),
  wpfrs:lnk(GH_WP+"/07-modules/07-5-frs/frs-01-overview.md","White Paper §7.5 (FRS)"),
  wpcds:lnk(GH_WP+"/07-modules/07-1-cds/cds-01-overview.md","White Paper §7.1 (CDS)"),
  ep:(t,label)=>lnk(YT+(t?"?t="+t:""), label||"Ep.59"),
};

// ----- Signal lifecycle (the field that visibly advances as it flows through FRS) -----
// One status per module (M1..M7). The track lights one step per pipeline stage and
// terminates at "submitted" — the packet handed back into CDS, where the loop closes.
const STATUS = ["ingested","classified","modeled","routed","sensemade","remembered","submitted"];

// ----- object timeline: which records exist by which module step (module index 1..7) -----
const OBJECTS = [
  {type:"SignalEnvelope",   count:6, tier:"proposed", at:1},
  {type:"FRSSignalPacket",  count:1, tier:"ratified", at:1},
  {type:"DiagnosticFinding",count:1, tier:"ratified", at:2},
  {type:"ConstraintModel",  count:1, tier:"proposed", at:3},
  {type:"Recommendation",   count:2, tier:"ratified", at:4},
  {type:"SensemakingArtifact",count:1,tier:"proposed", at:5},
  {type:"MemoryRecord",     count:1, tier:"proposed", at:6},
  {type:"FederatedInsight", count:1, tier:"proposed", at:7},
];

// ===================================================================== STEPS
// kind: "concept" (foundations/recap) or "module" (full scaffold). mod = module number 1..7.
const STEPS = [
{kind:"concept", nav:"Welcome", group:"Orientation", badge:"00", title:"What you're about to learn",
 body:`
 <p class="lead">Integral coordinates a community's production and decisions <b>without money and without bosses</b>. But how does the system <b>notice when something is going wrong</b> — before it becomes a crisis? That's the job of the <b>FRS</b> — the Feedback &amp; Review System.</p>
 <p>FRS is Integral's <b>adaptive nervous system</b>. It watches every other system, detects drift early, models where it leads — and then <b>flags</b> what it found. Crucially, it <b>never acts</b>: it can raise a concern, but only the community (through the CDS) decides what to do about it. This walkthrough teaches the data shapes — the <b>schemas</b> — that carry a signal through FRS, by following one real example end to end.</p>
 <div class="callout"><b>You don't need to be a programmer.</b> We start in plain language. The technical detail is always optional (look for the "see the actual schema" toggles). By the end you'll understand the data structure behind FRS — enough to review it and suggest improvements.</div>
 <div class="callout warn"><b>⚠️ Status: a proposed candidate — not ratified.</b> Everything here — the schemas, the example records — is <b>Phase-1 candidate work</b> (${REF.dg51}), offered to the contributor community to <b>review, challenge, and ratify</b>. Nothing here is adopted. Treat it as a starting point for deliberation, not a settled blueprint.
 <div class="prov" style="margin-top:10px"><b>Already familiar with the system?</b> Skip ahead to the candidate specs &amp; contracts (local repo):
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/05-frs.md">FRS schema spec</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/00-canonical-enums.md">canonical enums</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/06-cross-contract-matrix.md">cross-contract matrix</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/07-open-questions.md">open questions (ratification register)</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/frs/">FRS JSON schemas</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/README.md">schema exercise overview</a><br>
 Source material (GitHub): ${lnk(GH_DG,"Developer Guide")} ·
 ${lnk("https://github.com/Integral-Collective/integral-whitepaper/tree/main/whitepaper","Technical White Paper")} ·
 ${REF.ep(0,"Revolution Now! Ep.59")}.</div></div>
 <div class="sec"><div class="lbl">How to use this</div>
 <p>Move with <b>Next / Back</b> (or the ← → arrow keys), or jump around using the menu on the left. The panel on the right — <b>"The data so far"</b> — fills up as you go, so you can watch the records being created and the signal's status advance.</p></div>
 `},

{kind:"concept", nav:"FRS's job", group:"Foundations", badge:"01", title:"The system's nervous system — it flags, it never acts",
 body:`
 <p class="lead">If the <b>CDS</b> is the community's decision-making mind, the <b>FRS</b> is its <b>nervous system</b>: always watching, sensing strain, raising an alarm — but never grabbing the controls itself.</p>
 <div class="sec"><div class="lbl">What FRS does</div>
 <p>FRS continuously reads structured signals from the other four systems — <b>COS</b> (production), <b>OAD</b> (design), <b>ITC</b> (contribution &amp; access), and <b>CDS</b> (governance) — plus ecological monitoring. It looks for <b>drift</b>: slow, compounding trends that no single reading would flag, but which together point toward future trouble. It then <b>classifies</b> the problem, <b>models</b> where it leads, and <b>routes a recommendation</b> to whoever can act on it.</p></div>
 <div class="callout warn"><b>The one rule that defines FRS: it is advisory only.</b> FRS <i>flags</i>; it never <i>acts</i>. It can raise a <b>Recommendation</b>, but it can only ever mark it <code>pending</code>. A recommendation becomes real action only when the receiving system — or the community via CDS — chooses to <code>accept</code> it through <i>their own</i> process. This is the system's safeguard against <b>shadow governance</b>: no analytical layer can quietly start running the economy. The boundary is written into the schema, not just the policy.</div>
 <div class="sec"><div class="lbl">FRS closes the loop</div>
 <p>FRS reads COS/ITC/OAD/CDS, finds a problem, and <b>submits its finding back into the CDS</b> as a new issue to deliberate. That's the <b>cybernetic loop</b>: the system perceives its own state and feeds it back into its own decision-making. The signal FRS raises here is exactly the kind of issue the CDS then takes up.</p></div>
 `},

{kind:"concept", nav:"The pipeline", group:"Foundations", badge:"02", title:"The FRS pipeline at a glance — 7 modules",
 body:`
 <p class="lead">A signal is a <b>sequence of transformations</b>: something is sensed → diagnosed → modeled → turned into advice → made legible to people → remembered → shared across nodes. Each step is a "module":</p>
 <div class="obj"><div class="field"><span class="fn">M1 · Signal Intake</span><span class="fnote">gather structured signals from COS/OAD/ITC/CDS/ecology; normalize &amp; timestamp</span></div>
 <div class="field"><span class="fn">M2 · Diagnosis</span><span class="fnote">classify the problem: type, severity, scope, persistence</span></div>
 <div class="field"><span class="fn">M3 · Modeling</span><span class="fnote">model constraints &amp; simulate futures (deferred — scaffolded only)</span></div>
 <div class="field"><span class="fn">M4 · Recommendation</span><span class="fnote">turn the diagnosis into typed, bounded advice — and route it</span></div>
 <div class="field"><span class="fn">M5 · Sensemaking</span><span class="fnote">translate the intelligence into something people can deliberate on</span></div>
 <div class="field"><span class="fn">M6 · Memory</span><span class="fnote">remember crises, interventions &amp; outcomes for the long run</span></div>
 <div class="field"><span class="fn">M7 · Federation</span><span class="fnote">share stress signatures &amp; lessons across nodes, without centralizing</span></div></div>
 <div class="callout"><b>What you'll watch.</b> The whole chain produces a single <b>FRSSignalPacket</b> bundled to the CDS, carrying a <b>DiagnosticFinding</b> and a <b>Recommendation</b>. The packet's <code>status</code> field advances at every module — that's the field you'll see climb in the data panel.</div>
 <p class="prov">We'll visit each module. The left menu mirrors these seven steps.</p>
 `},

{kind:"concept", nav:"The cast & scenario", group:"Foundations", badge:"03", title:"Stillwater, and the footbridge that keeps flooding",
 body:`
 <p class="lead">We'll follow one real signal the whole way, inside a single community — a node named <b>Stillwater</b>. (That's why every id in the data looks like <code>stillwater:…</code> — it's the node id.) The scenario:</p>
 <div class="callout"><b>In Stillwater, the footbridge to the vertical farm floods during storms.</b> It's the only path to the farm, a 60-year-old timber bridge over a salmon-bearing creek (Mill Creek), and the node has limited labor-hours. Nobody has filed a complaint. But the <b>operational data</b> is drifting: flood closures are climbing, farm produce is increasingly stranded, repair hours are creeping up.</div>
 <div class="sec"><div class="lbl">How FRS fits the bigger picture</div>
 <p>This is the same footbridge the <b>CDS</b> explainer deliberates. But <b>where did that issue come from?</b> Nobody woke up and decided to debate the bridge. <b>FRS noticed it first</b> — by reading the rising flood-closure rate out of COS operational data, classifying it as a real problem, modeling the risk, and raising a <b>Recommendation + SignalPacket back into the CDS</b>. FRS is what <i>surfaced</i> the footbridge issue that CDS then decides. That's the loop closing across all five explainers.</p></div>
 <div class="sec"><div class="lbl">The data sources FRS reads (no human authored these)</div>
 <div class="obj">
 <div class="field"><span class="fn">COS</span><span class="fnote">flood closures, stranded-delivery events, bridge repair labor-hours</span></div>
 <div class="field"><span class="fn">ITC</span><span class="fnote">rising access-demand for the farm crossing; labor strain on the repair crew</span></div>
 <div class="field"><span class="fn">OAD</span><span class="fnote">the bridge's design version &amp; its ecological assessment</span></div>
 <div class="field"><span class="fn">Ecological</span><span class="fnote">Mill Creek flow &amp; storm-frequency monitoring</span></div></div></div>
 <p>FRS doesn't <i>create</i> these readings — the other systems do. FRS's job is to <b>fuse them, notice the drift, and raise the alarm</b>. Let's watch it happen. →</p>
 `},

// ----------------------------------------------------------------- M1
{kind:"module", mod:1, nav:"M1 · Signal Intake", group:"The pipeline", badge:"M1", title:"Signal Intake & Semantic Integration",
 job:"Gather structured signals from across the system — normalize, timestamp, contextualize. No judgement yet.",
 story:`Over a single review window, the systems around Stillwater quietly emit readings: COS logs three flood closures and several stranded deliveries; ITC shows farm-access demand rising and repair-crew hours climbing; ecological monitoring reports higher storm frequency on Mill Creek. None of these, alone, is alarming.`,
 community:`Nobody filed a complaint here — these are <b>machine-to-machine</b> signals. FRS Module 1 wraps each atomic reading in a <b>SignalEnvelope</b> (carrying its source, domain, and the upstream record it came from), then bundles them into one time-windowed <b>FRSSignalPacket</b> with human-readable summaries so the CDS can later read it without querying raw envelopes. Module 1 does <i>not</i> interpret — it just builds a coherent perception of "the state of things."`,
 objects:[
   {type:"SignalEnvelope", tier:"proposed", contract:"(proposed shape — restored from White Paper; not yet a JSON-Schema contract)",
    fields:[
     {fn:"envelope_id", ty:"string", t:["WP"], note:"unique id for this one atomic signal", s:"new"},
     {fn:"source", ty:"enum", t:["WP"], note:"COS | OAD | ITC | CDS | ECO | FED — who emitted it", s:"new"},
     {fn:"domain", ty:"enum", t:["WP"], note:"ecology | throughput | labor | … (12 SignalDomain values)", s:"new"},
     {fn:"governance_scope", ty:"enum", t:["DG"], note:"coop | node | network — which level this pertains to", s:"new"},
     {fn:"metrics", ty:"array", t:["WP"], note:"the numbers: {name, value, unit, quality}", s:"new"},
     {fn:"upstream_ref_ids", ty:"object", t:["WP"], note:"links back to the COS/ITC record it came from (traceability)", s:"new"},
     {fn:"entry_hash", ty:"string|null", t:["WP","DEFERRED"], note:"reserved — tamper-evident chain", s:"new"},
    ],
    json:`SignalEnvelope (one of 6): {
  "envelope_id": "stillwater:ENV-014",
  "source": "COS",
  "domain": "throughput",
  "governance_scope": "node",
  "metrics": [{"name": "flood_closures", "value": 3, "unit": "events", "quality": "verified"}],
  "upstream_ref_ids": {"cos_plan_id": "stillwater:COS-PLN-221"},
  "entry_hash": null
}`},
   {type:"FRSSignalPacket", tier:"ratified", contract:"schemas/frs/frs-signal-packet.json",
    fields:[
     {fn:"packet_id", ty:"string", t:["DG"], note:"unique id for this review-window bundle", s:"new"},
     {fn:"node_id", ty:"string", t:["FED"], note:"which node — here, Stillwater; federation-aware from day one", s:"new"},
     {fn:"period_start", ty:"date-time", t:["DG"], note:"start of the window this packet summarizes", s:"new"},
     {fn:"period_end", ty:"date-time", t:["DG"], note:"end of the window", s:"new"},
     {fn:"generated_by", ty:"string", t:["DG"], note:"the FRS agent that built this packet", s:"new"},
     {fn:"status", ty:"enum", t:["DG"], note:'starts at "ingested" — THIS is the field that advances every module →', s:"new"},
     {fn:"envelopes", ty:"array", t:["WP"], note:"the raw SignalEnvelope bundle (restored from WP)", s:"new"},
     {fn:"labor_summary", ty:"object", t:["DG"], note:"human-readable COS labor rollup for CDS", s:"new"},
     {fn:"materials_summary", ty:"object", t:["DG"], note:"COS materials rollup", s:"new"},
     {fn:"cds_summary", ty:"object", t:["DG"], note:"governance rollup from CDS — closes the GOVERNANCE loop, telling FRS whether past responses worked", s:"new"},
     {fn:"findings", ty:"array", t:["WP"], note:"DiagnosticFinding list — empty now, filled at M2", s:"new"},
     {fn:"recommendations", ty:"array", t:["WP"], note:"Recommendation list — empty now, filled at M4", s:"new"},
     {fn:"cds_submission_ref", ty:"string|null", t:["DG"], note:"ref to the CDS Issue this becomes — null until the loop closes", s:"new"},
    ],
    json:`{
  "packet_id": "stillwater:FRS-PKT-007",
  "node_id": "stillwater",
  "period_start": "2026-05-01T00:00:00Z",
  "period_end": "2026-05-30T00:00:00Z",
  "generated_by": "frs-node-agent",
  "status": "ingested",
  "envelopes": ["stillwater:ENV-014", "... ×6"],
  "labor_summary": {"total_events": 6, "overrun_tasks": ["bridge-repair"]},
  "cds_summary": {"open_governance_issues": 0},   // ← will report back next window
  "findings": [],
  "recommendations": [],
  "cds_submission_ref": null
}`},
 ],
 handoff:`A coherent, time-stamped bundle of signals — the common perceptual substrate Module 2 will diagnose.`,
 prov:`${REF.wpfrs} (Module 1: signal intake &amp; semantic integration) — "integrates already-structured signals; does not judge." ${REF.dg43} defines the packet's summary blocks as a Phase-2 extension over the white paper's abstract bundle. Schema: ${LSPEC("specs/05-frs.md")} → ${LSPEC("schemas/frs/frs-signal-packet.json")}.`,
 check:{q:"Did a person report the flooding problem to FRS?", a:"No. FRS reads machine-to-machine signals — COS closure logs, ITC demand, ecological monitoring. No human filed anything. FRS's value is noticing drift in data that no single person was watching."}},

// ----------------------------------------------------------------- M2
{kind:"module", mod:2, nav:"M2 · Diagnosis", group:"The pipeline", badge:"M2", title:"Diagnostic Classification & Pathology Detection",
 job:"Answer one question: what kind of problem is this, and how serious is it?",
 story:`Module 2 reads the packet and sees the readings cohere: flood closures up, deliveries stranded, repair hours climbing, storm frequency rising. Individually, noise. Together, a pattern — a slow drift toward the farm being routinely cut off.`,
 community:`This is where FRS first <b>interprets</b>. It produces a <b>DiagnosticFinding</b> tagged with four canonical dimensions: <b>finding_type</b> (what kind), <b>severity</b> (how bad), <b>scope</b> (how far it reaches — the "blast radius"), and <b>persistence</b> (a blip, or a structural trend?). Here the type is <code>throughput_bottleneck_persistent</code>: the crossing's capacity keeps failing. Note the finding is the system distinguishing a <i>structural problem</i> from a temporary fluctuation.`,
 objects:[
   {type:"DiagnosticFinding", tier:"ratified", contract:"schemas/frs/diagnostic-finding.json",
    fields:[
     {fn:"finding_id", ty:"string", t:["WP"], note:"unique id for this finding", s:"new"},
     {fn:"packet_ref", ty:"string", t:["WP"], note:"the FRSSignalPacket it was found in", s:"carried"},
     {fn:"finding_type", ty:"enum", t:["WP"], note:"throughput_bottleneck_persistent (11 canonical FindingType values)", s:"new"},
     {fn:"severity", ty:"enum", t:["WP"], note:"info | low | moderate | high | critical — here: high", s:"new"},
     {fn:"scope", ty:"enum", t:["WP"], note:"local | node | regional | federation — the blast radius; drives routing", s:"new"},
     {fn:"persistence", ty:"enum", t:["WP"], note:"transient | emerging | persistent | structural — here: persistent", s:"new"},
     {fn:"confidence", ty:"enum", t:["WP"], note:"low | medium | high — how sure FRS is", s:"new"},
     {fn:"summary", ty:"string", t:["WP"], note:"one-sentence plain-language statement of the problem", s:"new"},
     {fn:"indicators", ty:"object", t:["WP"], note:"the metrics that triggered it (numbers, for audit)", s:"new"},
     {fn:"target_system", ty:"enum", t:["WP"], note:"CDS | OAD | COS | ITC | FED — who should hear about it", s:"new"},
     {fn:"requires_cds", ty:"bool", t:["WP"], note:"does this need community deliberation? here: true", s:"new"},
    ],
    json:`{
  "finding_id": "stillwater:FND-031",
  "packet_ref": "stillwater:FRS-PKT-007",
  "finding_type": "throughput_bottleneck_persistent",
  "severity": "high",
  "scope": "node",
  "persistence": "persistent",
  "confidence": "high",
  "summary": "The farm footbridge is closing repeatedly in storms, stranding produce and the crew.",
  "indicators": {"flood_closures": 3.0, "stranded_deliveries": 5.0, "repair_hours_overrun": 0.34},
  "target_system": "CDS",
  "requires_cds": true
}`},
 ],
 handoff:`A classified, evidence-backed finding. Because severity is <code>high</code> and <code>requires_cds</code> is true, it will be routed to the community to decide.`,
 prov:`${REF.wpfrs} (Module 2: diagnostic classification) — "distinguishing symptoms from structural problems," tagged by type/severity/scope/persistence. All four enums are <b>white-paper canonical</b> (see ${LSPEC("specs/00-canonical-enums.md")}). Schema: ${LSPEC("schemas/frs/diagnostic-finding.json")} (validated live).`,
 check:{q:"What's the difference between scope and severity?", a:"Severity is how bad the problem is (high). Scope is how far it reaches — its blast radius (node-wide). Scope is what decides where the finding gets routed and escalated: a node-scope finding goes to the node's CDS, a federation-scope one goes up to the network."}},

// ----------------------------------------------------------------- M3
{kind:"module", mod:3, nav:"M3 · Modeling", group:"The pipeline", badge:"M3", title:"Constraint Modeling & System Dynamics Simulation",
 job:"Ask: if nothing changes, where does this lead? Map the boundaries of viability — not a prediction.",
 story:`Module 3 builds a constraint model around the finding and runs counterfactual scenarios: status quo, do-nothing-through-storm-season, and a hypothetical raised bridge. It finds that under current trends the farm is cut off an unacceptable share of the season within months, with labor strain compounding.`,
 community:`This module is <b>deferred in the minimal build</b> — the schema exists, but it isn't populated yet. We show its shape so you can see why the <b>Recommendation</b> already has a <code>constraint_model_ref</code> field (pointing here) from day one: when modeling ships, the field fills in with <b>no schema migration</b>. That forward-compatibility is the §5.1 "agree the shape first" discipline in miniature.`,
 objects:[
   {type:"ConstraintModel", tier:"proposed", contract:"(proposed shape — DEFERRED; scaffolded, unpopulated in minimal build)",
    fields:[
     {fn:"model_id", ty:"string", t:["WP","DEFERRED"], note:"id for this model", s:"new"},
     {fn:"constraints", ty:"array", t:["WP","DEFERRED"], note:"binding limits {name, threshold, current_value, margin}", s:"new"},
     {fn:"assumptions", ty:"array", t:["WP","DEFERRED"], note:"what the scenarios assume", s:"new"},
     {fn:"scenario_results", ty:"array", t:["WP","DEFERRED"], note:"projected futures {horizon, risk_score, breaches}", s:"new"},
     {fn:"related_findings", ty:"array", t:["WP","DEFERRED"], note:"the finding(s) this model informs", s:"new"},
    ],
    json:`// DEFERRED — shape only, not populated in the minimal build
{
  "model_id": "stillwater:CM-009",
  "constraints": [{"name": "farm_access_uptime", "threshold": 0.9,
                   "current_value": 0.78, "margin": -0.12}],
  "scenario_results": [
    {"scenario_id": "status_quo", "horizon": "mid", "risk_score": 0.71,
     "constraint_breaches": ["farm_access_uptime"]},
    {"scenario_id": "raise_bridge", "horizon": "mid", "risk_score": 0.18}
  ],
  "related_findings": ["stillwater:FND-031"]
}`},
 ],
 handoff:`A viability envelope around the finding — the evidence base a recommendation can lean on. (When this ships; deferred for now.)`,
 prov:`${REF.wpfrs} (Module 3: constraint modeling &amp; system dynamics) — "maps the boundaries of viability, not a prediction." Listed deferred in ${LSPEC("specs/05-frs.md")}; <code>Recommendation.constraint_model_ref</code> targets it and is nullable until it ships (${REF.dg43}).`,
 check:{q:"Why does Recommendation already have a field pointing at a model that doesn't exist yet?", a:"Because the shape is agreed before the feature is built. The field is nullable now and simply fills in when Module 3 ships — no record ever has to be re-formatted. Getting the shape right early is the cheapest insurance the project has."}},

// ----------------------------------------------------------------- M4
{kind:"module", mod:4, nav:"M4 · Recommendation", group:"The pipeline", badge:"M4", title:"Recommendation & Signal Routing Engine",
 job:"Turn the diagnosis into typed, bounded advice — and route it. Generate signals, never commands.",
 story:`Module 4 produces two recommendations from the finding. The main one goes to <b>CDS</b>: "the farm crossing keeps failing — open this for deliberation." A secondary one goes to <b>OAD</b>: "the bridge design may no longer suit current storm conditions; consider a review."`,
 community:`This is the module that <b>defines FRS's whole character</b>. Each <b>Recommendation</b> is <i>advisory</i>. Watch the <code>status</code> field: FRS can set it to <code>pending</code> — and <b>nothing else</b>. It cannot set <code>accepted</code>. Only the receiving system (CDS, OAD…) can transition it to <code>accepted</code> through <i>their own</i> process, and link a <code>response_ref</code> to the action they chose. This is the anti-shadow-governance safeguard, enforced in the schema.`,
 objects:[
   {type:"Recommendation", tier:"ratified", contract:"schemas/frs/recommendation.json",
    fields:[
     {fn:"recommendation_id", ty:"string", t:["WP"], note:"unique id", s:"new"},
     {fn:"finding_ref", ty:"string", t:["WP"], note:"the DiagnosticFinding it comes from", s:"carried"},
     {fn:"constraint_model_ref", ty:"string|null", t:["WP","DEFERRED"], note:"points at the M3 model — null until modeling ships", s:"new"},
     {fn:"target_system", ty:"enum", t:["WP"], note:"CDS | OAD | COS | ITC | FED — who this is for", s:"new"},
     {fn:"recommendation_type", ty:"enum", t:["WP"], note:"policy_review_prompt | design_review_request | … (10 values)", s:"new"},
     {fn:"severity", ty:"enum", t:["WP"], note:"inherited from the finding", s:"carried"},
     {fn:"scope", ty:"enum", t:["WP"], note:"inherited from the finding", s:"carried"},
     {fn:"confidence", ty:"enum", t:["WP"], note:"inherited from the finding", s:"carried"},
     {fn:"summary", ty:"string", t:["WP"], note:"the suggested action, in plain language", s:"new"},
     {fn:"payload", ty:"object", t:["WP"], note:"structured detail for the target system to use", s:"new"},
     {fn:"status", ty:"enum", t:["WP"], note:"pending | acknowledged | accepted | rejected | superseded — FRS sets pending ONLY", s:"new"},
     {fn:"response_ref", ty:"string|null", t:["WP"], note:"null — the receiving system links its action here, not FRS", s:"new"},
    ],
    json:`Recommendation → CDS (the loop-closer):
{
  "recommendation_id": "stillwater:REC-052",
  "finding_ref": "stillwater:FND-031",
  "constraint_model_ref": null,
  "target_system": "CDS",
  "recommendation_type": "policy_review_prompt",
  "severity": "high", "scope": "node", "confidence": "high",
  "summary": "Open a deliberation: the footbridge crossing is failing repeatedly in storms.",
  "status": "pending",          // ← FRS can ONLY set this. It cannot write "accepted".
  "response_ref": null          // ← stays null until CDS acts through its own process
}

Recommendation → OAD: {"recommendation_type": "design_review_request",
  "summary": "Bridge design may no longer suit current storm load.", "status": "pending"}`},
 ],
 handoff:`Two pending recommendations, routed. The CDS-bound one is what will be submitted back into the community's decision pipeline.`,
 prov:`${REF.wpfrs} (Module 4: recommendation &amp; signal routing) — "produces actionable signals, not commands; authority remains fully distributed." The <code>status</code> boundary (FRS sets <code>pending</code> only) is enforced in ${LSPEC("schemas/frs/recommendation.json")}; see open question OQ-11 in ${LSPEC("specs/05-frs.md")}.`,
 check:{q:"FRS is sure the bridge needs fixing. Can it just mark the recommendation 'accepted' and trigger the work?", a:"No — never. FRS can only set status to 'pending'. Marking it 'accepted' and acting is reserved for the receiving system (here, the community via CDS), through their own process. FRS flags; it never acts. That boundary is the safeguard against an analytical layer quietly governing."}},

// ----------------------------------------------------------------- M5
{kind:"module", mod:5, nav:"M5 · Sensemaking", group:"The pipeline", badge:"M5", title:"Democratic Sensemaking & CDS Interface",
 job:"Translate the system intelligence into something the community can actually deliberate on.",
 story:`Before the community sees anything, Module 5 turns the finding, the model, and the recommendations into a plain-language brief: a flood-closure trendline, a "do nothing vs raise the bridge" comparison, and a discussion prompt — so people deliberate on shared evidence, not technical opacity.`,
 community:`FRS does not <i>simplify</i> reality — it <b>translates</b> it. The <b>SensemakingArtifact</b> is what makes governance informed rather than reactive: it hands the community what's happening, why it matters, the tradeoffs, and the uncertainties. (This record is <b>deferred</b> — shape only — in the minimal build.)`,
 objects:[
   {type:"SensemakingArtifact", tier:"proposed", contract:"(proposed shape — DEFERRED; not yet a JSON-Schema contract)",
    fields:[
     {fn:"artifact_id", ty:"string", t:["WP","DEFERRED"], note:"id for this artifact", s:"new"},
     {fn:"artifact_type", ty:"enum", t:["WP","DEFERRED"], note:"risk_brief | scenario_comparison | deliberation_prompt | dashboard_view …", s:"new"},
     {fn:"finding_refs", ty:"array", t:["WP","DEFERRED"], note:"the finding(s) it explains", s:"new"},
     {fn:"narrative", ty:"string", t:["WP","DEFERRED"], note:"the plain-language explanation for participants", s:"new"},
     {fn:"prompts", ty:"array", t:["WP","DEFERRED"], note:"deliberation questions for the community", s:"new"},
    ],
    json:`// DEFERRED — shape only
{
  "artifact_id": "stillwater:ART-018",
  "artifact_type": "deliberation_prompt",
  "finding_refs": ["stillwater:FND-031"],
  "narrative": "Storm closures of the farm crossing have tripled this season; the farm is cut off ~22% of the time and rising.",
  "prompts": ["Repair in place, redesign, or reroute access?", "What labor-hours can we commit this window?"]
}`},
 ],
 handoff:`A human-readable brief, ready to attach to the CDS submission so deliberation starts from shared reality.`,
 prov:`${REF.wpfrs} (Module 5: democratic sensemaking) — "translates complexity; informs deliberation rather than dictating outcomes." Deferred in ${LSPEC("specs/05-frs.md")}; <code>ArtifactType</code> enum in ${LSPEC("specs/00-canonical-enums.md")}.`,
 check:null},

// ----------------------------------------------------------------- M6
{kind:"module", mod:6, nav:"M6 · Memory", group:"The pipeline", badge:"M6", title:"Longitudinal Memory, Pattern Learning & Recall",
 job:"Remember crises, interventions, and outcomes — so the community learns across decades, not months.",
 story:`Module 6 files this episode into institutional memory and surfaces a parallel: a neighbouring node faced a similar storm-closure problem years ago and solved it with a raised composite span — with recorded outcomes on cost, labor, and ecology.`,
 community:`This is how Integral avoids repeating mistakes. A <b>MemoryRecord</b> preserves the baseline, the incident, the intervention chosen, and — later — its outcome, so future deliberations inherit hard-won context. (Deferred — shape only — in the minimal build.)`,
 objects:[
   {type:"MemoryRecord", tier:"proposed", contract:"(proposed shape — DEFERRED; not yet a JSON-Schema contract)",
    fields:[
     {fn:"memory_id", ty:"string", t:["WP","DEFERRED"], note:"id for this memory entry", s:"new"},
     {fn:"record_type", ty:"enum", t:["WP","DEFERRED"], note:"baseline | incident | intervention | outcome | lesson …", s:"new"},
     {fn:"finding_refs", ty:"array", t:["WP","DEFERRED"], note:"the episode this remembers", s:"new"},
     {fn:"summary", ty:"string", t:["WP","DEFERRED"], note:"what happened &amp; what was learned", s:"new"},
     {fn:"recorded_at", ty:"date-time", t:["WP","DEFERRED"], note:"when it entered memory", s:"new"},
    ],
    json:`// DEFERRED — shape only
{
  "memory_id": "stillwater:MEM-044",
  "record_type": "incident",
  "finding_refs": ["stillwater:FND-031"],
  "summary": "Persistent storm closures of the farm crossing. Parallel: Rivermouth node, 2019 — raised composite span halved closures; +180 labor-hours, no creek disturbance.",
  "recorded_at": "2026-05-30T00:00:00Z"
}`},
 ],
 handoff:`A durable record of this episode and its historical parallels — context for whatever the community decides.`,
 prov:`${REF.wpfrs} (Module 6: longitudinal memory) — "institutional memory preventing repeated mistakes." Deferred in ${LSPEC("specs/05-frs.md")}; <code>MemoryRecordType</code> enum in ${LSPEC("specs/00-canonical-enums.md")}.`,
 check:null},

// ----------------------------------------------------------------- M7
{kind:"module", mod:7, nav:"M7 · Federation", group:"The pipeline", badge:"M7", title:"Federated Intelligence & Inter-Node Learning",
 job:"Share stress signatures and lessons across nodes — without centralizing or mandating anything.",
 story:`Module 7 widens the lens. Stillwater's storm-closure stress signature is shared across the federation as an early-warning pattern, so another node — perhaps planning a creek crossing of its own — can adapt before hitting the same wall.`,
 community:`Knowledge circulates freely: no patents, no proprietary advantage, no forced uniformity. A <b>FederatedInsight</b> propagates the <i>pattern</i>, not commands. Each node keeps full autonomy over what it does with it. (Deferred — shape only — in the minimal build.)`,
 objects:[
   {type:"FederatedInsight", tier:"proposed", contract:"(proposed shape — DEFERRED, federation; not yet a JSON-Schema contract)",
    fields:[
     {fn:"insight_id", ty:"string", t:["WP","FED","DEFERRED"], note:"id for the shared insight", s:"new"},
     {fn:"message_type", ty:"enum", t:["WP","FED","DEFERRED"], note:"early_warning | best_practice | stress_signature …", s:"new"},
     {fn:"origin_node_id", ty:"string", t:["FED","DEFERRED"], note:"who is sharing — here, Stillwater", s:"new"},
     {fn:"pattern", ty:"object", t:["WP","FED","DEFERRED"], note:"the de-identified signature, not raw records", s:"new"},
     {fn:"finding_refs", ty:"array", t:["WP","FED","DEFERRED"], note:"the local finding it generalizes", s:"new"},
    ],
    json:`// DEFERRED + FED — shape only
{
  "insight_id": "fed:INS-2207",
  "message_type": "early_warning",
  "origin_node_id": "stillwater",
  "pattern": {"signature": "storm_closure_rise_on_single_access_crossing",
              "lead_indicators": ["flood_closures", "stranded_deliveries"]},
  "finding_refs": ["stillwater:FND-031"]
}`},
 ],
 handoff:`A shared early-warning pattern — local autonomy preserved, collective resilience increased.`,
 prov:`${REF.wpfrs} (Module 7: federated intelligence) — "stress signatures &amp; lessons propagate without mandates or hierarchy." Deferred + federation-tagged in ${LSPEC("specs/05-frs.md")}; <code>FederatedMessageType</code> enum in ${LSPEC("specs/00-canonical-enums.md")}.`,
 check:null},

// ----------------------------------------------------------------- Recap
{kind:"concept", nav:"Recap & where to help", group:"Wrap-up", badge:"✓", title:"You've followed a signal end to end — and watched the loop close",
 body:`
 <p class="lead">A drift in raw operational data became a classified finding, a bounded recommendation, and a submission back into the community's decision pipeline — all without FRS ever taking an action itself.</p>
 <div class="sec"><div class="lbl">What you saw</div>
 <p>FRS read six <b>SignalEnvelopes</b> into one <b>FRSSignalPacket</b> (M1), classified them into a <b>DiagnosticFinding</b> (M2), framed the viability question with a <b>ConstraintModel</b> (M3, deferred), issued two <b>Recommendations</b> — set to <code>pending</code>, never <code>accepted</code> (M4), made them legible with a <b>SensemakingArtifact</b> (M5), filed them into a <b>MemoryRecord</b> (M6), and shared the pattern as a <b>FederatedInsight</b> (M7). The packet's <code>status</code> climbed from <code>ingested</code> all the way to <code>submitted</code>.</p></div>
 <div class="callout teal"><b>This is what closes the loop.</b> The CDS-bound recommendation FRS raised here — "the footbridge crossing keeps failing, open a deliberation" — <b>is the very issue the CDS explainer deliberates</b>. FRS didn't decide anything; it <i>surfaced</i> the issue and handed it to the community. Read COS/ITC/OAD → flag → submit to CDS → CDS decides → dispatch tells FRS what to monitor → next packet's <code>cds_summary</code> tells FRS whether the response worked. That round trip is Integral's cybernetic metabolism.</div>
 <div class="callout warn"><b>The boundary, one more time.</b> Every recommendation FRS produced sits at <code>status: pending</code>. FRS cannot promote it. Only the receiving system can — through its own democratic process. FRS is advisory, full stop. That is the structural guarantee against shadow governance.</div>
 <div class="callout"><b>The schema coverage map (where you can help).</b> Of the records you saw, <b>3</b> have machine-checkable JSON-Schema contracts the simulator validates against — <code>FRSSignalPacket</code>, <code>DiagnosticFinding</code>, <code>Recommendation</code> (green). The rest are <b>proposed shapes</b> written in the spec prose but not yet schematized (amber): <code>SignalEnvelope</code> (the restored atomic unit) and the deferred <code>ConstraintModel</code>, <code>SensemakingArtifact</code>, <code>MemoryRecord</code>, and <code>FederatedInsight</code>. Formalising those is one of the clearest contributions available right now. (Even the green ones are <i>candidate</i> — having a schema isn't the same as ratification.)</div>
 <div class="sec"><div class="lbl">Go deeper</div>
 <p>• Read the FRS spec &amp; open questions: <code>integral-schema-exercise/specs/05-frs.md</code> and <code>schemas/frs/</code>.<br>
 • See how the loop reconnects: the CDS <b>DispatchPacket</b> sets <code>frs_monitors</code>, and the next packet's <code>cds_summary</code> reports back — the operational <i>and</i> governance loops.<br>
 • Provenance throughout traces to the ${REF.wpfrs}, the ${REF.dg35} (and ${REF.dg43}, ${REF.dg44}), and the author's ${REF.ep(0,"Ep.59")} walkthrough.</p></div>
 <div class="callout"><b>Thank you for onboarding.</b> Understanding the data structure is the foundation for improving it — and improving it together is the whole point.</div>
 `},
];

// META — per-system labels the engine uses for the title, header, and data panel.
const META = {
  key: "frs",
  emoji: "📡",
  title: "FRS · Start Here",
  sub: "The data structures behind Integral's Feedback & Review System — the adaptive nervous system that flags, but never acts",
  panelHint: "Watch the records accumulate — and the FRSSignalPacket's <code>status</code> field advance — as a signal flows through the pipeline.",
  statusObjectName: "FRSSignalPacket",   // the object whose status field advances
  statusEnumName: "SignalPacketStatus",
  statusObjectId: "stillwater:FRS-PKT-007",
};
