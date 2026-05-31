const GH_DG="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md";
const GH_WP="https://github.com/Integral-Collective/integral-whitepaper/blob/main/whitepaper";
const YT="https://youtu.be/NPaBrjjVCtE";
const REF={
  dg43:lnk(GH_DG+"#43-itc--integral-time-credits-proposed-core-records","Developer Guide §4.3 (ITC records)"),
  dg33:lnk(GH_DG+"#33-itc--integral-time-credits-proposed-core-modules","Developer Guide §3.3 (ITC modules)"),
  dg51:lnk(GH_DG+"#51-phase-1--governance-and-system-definition","Developer Guide §5.1"),
  dg44:lnk(GH_DG+"#44-api-boundaries-and-inter-system-interfaces","§4.4"),
  wpitc:lnk(GH_WP+"/07-modules/07-3-itc/itc-01-overview.md","White Paper §7.3 (ITC)"),
  ep:(t,label)=>lnk(YT+(t?"?t="+t:""), label||"Ep.59"),
};

// ----- Ledger-entry lifecycle (the field that visibly advances) -----
// One contribution → access cycle, traced as the ITCLedgerEntry.entry_type written at each
// module step (one representative type per step M1..M8). All are canonical LedgerEntryType
// values. The full enum has 10: labor_weight_applied (mid-M2) and access_redeemed (mid-M5)
// are the two intermediate types not shown here. M4 (forecasting) writes no ledger entry, so
// the status simply holds at itc_decayed across that step. STATUS length == 8 == module count.
const STATUS = ["labor_event_recorded","itc_credited","itc_decayed","itc_decayed","access_value_quoted","equivalence_band_applied","ethics_flag_created","policy_updated"];

// ----- object timeline: which records exist by which module step (module index 1..8) -----
const OBJECTS = [
  {type:"LaborEvent",        count:4,  tier:"ratified", at:1},
  {type:"ITCAccount",        count:1,  tier:"ratified", at:1},
  {type:"ITCLedgerEntry",    count:9,  tier:"ratified", at:1},
  {type:"WeightingPolicy",   count:1,  tier:"proposed", at:2},
  {type:"DecayRule",         count:1,  tier:"proposed", at:3},
  {type:"LaborDemandForecast",count:1, tier:"proposed", at:4},
  {type:"AccessValuation",   count:1,  tier:"proposed", at:5},
  {type:"RedemptionRecord",  count:1,  tier:"proposed", at:5},
  {type:"NodeEquivalenceProfile",count:1,tier:"proposed", at:6},
  {type:"EthicsEvent",       count:1,  tier:"proposed", at:7},
];

// ===================================================================== STEPS
// kind: "concept" (foundations/recap) or "module" (full scaffold). mod = module number 1..8.
const STEPS = [
{kind:"concept", nav:"Welcome", group:"Orientation", badge:"00", title:"What you're about to learn",
 body:`
 <p class="lead">Integral coordinates a community's production and access to goods <b>without money and without bosses</b>. The system that keeps track of <i>who contributed labor</i> and <i>what it takes to access a finished good</i> — without prices, wages, or accumulation — is the <b>ITC: Integral Time Credits</b>.</p>
 <p>ITC turns verified, node-mandated work into <b>non-transferable, decaying credits</b>, computes the access value of goods, and <b>extinguishes</b> credits when someone takes a good out of shared circulation. To do all that reliably, each step in its pipeline must hand the next step its information in an <b>agreed shape</b>. Those agreed shapes are called <b>schemas</b> (or "data contracts"). This walkthrough teaches you those shapes — gently, one step at a time — by following a single week of real work from logged hours all the way to a redeemed good.</p>
 <div class="callout"><b>You don't need to be a programmer.</b> We start in plain language. The technical detail is always optional (look for the "see the actual schema" toggles). By the end you'll understand the data structure behind ITC — enough to review it and suggest improvements.</div>
 <div class="callout warn"><b>⚠️ Status: a proposed candidate — not ratified.</b> Everything described here — the schemas, the example records — is <b>Phase-1 candidate work</b> (${REF.dg51}), offered to the contributor community to <b>review, challenge, and ratify</b>. Nothing here is adopted, and the substantive design questions are deliberately still open. Treat it as a starting point for deliberation, not a settled blueprint.
 <div class="prov" style="margin-top:10px"><b>Already familiar with the system?</b> Skip ahead to the candidate specs &amp; contracts (local repo):
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/03-itc.md">ITC schema spec</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/00-canonical-enums.md">canonical enums</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/itc/itc-account.json">itc-account.json</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/schemas/itc/itc-ledger-entry.json">itc-ledger-entry.json</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/specs/07-open-questions.md">open questions (ratification register)</a> ·
 <a target="_blank" rel="noopener" href="https://github.com/tairea/integral-phase-1/blob/main/integral-schema-exercise/README.md">schema exercise overview</a><br>
 Source material (GitHub): ${lnk(GH_DG,"Developer Guide")} ·
 ${lnk("https://github.com/Integral-Collective/integral-whitepaper/tree/main/whitepaper","Technical White Paper")} ·
 ${REF.ep(0,"Revolution Now! Ep.59")}.</div></div>
 <div class="sec"><div class="lbl">How to use this</div>
 <p>Move with <b>Next / Back</b> (or the ← → arrow keys), or jump around using the menu on the left. The panel on the right — <b>"The data so far"</b> — fills up as you go, so you can literally watch the records being created and a single ledger entry's <code>entry_type</code> advance through the contribution→access cycle.</p></div>
 `},

{kind:"concept", nav:"Credits ≠ money", group:"Foundations", badge:"01", title:"What ITC is — and what it refuses to be",
 body:`
 <p class="lead">ITC looks, at a glance, like a points system. It is the opposite of one. Three rules make it <b>not money</b>, and they are built into the data shapes — not bolted on as policy you could later relax.</p>
 <div class="sec"><div class="lbl">1 · Non-transferable</div>
 <p>You can never give your credits to another person, trade them, or use them to command someone's labor. In the data this is a field called <code>transferable</code> that is <b>permanently fixed to <code>false</code></b> — a named architectural constraint, <i>never a toggle</i>. There is no setting, anywhere, that could turn transfer on.</p></div>
 <div class="sec"><div class="lbl">2 · They decay</div>
 <p>Unused credits gently shrink over time (a slow, predictable, community-set rate). This isn't a punishment — it stops anyone hoarding "proto-wealth" and keeps access tied to <i>current</i> participation, not a contribution you made years ago.</p></div>
 <div class="sec"><div class="lbl">3 · Contribution ↔ access, with no market in between</div>
 <p>You earn credits by doing operationally-necessary, node-mandated work. You spend them by taking a finished good out of shared circulation — at which point they are <b>extinguished</b> (they vanish, they don't move to a seller). There is no bidding, no price, no negotiation. The "cost" of a good is computed from physical reality — labor hours, ecology, scarcity, repairability — measured in human time.</p></div>
 <div class="callout warn"><b>Only operational labor earns credits.</b> Building, repairing, maintaining, distributing — yes. Voting, ideating, and creative/governance work — <b>no</b> (that's the commons layer). Paying for ideas with credits would re-introduce market dynamics into democracy. ITC deliberately stays in its lane (${REF.wpitc}).</div>
 `},

{kind:"concept", nav:"The pipeline", group:"Foundations", badge:"02", title:"The pipeline at a glance — and the raw/weighted line",
 body:`
 <p class="lead">Picture a <b>relay race</b>. Each runner (a module) hands a baton (the data) to the next. A <b>schema</b> is the written-down, agreed shape of that baton. Integral writes these shapes down <b>before building</b>, on purpose — because changing a data shape <i>after</i> records exist means re-formatting all of history.</p>
 <div class="sec"><div class="lbl">ITC's pipeline — 8 steps we'll visit</div>
 <div class="obj"><div class="field"><span class="fn">M1 · Labor capture</span><span class="fnote">log who did what work, and verify it — value-neutral</span></div>
 <div class="field"><span class="fn">M2 · Weighting</span><span class="fnote">turn raw hours into weighted credits by skill &amp; context</span></div>
 <div class="field"><span class="fn">M3 · Time-decay</span><span class="fnote">gently shrink unused balances; prevent accumulation</span></div>
 <div class="field"><span class="fn">M4 · Forecasting</span><span class="fnote">anticipate future labor needs (a soft hint, never a command)</span></div>
 <div class="field"><span class="fn">M5 · Access &amp; redemption</span><span class="fnote">compute a good's cost; extinguish credits on acquisition</span></div>
 <div class="field"><span class="fn">M6 · Reciprocity</span><span class="fnote">keep credit meaning consistent across nodes — no arbitrage</span></div>
 <div class="field"><span class="fn">M7 · Fairness / anti-coercion</span><span class="fnote">detect proto-market behavior; flag, never punish</span></div>
 <div class="field"><span class="fn">M8 · Ledger</span><span class="fnote">an append-only, public record of everything above</span></div></div></div>
 <div class="callout"><b>The one line to remember: raw hours vs. weighted credits.</b> When work is logged it is <b>value-neutral</b> — just hours. Only Module 2 turns hours into credits, using community-set weights. The data keeps these two things <b>structurally separate</b> (you'll see <code>raw_hours</code> and <code>weighted_credits</code> sitting side by side, both recorded). That boundary lets auditors later check the <i>credits-per-hour</i> ratio for drift — so weighting can never quietly inflate.</div>
 <div class="sec"><div class="lbl">Field tags you'll see</div>
 <div class="contract">
   ${tag("WP")} from the <b>White Paper</b> &nbsp; ${tag("DG")} from the <b>Developer Guide</b> &nbsp;
   ${tag("DEFERRED")} reserved, filled later &nbsp; ${tag("FED")} for federation (mostly empty for now)
 </div></div>
 <div class="check" id="chk-rawweighted"><div class="q">🤔 Why keep raw hours and weighted credits as separate fields?</div>
 <button onclick="document.getElementById('chk-rawweighted').classList.add('show')">Show answer</button>
 <div class="a">So the un-weighting is always reconstructable. If only the weighted number were stored, no one could later check whether the weighting policy was applied fairly. Keeping both lets FRS audit the <code>weighted_credits : raw_hours</code> ratio over time and catch "weighting drift" — credit slowly inflating per hour.</div></div>
 `},

{kind:"concept", nav:"The scenario & cast", group:"Foundations", badge:"03", title:"Sam's week on the footbridge build",
 body:`
 <p class="lead">We'll follow one cycle the whole way, inside a single community — a node named <b>Stillwater</b>. (That's why every id looks like <code>stillwater:…</code> — it's the node id.) Stillwater has just <b>decided to raise &amp; reinforce its flood-prone footbridge</b> (that decision came out of the CDS — a different "Start Here"). Now the work happens, and ITC comes alive.</p>
 <div class="callout"><b>Sam spends a week on the node-mandated footbridge build.</b> The hours are logged and peer-verified, weighted into credits, and added to Sam's balance. Weeks pass and some of that balance gently decays. Later, Sam goes to the Access Center to acquire a produced good — a repaired hand-tool kit. The system quotes its access value, Sam redeems, and those credits are <b>extinguished</b>. Contribution → access, full circle, no money anywhere.</div>
 <div class="sec"><div class="lbl">The cast — members of Stillwater (the same neighbors from the CDS walkthrough)</div>
 <div class="obj">
 <div class="field"><span class="fn">Sam</span><span class="fnote">our protagonist — does the footbridge labor this week</span></div>
 <div class="field"><span class="fn">Maya</span><span class="fnote">fabrication lead — peer-verifies Sam's welding</span></div>
 <div class="field"><span class="fn">Devon</span><span class="fnote">runs the Access Center where Sam later redeems</span></div>
 <div class="field"><span class="fn">Tomas</span><span class="fnote">ecology — his eco-coefficients feed the access value</span></div>
 <div class="field"><span class="fn">Beatrice</span><span class="fnote">elder — later raises a fairness concern (Module 7)</span></div></div></div>
 <p>What matters for us is the <b>data these actions produce</b> as the cycle moves along: a <code>LaborEvent</code>, an <code>ITCAccount</code>, and a running <code>ITCLedgerEntry</code> trail. Let's begin. →</p>
 `},

// ----------------------------------------------------------------- M1
{kind:"module", mod:1, nav:"M1 · Labor capture", group:"The pipeline", badge:"M1", title:"Labor Event Capture & Verification",
 job:"Record real, node-mandated work — and authenticate it — without yet assigning any value.",
 story:`Stillwater's bridge build runs Monday to Friday. Sam works four distinct tasks across the week: cutting and mitering the new deck stringers, welding the reinforcement plates, bolting the rail assembly, and a final load test. Each task check-in is logged through COS. Maya peer-verifies the welding (it's safety-critical); the rest are confirmed by the build lead.`,
 community:`Work enters ITC <b>only after a human verifies it</b>. Sam's four tasks become four <b>LaborEvent</b> records — owned by COS, consumed by ITC. They capture hours, skill tier, and a <code>context</code> dictionary (urgency, ecological sensitivity, scarcity), but they carry <b>no credits yet</b>: at this stage labor is a value-neutral signal. Notice the raw-capture fields fill in now; the weighting-output fields stay empty until Module 2.`,
 dataIntro:`M1 opens Sam's <b>ITCAccount</b> (if it didn't exist) and writes the first <b>ITCLedgerEntry</b> records — <code>entry_type: "labor_event_recorded"</code>. Watch that ledger entry's type advance through the whole cycle →. Hours are recorded; credits are still <code>null</code>.`,
 objects:[
   {type:"LaborEvent", tier:"ratified", contract:"schemas/cos/labor-event.json",
    fields:[
     {fn:"event_id", ty:"string", t:["WP"], note:"unique id for this logged task", s:"new"},
     {fn:"participant_id", ty:"string", t:["FED"], note:"node-id:person-id — who did the work", s:"new"},
     {fn:"coop_id", ty:"string", t:["WP"], note:"the co-op the labor happened in (build crew)", s:"new"},
     {fn:"task_ref", ty:"string", t:["WP"], note:"ref to the COS Task being executed", s:"new"},
     {fn:"hours", ty:"number", t:["WP"], note:"RAW hours as reported — value-neutral", s:"new"},
     {fn:"skill_tier", ty:"enum", t:["WP"], note:"SkillTier — shared enum (e.g. welding = skilled)", s:"new"},
     {fn:"context", ty:"object", t:["WP"], note:"weighting signals {urgency_score, eco_sensitive, scarcity_factor} — Module 2's input", s:"new"},
     {fn:"verification_status", ty:"enum", t:["DG"], note:"pending | verified | disputed — only verified work counts", s:"new"},
     {fn:"verified_by", ty:"array", t:["WP"], note:"who confirmed it (Maya peer-verified the weld)", s:"new"},
     {fn:"itc_weight_multiplier", ty:"number|null", t:["WP"], note:"WEIGHTED-OUTPUT field — empty until Module 2 (the preserved boundary)", s:"new"},
     {fn:"itc_weighted_hours", ty:"number|null", t:["WP"], note:"hours × multiplier — empty until Module 2", s:"new"},
     {fn:"itc_credits_issued", ty:"number|null", t:["WP"], note:"credits generated — empty until Module 2", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:LE-014",
  "participant_id": "stillwater:sam",
  "coop_id": "stillwater:bridge-crew",
  "task_ref": "stillwater:TASK-welding-reinforcement",
  "hours": 6.0,
  "skill_tier": "skilled",
  "context": { "urgency_score": 0.7, "eco_sensitive": true, "scarcity_factor": 0.3 },
  "verification_status": "verified",
  "verified_by": ["stillwater:maya"],
  "itc_weight_multiplier": null,   // <-- weighting outputs still EMPTY
  "itc_weighted_hours": null,      //     raw vs. weighted boundary, visible
  "itc_credits_issued": null
}`},
   {type:"ITCLedgerEntry", tier:"ratified", contract:"schemas/itc/itc-ledger-entry.json",
    fields:[
     {fn:"entry_id", ty:"string", t:["WP"], note:"unique id for this ledger line", s:"new"},
     {fn:"entry_type", ty:"enum", t:["WP"], note:'LedgerEntryType — starts at "labor_event_recorded"; this field advances every step →', s:"new"},
     {fn:"raw_hours", ty:"number|null", t:["WP"], note:"unweighted hours — labor entries only", s:"new"},
     {fn:"weighted_credits", ty:"number|null", t:["WP"], note:"post-weighting credits — null until M2", s:"new"},
     {fn:"amount", ty:"number", t:["WP"], note:"net credit change (0 here — no credits issued yet)", s:"new"},
     {fn:"balance_after", ty:"number", t:["WP"], note:"balance snapshot after this entry", s:"new"},
     {fn:"related_ids", ty:"object", t:["WP"], note:"links {event_id, account_id} for traceability", s:"new"},
    ],
    json:`{
  "entry_id": "stillwater:LED-101",
  "timestamp": "2026-05-04T16:20:00Z",
  "participant_id": "stillwater:sam",
  "node_id": "stillwater",
  "governance_scope": "coop",
  "coop_id": "stillwater:bridge-crew",
  "entry_type": "labor_event_recorded",
  "amount": 0,
  "raw_hours": 6.0,
  "weighted_credits": null,
  "balance_after": 0,
  "related_ids": { "event_id": "stillwater:LE-014", "account_id": "stillwater:ACC-sam" }
}`},
 ],
 handoff:`Four verified, value-neutral LaborEvents — raw hours captured, credits still empty — ready to be weighted.`,
 prov:`${REF.wpitc} (Module 1: labor event capture &amp; verification) — "labor enters as a neutral signal, not yet valued." The COS-owned, ITC-consumed boundary is detailed in ${REF.dg43}. Schema: ${LSPEC("specs/03-itc.md")} → ${LSPEC("schemas/itc/itc-ledger-entry.json")}.`,
 check:{q:"Sam logged the hours — does Sam have any credits yet?", a:"No. Logging is value-neutral. The hours are captured and verified, but the credit-bearing fields stay null until Module 2 applies the weighting. Raw work and weighted value are deliberately separate steps."}},

// ----------------------------------------------------------------- M2
{kind:"module", mod:2, nav:"M2 · Weighting", group:"The pipeline", badge:"M2", title:"Skill & Context Weighting Engine",
 job:"Turn raw hours into weighted credits — using community-set weights, never a market.",
 story:`Sam's four tasks aren't equal. Welding the reinforcement plates is safety-critical skilled work; bolting the rail is routine. The build also runs under mild flood-season urgency, which the node's policy lets nudge the weight up a little.`,
 community:`Weighting is <b>democratically calibrated, bounded by CDS policy</b> — no bidding, no negotiation, no advantage gained. The hour is not the unit of value; the <b>contextualized contribution</b> is. The weights come from a <b>WeightingPolicy</b> (base weights by skill, context bumps, and hard min/max bounds so nothing runs away).`,
 dataIntro:`M2 fills the previously-empty weighting fields on each LaborEvent, issues credits, and writes ledger entries of type <code>labor_weight_applied</code> then <code>itc_credited</code>. The ledger entry now carries <b>both</b> <code>raw_hours</code> and <code>weighted_credits</code> — the audit pair. Sam's balance rises for the first time.`,
 objects:[
   {type:"WeightingPolicy", tier:"proposed", contract:"(proposed shape — defined in spec, not yet schematized)",
    fields:[
     {fn:"policy_id", ty:"string", t:["WP"], note:"which weighting policy snapshot was applied", s:"new"},
     {fn:"base_weights", ty:"object", t:["WP"], note:"base multiplier by SkillTier (e.g. routine 1.0, skilled 1.8 for welding)", s:"new"},
     {fn:"context_weights", ty:"object", t:["WP"], note:"bumps for urgency, ecological sensitivity, scarcity", s:"new"},
     {fn:"multiplier_min", ty:"number", t:["WP"], note:"hard floor on the final multiplier (e.g. 0.5)", s:"new"},
     {fn:"multiplier_max", ty:"number", t:["WP"], note:"hard ceiling on the final multiplier (e.g. 2.0)", s:"new"},
    ]},
   {type:"ITCLedgerEntry", tier:"ratified", contract:"schemas/itc/itc-ledger-entry.json",
    fields:[
     {fn:"entry_type", ty:"enum", t:["WP"], note:'now "labor_weight_applied" → then "itc_credited"', s:"updated"},
     {fn:"raw_hours", ty:"number", t:["WP"], note:"6.0 — the original hours, kept", s:"carried"},
     {fn:"weighted_credits", ty:"number", t:["WP"], note:"now filled: 6.0 × 1.97 ≈ 11.8 credits", s:"new"},
     {fn:"amount", ty:"number", t:["WP"], note:"+11.8 — credits actually issued for this event", s:"updated"},
     {fn:"balance_after", ty:"number", t:["WP"], note:"Sam's balance after crediting all four tasks", s:"updated"},
     {fn:"authorized_by", ty:"string", t:["WP"], note:"the weighting engine / policy snapshot that authorized it", s:"new"},
    ],
    json:`// Per-task weighting (CDS-approved WeightingPolicy bounds 0.5–2.0):
//   tube cutting   1.5h × 1.00 = 1.50
//   welding        6.0h × 1.97 = 11.82   (skilled 1.8 + urgency +0.12 + fatigue +0.05)
//   rail bolting   2.0h × 1.20 = 2.40
//   load test      0.5h × 1.00 = 0.50
{
  "entry_id": "stillwater:LED-105",
  "entry_type": "itc_credited",
  "raw_hours": 6.0,
  "weighted_credits": 11.82,     // <-- BOTH now present: the FRS audit pair
  "amount": 11.82,
  "balance_after": 16.22,        // 1.50 + 11.82 + 2.40 + 0.50
  "related_ids": { "event_id": "stillwater:LE-014", "policy_snapshot_id": "stillwater:WP-2026Q2" }
}`},
 ],
 handoff:`Raw hours are now weighted credits, with the raw figure still on the record. Sam's balance: 16.22 ITC.`,
 prov:`${REF.wpitc} (Module 2) — "the hour is not the unit of value; the contextualized contribution signal is," within "CDS-approved bands … no bidding, no competition." The bicycle example puts a welding task at 1.97 after COS/FRS modifiers (${REF.ep(0,"Ep.59")}). WeightingPolicy is a <b>proposed shape</b> in ${LSPEC("specs/03-itc.md")}.`,
 check:{q:"Why is WeightingPolicy amber (proposed), not green (ratified)?", a:"Only the records that cross between systems were given strict JSON-Schema contracts so far. The weighting policy is written in the spec prose but not yet schematized — exactly the kind of gap the collective can close."}},

// ----------------------------------------------------------------- M3
{kind:"module", mod:3, nav:"M3 · Time-decay", group:"The pipeline", badge:"M3", title:"Time-Decay Mechanism",
 job:"Gently shrink unused balances so access stays tied to current participation — never accumulation.",
 story:`After the bridge build, Sam takes a few weeks off active work. Sam's 16.22 credits don't vanish, but they slowly shrink — an exponential half-life decay with a short grace period before it kicks in. This isn't a penalty; it's what stops credits from becoming proto-wealth.`,
 community:`Decay is <b>slow, predictable, and democratically set</b> — never black-boxed. The parameters live in a <b>DecayRule</b> whose authoritative copy is held by CDS; the ITCAccount carries a <b>read-through snapshot</b> of it. A protected minimum and a maximum annual fraction keep decay humane. Crucially, credits already extinguished through access are <b>never</b> decayed — only unused balances are.`,
 dataIntro:`M3 applies decay to Sam's <b>ITCAccount</b> (updating <code>balance</code>, <code>total_decayed</code>, <code>last_decay_applied_at</code>) and writes a ledger entry of type <code>itc_decayed</code>. This is the ITCAccount's first appearance in full — note <code>transferable</code> is hard-fixed to <code>false</code>.`,
 objects:[
   {type:"ITCAccount", tier:"ratified", contract:"schemas/itc/itc-account.json",
    fields:[
     {fn:"account_id", ty:"string", t:["WP"], note:"Sam's single, node-level account", s:"new"},
     {fn:"balance", ty:"number", t:["WP"], note:"current balance (after this decay tick)", s:"updated"},
     {fn:"total_earned", ty:"number", t:["WP"], note:"lifetime credits issued", s:"new"},
     {fn:"total_decayed", ty:"number", t:["WP"], note:"lifetime lost to decay — rises now", s:"updated"},
     {fn:"total_redeemed", ty:"number", t:["WP"], note:"lifetime extinguished via access (still 0)", s:"new"},
     {fn:"active_decay_rule_id", ty:"string", t:["WP"], note:"ref to the CDS-ratified DecayRule in effect", s:"new"},
     {fn:"decay_snapshot", ty:"object", t:["WP"], note:"read-through copy of the DecayRule params (kept in sync, never authored here)", s:"new"},
     {fn:"transferable", ty:"const false", t:["WP"], note:"ALWAYS false — architectural constraint, never a toggle", s:"new"},
     {fn:"federation_scope", ty:"enum", t:["FED"], note:"local for now — cross-node recognition is deferred", s:"new"},
    ],
    json:`{
  "account_id": "stillwater:ACC-sam",
  "participant_id": "stillwater:sam",
  "node_id": "stillwater",
  "balance": 14.90,             // decayed from 16.22 after the grace window
  "total_earned": 16.22,
  "total_decayed": 1.32,
  "total_redeemed": 0,
  "active_decay_rule_id": "stillwater:DECAY-std-2026",
  "decay_snapshot": {
    "decay_half_life_days": 180,
    "decay_inactivity_grace_days": 30,
    "decay_min_balance_protected": 5.0,
    "decay_max_annual_fraction": 0.40
  },
  "transferable": false,        // <-- can NEVER be true
  "federation_scope": "local",
  "last_decay_applied_at": "2026-06-15T00:00:00Z"
}`},
 ],
 handoff:`A truthfully shrinking balance (14.90 ITC) that reflects current, not historical, participation — ready for when Sam wants to access a good.`,
 prov:`${REF.wpitc} (Module 3) — "decay is not a punishment … a normalization mechanism," bounded by CDS, monitored by FRS; extinguished credits aren't decayed. The DecayRule's authoritative home in CDS with an ITCAccount snapshot is the §4.3 design (OQ-04). Schema: ${LSPEC("schemas/itc/itc-account.json")}.`,
 check:{q:"Sam's balance dropped without spending anything. Is something wrong?", a:"No — that's decay working as designed. Unused credits shrink on a slow, community-set half-life so no one can stockpile influence. A protected minimum keeps it humane, and credits spent on access are never decayed."}},

// ----------------------------------------------------------------- M4
{kind:"module", mod:4, nav:"M4 · Forecasting", group:"The pipeline", badge:"M4", title:"Labor-Budget Forecasting & Need Anticipation",
 job:"Anticipate future labor needs so recognition stays proportional — a hint, never a command.",
 story:`Stillwater's planners notice flood season is coming and the vertical farm will need extra hands. The system forecasts a rise in bridge-maintenance and farm-logistics labor over the next two months.`,
 community:`Forecasting <b>does not compel anyone</b> to work. It adjusts <i>recognition parameters</i> (e.g. nudging future weighting for scarce skills) and opens training, so contribution stays matched to real system needs. It produces soft signals that inform M2 and CDS — it never issues or removes a single credit.`,
 dataIntro:`M4 produces a <b>LaborDemandForecast</b>. It does not touch Sam's account or balance — it's feed-forward intelligence. (No ledger entry is written for a forecast; only real credit movements hit the ledger, so the status field simply holds at <code>itc_decayed</code> across this step.)`,
 objects:[
   {type:"LaborDemandForecast", tier:"proposed", contract:"(proposed shape — DEFERRED in spec, forecasting module)",
    fields:[
     {fn:"forecast_id", ty:"string", t:["WP"], note:"id for this forecast snapshot", s:"new"},
     {fn:"horizon_days", ty:"integer", t:["WP"], note:"how far ahead it looks (e.g. 60)", s:"new"},
     {fn:"skill_demand", ty:"object", t:["WP"], note:"projected hours needed per SkillTier", s:"new"},
     {fn:"drivers", ty:"array", t:["WP"], note:"why: COS cycles, OAD updates, ecological/seasonal constraints", s:"new"},
     {fn:"suggested_weight_adjustments", ty:"object", t:["WP","DEFERRED"], note:"non-binding hints to M2 — never compels participation", s:"new"},
    ],
    json:`{
  "forecast_id": "stillwater:FCAST-2026-06",
  "horizon_days": 60,
  "skill_demand": { "skilled": 220, "routine": 95 },   // projected hours
  "drivers": ["flood-season", "farm-logistics-surge", "bridge-maintenance-cycle"],
  "suggested_weight_adjustments": { "skilled.welding": "+0.05" },   // a HINT, not a command
  "compels_participation": false
}`},
 ],
 handoff:`A forward-looking picture of labor needs that gently informs future weighting and training — Sam's balance is untouched.`,
 prov:`${REF.wpitc} (Module 4) — "forecasting does not compel participation; it adjusts recognition parameters so that contribution remains proportional to actual system needs." LaborDemandForecast is listed <b>DEFERRED</b> (Module 4 forecasting) in ${LSPEC("specs/03-itc.md")} — soft hints, never compulsion.`,
 check:{q:"The forecast says more welders are needed. Does Sam now have to weld?", a:"No. Forecasting never compels anyone. It only adjusts recognition parameters (like future weights) and opens training — a feed-forward hint, not an order. Participation stays voluntary."}},

// ----------------------------------------------------------------- M5
{kind:"module", mod:5, nav:"M5 · Access & redeem", group:"The pipeline", badge:"M5", title:"Access Allocation & Redemption",
 job:"Compute a good's access value from physical reality — then extinguish credits on acquisition.",
 story:`Sam needs a repaired hand-tool kit for home use — a permanent acquisition (it leaves shared circulation). The Access Center, run by Devon, asks the system: what's the access value? The system computes it from the kit's labor, ecology, scarcity, and repairability — no price, no haggling.`,
 community:`This is the operational heart of post-price distribution. The <b>AccessValuation</b> is built from OAD + COS + FRS signals: weighted labor hours, an ecological burden, a material-scarcity bump, and <i>negative</i> credits for repairability and longevity. Then Sam redeems — a <b>RedemptionRecord</b> — and because it's a <code>permanent_acquisition</code>, the credits are <b>extinguished</b>: gone, not transferred to anyone.`,
 dataIntro:`M5 writes a ledger entry <code>access_value_quoted</code> (the AccessValuation), then on redemption <code>access_redeemed</code> — deducting credits from Sam's ITCAccount (<code>total_redeemed</code> rises, <code>balance</code> falls). The redemption type is an <b>AccessMode</b> shared with COS: same event, two sides.`,
 objects:[
   {type:"AccessValuation", tier:"proposed", contract:"(proposed shape — white-paper record, not yet schematized)",
    fields:[
     {fn:"item_id", ty:"string", t:["WP"], note:"the good being valued (the tool kit)", s:"new"},
     {fn:"design_version_id", ty:"string", t:["WP"], note:"the OAD CertifiedDesign + version the value is built from", s:"new"},
     {fn:"base_weighted_labor_hours", ty:"number", t:["WP"], note:"labor backbone, from OAD/COS decomposition", s:"new"},
     {fn:"eco_burden_adjustment", ty:"number", t:["WP"], note:"hours-equivalent added for ecological burden", s:"new"},
     {fn:"material_scarcity_adjustment", ty:"number", t:["WP"], note:"hours-equivalent added for scarce materials", s:"new"},
     {fn:"repairability_credit", ty:"number", t:["WP"], note:"NEGATIVE — lowers the cost of repairable goods", s:"new"},
     {fn:"longevity_credit", ty:"number", t:["WP"], note:"NEGATIVE — rewards durable, long-lived designs", s:"new"},
     {fn:"final_itc_cost", ty:"number", t:["WP"], note:"the final obligation in ITC (fairness-bounded by CDS)", s:"new"},
     {fn:"policy_snapshot_id", ty:"string", t:["WP"], note:"which CDS policy governed this valuation", s:"new"},
    ],
    json:`{
  "item_id": "stillwater:ITEM-toolkit-rev2",
  "design_version_id": "stillwater:OAD-toolkit-v2",
  "base_weighted_labor_hours": 9.40,
  "eco_burden_adjustment": 1.60,
  "material_scarcity_adjustment": 0.30,
  "repairability_credit": -1.20,    // negative: repairable goods cost LESS
  "longevity_credit": -0.90,
  "final_itc_cost": 9.20,           // bounded by CDS fairness policy
  "policy_snapshot_id": "stillwater:ACCPOL-2026Q2"
}`},
   {type:"RedemptionRecord", tier:"proposed", contract:"(proposed shape — the extinguishment event)",
    fields:[
     {fn:"redemption_id", ty:"string", t:["WP"], note:"id for this access event", s:"new"},
     {fn:"participant_id", ty:"string", t:["WP"], note:"node-id:person-id — Sam", s:"new"},
     {fn:"item_id", ty:"string", t:["WP"], note:"the good acquired", s:"new"},
     {fn:"itc_spent", ty:"number", t:["WP"], note:"credits deducted — and EXTINGUISHED for permanent acquisition", s:"new"},
     {fn:"redemption_type", ty:"enum", t:["WP"], note:"AccessMode: permanent_acquisition | shared_use_lock | service_use", s:"new"},
     {fn:"redemption_time", ty:"string", t:["WP"], note:"when the acquisition happened", s:"new"},
     {fn:"expires_at", ty:"string|null", t:["WP"], note:"null for permanent acquisition; set for shared_use_lock / timed access", s:"new"},
     {fn:"access_valuation_snapshot", ty:"object", t:["WP"], note:"the AccessValuation embedded for audit", s:"new"},
    ],
    json:`{
  "redemption_id": "stillwater:RDM-031",
  "participant_id": "stillwater:sam",
  "item_id": "stillwater:ITEM-toolkit-rev2",
  "itc_spent": 9.20,
  "redemption_type": "permanent_acquisition",   // <-- credits EXTINGUISHED, not transferred
  "redemption_time": "2026-06-20T11:00:00Z"
}
// ↻ matching ledger entry:
{ "entry_type": "access_redeemed", "amount": -9.20, "balance_after": 5.70 }
// ↻ ITCAccount: total_redeemed 0 → 9.20, balance 14.90 → 5.70`},
 ],
 handoff:`Sam owns the kit; 9.20 credits are gone for good — not moved, not earned by anyone. Contribution has become access, with no market in between.`,
 prov:`${REF.wpitc} (Module 5) — access-values from OAD/COS/FRS signals; "when a member acquires a good … ITCs are extinguished. They are never transferred." The bicycle walkthrough shows the same cost build-up (labor + eco + scarcity − repairability − longevity). AccessMode is <b>shared with COS</b> (${LSPEC("specs/00-canonical-enums.md")}); AccessValuation/RedemptionRecord are proposed shapes in ${LSPEC("specs/03-itc.md")}.`,
 check:{q:"Where do Sam's 9.20 spent credits go?", a:"Nowhere — they're extinguished. They don't transfer to a seller, the Access Center, or anyone. This is the core proof that ITC isn't money: spending destroys credits rather than moving them, so acquisition stays tied to contribution and accumulation is impossible."}},

// ----------------------------------------------------------------- M6
{kind:"module", mod:6, nav:"M6 · Reciprocity", group:"The pipeline", badge:"M6", title:"Cross-Cooperative & Internodal Reciprocity",
 job:"Keep credit meaning consistent across nodes — harmonize interpretation, never enable arbitrage.",
 story:`A member from a neighboring node visits Stillwater to help, and Sam later considers spending some credits while travelling there. Different nodes have different skill scarcities and ecological conditions, so "what a credit can access" varies — but no one should gain or lose just by moving.`,
 community:`This module harmonizes <b>interpretation, not balances</b>. The underlying ledger and account are untouched; only the <i>local access computation</i> adjusts via <b>equivalence bands</b>. There's no currency exchange and no arbitrage — you can't earn cheap and spend dear.`,
 dataIntro:`M6 produces a <b>NodeEquivalenceProfile</b> (a deferred federation object) and, when applied, writes an <code>equivalence_band_applied</code> ledger entry. The balance number doesn't change — only how it's interpreted locally.`,
 objects:[
   {type:"NodeEquivalenceProfile", tier:"proposed", contract:"(proposed shape — DEFERRED, federation calibration)",
    fields:[
     {fn:"profile_id", ty:"string", t:["WP"], note:"id for this node's equivalence profile", s:"new"},
     {fn:"home_node_id", ty:"string", t:["FED"], note:"the node whose credits are being interpreted", s:"new"},
     {fn:"host_node_id", ty:"string", t:["FED"], note:"the node where access is being computed", s:"new"},
     {fn:"equivalence_bands", ty:"array", t:["WP","DEFERRED"], note:"interpretation ranges by skill/eco context — NOT a balance edit", s:"new"},
     {fn:"adjusts_balance", ty:"const false", t:["WP"], note:"always false — harmonizes meaning, never the ledger", s:"new"},
    ],
    json:`{
  "profile_id": "stillwater:EQV-from-rivermouth",
  "home_node_id": "rivermouth",
  "host_node_id": "stillwater",
  "equivalence_bands": [
    { "skill": "skilled.welding", "interpretation_factor": 1.05 }   // scarcer here → reads slightly higher
  ],
  "adjusts_balance": false   // <-- the ledger is NEVER rewritten; only local reads adapt
}`},
 ],
 handoff:`Credits keep a fair, consistent meaning across the federation — no one is penalized or advantaged by movement, and no arbitrage is possible.`,
 prov:`${REF.wpitc} (Module 6) — "harmonizes interpretation, not balances, through equivalence bands … the underlying ITC ledger remains unchanged; only local access computation adjusts." Equivalence objects are listed <b>DEFERRED</b> (cross-node calibration, Module 6) in ${LSPEC("specs/03-itc.md")}.`,
 check:{q:"Does visiting another node change how many credits Sam has?", a:"No. The balance number never changes. Only the local interpretation adjusts via equivalence bands, so movement is fair and arbitrage (earn cheap, spend dear) is impossible. Reciprocity harmonizes meaning, not the ledger."}},

// ----------------------------------------------------------------- M7
{kind:"module", mod:7, nav:"M7 · Fairness", group:"The pipeline", badge:"M7", title:"Fairness, Anti-Coercion & Ethical Safeguards",
 job:"Detect proto-market behavior and coercion — flag and escalate, never punish or edit balances.",
 story:`At the Access Center, Beatrice notices something off: members with higher balances seem to be getting faster access to a scarce diagnostic bench. That's exactly the kind of "your credits buy you priority" behavior ITC exists to prevent. She raises it.`,
 community:`This module is <b>detection-only</b>. It watches for things like "I'll give you 5 ITC to fix my screen" (forbidden — credits can't be offered anyway), pressure to take high-weight tasks, preferential treatment for high holders, role cornering, or decay evasion. It does <b>not</b> sanction or modify any balance — it flags and escalates through FRS to CDS for democratic resolution.`,
 dataIntro:`M7 produces an <b>EthicsEvent</b> and writes an <code>ethics_flag_created</code> ledger entry (with no credit movement — <code>amount: 0</code>). Severity uses the shared <code>Severity</code> enum; status follows <code>EthicsStatus</code>.`,
 objects:[
   {type:"EthicsEvent", tier:"proposed", contract:"(proposed shape — white-paper Module 7, not yet schematized)",
    fields:[
     {fn:"event_id", ty:"string", t:["WP"], note:"id for this ethics flag", s:"new"},
     {fn:"severity", ty:"enum", t:["WP"], note:"shared Severity (e.g. warning) — reconciled, see OQ-07", s:"new"},
     {fn:"description", ty:"string", t:["WP"], note:"what was observed, in plain terms", s:"new"},
     {fn:"involved_member_ids", ty:"array", t:["FED"], note:"node-id:person-id list — who's involved (empty here)", s:"new"},
     {fn:"involved_coop_ids", ty:"array", t:["WP"], note:"the co-op(s) where it surfaced (the repair co-op)", s:"new"},
     {fn:"rule_violations", ty:"array", t:["WP"], note:"e.g. queue_bias, proto_market_exchange, coercion_pattern, decay_evasion, role_monopoly", s:"new"},
     {fn:"status", ty:"enum", t:["WP"], note:"EthicsStatus: open | under_review | resolved", s:"new"},
     {fn:"resolution_notes", ty:"string|null", t:["WP"], note:"filled by CDS when resolved — null while open", s:"new"},
    ],
    json:`{
  "event_id": "stillwater:ETH-007",
  "node_id": "stillwater",
  "timestamp": "2026-06-21T09:30:00Z",
  "severity": "warning",
  "description": "Higher-balance members given faster access to the scarce diagnostic bench.",
  "involved_member_ids": [],            // a queue pattern, not a named individual
  "involved_coop_ids": ["stillwater:repair-coop"],
  "rule_violations": ["queue_bias"],
  "status": "open",
  "resolution_notes": null              // filled by CDS once resolved
}
// → escalates via FRS to CDS; NO balance is touched here. Ledger: { "entry_type": "ethics_flag_created", "amount": 0 }`},
 ],
 handoff:`A flagged concern routed to CDS for democratic resolution (CDS later resets the queue rules) — no balances altered, no one auto-punished.`,
 prov:`${REF.wpitc} (Module 7) — "this module does not enforce sanctions or modify balances; it detects ethical violations and escalates them through FRS to CDS." The high-balance-priority example is the white paper's own (${REF.ep(0,"Ep.59")}). EthicsEvent is a proposed shape in ${LSPEC("specs/03-itc.md")}; severity reconciles to shared <code>Severity</code> (OQ-07).`,
 check:{q:"The system flagged unfair queue priority. Does it dock anyone's credits?", a:"No. M7 is detection-only — it flags and escalates to CDS for democratic resolution. It never modifies balances or imposes sanctions itself. Enforcement authority stays with the community, not the credit engine."}},

// ----------------------------------------------------------------- M8
{kind:"module", mod:8, nav:"M8 · Ledger", group:"The pipeline", badge:"M8", title:"Ledger, Transparency & Auditability",
 job:"Keep an append-only, publicly inspectable record of every credit event — so nothing can hide.",
 story:`Everything we've watched — Sam's logged hours, the weighting, the decay tick, the access quote, the extinguishing redemption, the equivalence read, the ethics flag — is already in the ledger. Module 8 is where that trail becomes a coherent, tamper-evident public record.`,
 community:`The ledger is <b>not a blockchain</b> — it's a cybernetic audit layer. It records, doesn't govern. Anyone can see how an access value was derived, why a weight changed, how decay was applied. This is what lets FRS audit the <code>weighted_credits : raw_hours</code> ratio for drift and what turns a quiet problem into a visible, correctable one.`,
 dataIntro:`M8 doesn't create a new object type — it <b>is</b> the <code>ITCLedgerEntry</code> stream you've been watching fill up. Here's Sam's complete cycle as one append-only chain. The final policy-related line shows a <code>policy_updated</code> entry (e.g. CDS revising the queue rule from M7).`,
 objects:[
   {type:"ITCLedgerEntry", tier:"ratified", contract:"schemas/itc/itc-ledger-entry.json",
    fields:[
     {fn:"entry_type", ty:"enum", t:["WP"], note:"the 10-value LedgerEntryType enum — the whole story, in one field", s:"carried"},
     {fn:"balance_after", ty:"number", t:["WP"], note:"running balance snapshot at each step — fully reconstructable", s:"carried"},
     {fn:"prev_hash", ty:"string|null", t:["WP","DEFERRED"], note:"reserved — chains entries into a tamper-evident ledger", s:"new"},
     {fn:"entry_hash", ty:"string|null", t:["WP","DEFERRED"], note:"reserved — cryptographic chaining is later policy", s:"new"},
    ],
    json:`// Sam's complete cycle, append-only (one ITCLedgerEntry per line):
[
  { "entry_type": "labor_event_recorded", "raw_hours": 6.0,  "amount": 0,     "balance_after": 0.00, "prev_hash": "GENESIS" },
  { "entry_type": "labor_weight_applied", "raw_hours": 6.0,  "amount": 0,     "balance_after": 0.00  },
  { "entry_type": "itc_credited",         "weighted_credits": 11.82, "amount": 11.82, "balance_after": 16.22 },
  { "entry_type": "itc_decayed",          "amount": -1.32, "balance_after": 14.90 },
  // (M4 forecast: no ledger entry — only real credit movements are recorded)
  { "entry_type": "access_value_quoted",  "amount": 0,     "balance_after": 14.90 },
  { "entry_type": "access_redeemed",      "amount": -9.20, "balance_after": 5.70 },
  { "entry_type": "equivalence_band_applied", "amount": 0,  "balance_after": 5.70 },
  { "entry_type": "ethics_flag_created",  "amount": 0,     "balance_after": 5.70 },
  { "entry_type": "policy_updated",       "amount": 0,     "balance_after": 5.70 }
]`},
 ],
 handoff:`A complete, public, append-only account of one contribution→access cycle — every credit traceable, nothing hidden, the loop closed. And note: as automation and reuse reduce labor, access-values fall and ITC makes itself progressively less necessary.`,
 prov:`${REF.wpitc} (Module 8) — "an append-only and publicly inspectable" ledger that "records system activity so governance and feedback systems can act … the ledger is not a blockchain." Hash-chaining (<code>prev_hash</code>/<code>entry_hash</code>) is marked <b>DEFERRED</b> in ${LSPEC("specs/03-itc.md")} → ${LSPEC("schemas/itc/itc-ledger-entry.json")}.`,
 check:{q:"How can the community check that weighting wasn't quietly inflated over time?", a:"Because every labor entry stores both raw_hours and weighted_credits, FRS can audit the weighted_credits-to-raw_hours ratio across the whole append-only ledger and catch drift. Keeping both numbers — the raw/weighted boundary — is what makes that audit possible."}},

// ----------------------------------------------------------------- Recap
{kind:"concept", nav:"Recap & where to help", group:"Wrap-up", badge:"✓", title:"You've followed a credit from labor to extinguishment",
 body:`
 <p class="lead">One week of node-mandated work became weighted credits, decayed gently, then was extinguished on access — and every step handed the next a well-shaped baton, with no money anywhere in the loop.</p>
 <div class="sec"><div class="lbl">What you saw</div>
 <p>A <b>LaborEvent</b> captured raw, value-neutral hours (M1). Weighting turned them into credits (M2). An <b>ITCAccount</b> held the balance and let it <i>decay</i> (M3). A forecast hinted at future need without compelling anyone (M4). An <b>AccessValuation</b> priced a good in human time and a <b>RedemptionRecord</b> <i>extinguished</i> the credits on acquisition (M5). Reciprocity kept meaning consistent across nodes (M6), an <b>EthicsEvent</b> flagged unfairness for CDS (M7), and the append-only <b>ITCLedgerEntry</b> stream recorded all of it (M8) — <b>10 object types</b> in all. Throughout, <code>transferable</code> stayed fixed to <code>false</code> and the raw/weighted boundary stayed visible.</p></div>
 <div class="callout teal"><b>The schema coverage map (where you can help).</b> Only <b>3</b> of those object types currently have a machine-checkable JSON-Schema contract — <code>ITCAccount</code>, <code>ITCLedgerEntry</code> (in <code>schemas/itc/</code>), and <code>LaborEvent</code> (schematized under COS) — green. The other <b>7</b> — <code>WeightingPolicy</code>, <code>DecayRule</code>, <code>LaborDemandForecast</code>, <code>AccessValuation</code>, <code>RedemptionRecord</code>, <code>NodeEquivalenceProfile</code>, <code>EthicsEvent</code> — are <b>proposed shapes</b> written in the spec prose but not yet schematized (amber). Formalising those (especially <code>AccessValuation</code> and <code>RedemptionRecord</code>, which carry the extinguishment proof) is one of the clearest, most useful contributions available right now. (Even the green ones are <i>candidate</i> — having a schema isn't the same as the community having ratified it.)</div>
 <div class="sec"><div class="lbl">Two structural principles to carry away</div>
 <p>• <b>Non-transferability is architectural.</b> <code>transferable: false</code> is a named constant, never a toggle — there is no path, in any schema, to turning transfer on.<br>
 • <b>Raw vs. weighted labor stays separate.</b> <code>raw_hours</code> and <code>weighted_credits</code> are both recorded so weighting can always be audited for drift. The boundary must survive in the field structure.<br>
 • <b>ITC is designed to shrink.</b> As automation and open design reuse cut labor inputs, access-values fall toward zero — the metabolic layer is meant to wither, not entrench.</p></div>
 <div class="sec"><div class="lbl">Go deeper</div>
 <p>• Read the schemas &amp; open questions: <code>integral-schema-exercise/specs/03-itc.md</code> and <code>schemas/itc/</code>.<br>
 • Provenance throughout traces to the ${REF.wpitc}, the ${REF.dg43} and ${REF.dg33}, and the author's ${REF.ep(0,"Ep.59")} walkthrough.</p></div>
 <div class="callout"><b>Thank you for onboarding.</b> Understanding the data structure is the foundation for improving it — and improving it together is the whole point.</div>
 `},
];

// META — per-system labels the engine uses for the title, header, and data panel.
const META = {
  key: "itc",
  emoji: "⏳",
  title: "ITC · Start Here",
  sub: "The data structures behind Integral's Integral Time Credits — contribution to access, one step at a time",
  panelHint: "Watch the records accumulate — and a single <code>ITCLedgerEntry</code>'s <code>entry_type</code> advance through the contribution→access cycle — as you move through the pipeline.",
  statusObjectName: "ITCLedgerEntry",     // the object whose entry_type advances
  statusEnumName: "LedgerEntryType",
  statusObjectId: "stillwater:LED-101",
};
