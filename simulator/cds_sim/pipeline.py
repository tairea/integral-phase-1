"""The CDS Module 1->8 engine. Operates on the candidate schema objects, faithful to
specs/01-cds.md + the Ep.59 refinements (dedup, auto-generated scenarios, asymmetric gradient,
objection index, orchestrator selection, value-conflict escalation). Records every module's
input->output into a trace the report renders. Deterministic given a fixed timestamp."""
import difflib
from . import schema
from .personas import DIMENSIONS, NODE_ID

# canonical asymmetric support gradient (Ep.59 frame 65 — a ConsensusPolicy parameter)
GRADIENT = {"strong_support": 1.0, "support": 0.6, "neutral": 0.0, "concern": -0.4, "block": -1.0}
CONSENSUS_THRESHOLD = 0.72
BLOCK_THRESHOLD = 0.30
DEDUP_THRESHOLD = 0.75
MAX_ROUNDS = 3  # hard cap on M5↔M6 revision cycles — persistent disagreement escalates to Module 9

_THEME_KW = {
    "resilience": ["cut off", "holds", "storm", "fails"], "ecology": ["creek", "salmon", "carbon", "watershed"],
    "cost": ["labor-hours", "load", "build eats", "burden"], "heritage": ["sixty years", "hands", "lumber", "memory"],
    "equity": ["elderly", "wheelchair", "stranded", "reach"], "speed": ["now", "relief", "season of construction"],
}


class Pipeline:
    def __init__(self, scenario, personas, llm, ts="2026-05-30T12:00:00Z"):
        self.s = scenario
        self.personas = personas
        self.llm = llm
        self.ts = ts
        self.node = scenario.get("node_id", NODE_ID)
        self.trace = []
        self.validations = []

    def log(self, module, title, summary, **data):
        self.trace.append({"module": module, "title": title, "summary": summary, "data": data})

    def _validate(self, kind, obj):
        errs = schema.validate(kind, obj)
        self.validations.append({"kind": kind, "ok": not errs, "errors": errs})
        return obj

    # ----------------------------------------------------------------- M1
    def m1_intake(self):
        raw = self.llm.generate_concerns(self.s, self.personas)
        kept, subs = [], []
        for i, r in enumerate(raw, 1):
            sid = f"{self.node}:SUB-{i:03d}"
            norm = r["text"].lower().strip()
            dup_of = None
            for c in kept:
                if difflib.SequenceMatcher(None, norm, c["norm"]).ratio() >= DEDUP_THRESHOLD:
                    dup_of = c["id"]; break
            sub = {"submission_id": sid, "issue_id": f"{self.node}:ISS-001", "node_id": self.node,
                   "author_id": r["persona_id"], "type": r.get("kind", "concern"), "content": r["text"],
                   "created_at": self.ts, "source_system": r.get("source_system"), "source_ref": None,
                   "embedding": None, "duplicate_of": dup_of, "metadata": None}
            subs.append(sub)
            if dup_of is None:
                kept.append({"id": sid, "norm": norm})
        issue = self._validate("Issue", {
            "issue_id": f"{self.node}:ISS-001", "node_id": self.node, "governance_scope": "node",
            "coop_id": None, "escalated_from": None, "title": self.s["issue"]["title"],
            "description": self.s["issue"]["description"], "created_at": self.ts, "last_updated_at": self.ts,
            "status": "intake", "priority": "routine", "tags": None,
            "submission_ids": [x["submission_id"] for x in subs], "federation_hash": None})
        self.issue, self.submissions = issue, subs
        sub_errs = []
        for sub in subs:
            sub_errs += schema.validate("Submission", sub)
        self.validations.append({"kind": "Submission", "ok": not sub_errs, "errors": sub_errs[:5]})
        dups = [s for s in subs if s["duplicate_of"]]
        self.log("M1", "Issue Capture & Signal Intake",
                 f"{len(raw)} raw submissions in; {len(kept)} canonical after dedup ({len(dups)} merged via "
                 "cosine-similarity stand-in). Duplicates linked, not discarded.",
                 issue=issue, submissions=subs, duplicates=dups)
        return self

    # ----------------------------------------------------------------- M2
    def m2_structure(self):
        canon = [s for s in self.submissions if not s["duplicate_of"] and s["type"] != "evidence"]
        clusters, themes = {}, []
        for s in canon:
            txt = s["content"].lower()
            theme = next((d for d, kws in _THEME_KW.items() if any(k in txt for k in kws)), "other")
            clusters.setdefault(theme, []).append(s["submission_id"])
        view = {"issue_id": self.issue["issue_id"],
                "clusters": [{"label": d, "theme": d, "submission_ids": ids} for d, ids in clusters.items()],
                "themes": list(clusters.keys()),
                "metadata": {"method": "semantic-clustering stand-in (LLM-assist plugs in here)",
                             "evidence_excluded": True}}
        self.structured = view
        self.log("M2", "Issue Structuring & Framing",
                 f"{len(canon)} canonical submissions grouped into {len(clusters)} themes: "
                 f"{', '.join(clusters)}. Evidence is a pass-through to M3 (not clustered).", view=view)
        return self

    # ----------------------------------------------------------------- M3
    def m3_context(self):
        c = self.s["context"]
        ctx = {"issue_id": self.issue["issue_id"], "historical": c.get("historical"),
               "ecological": c.get("ecological"), "resources": c.get("resources"),
               "labor": c.get("labor"), "dependencies": c.get("dependencies"),
               "evidence_index": c.get("evidence", []),
               "metadata": {"source": "retrieved from OAD/COS/ITC/FRS (LLM-assisted retrieval plugs in here)"}}
        self.context = ctx
        self.log("M3", "Knowledge Integration & Context Engine",
                 "Built the factual landscape around the issue from the other four systems.", context=ctx)
        return self

    # ----------------------------------------------------------------- auto-generation step (once)
    def _build_scenarios(self):
        self.scenarios = []
        for pr in self.s["proposals"]:
            self.scenarios.append({"scenario_id": f"{self.node}:{pr['id']}", "issue_id": self.issue["issue_id"],
                "node_id": self.node, "label": pr["label"], "_base_label": pr["label"],
                "parameters": pr["parameters"], "indicators": dict(pr["impacts"]), "origin": pr["origin"],
                "parent_scenario_id": None, "revision_count": 0, "created_at": self.ts,
                "_summary": pr["summary"], "_pid": pr["id"]})

    def _proposals_view(self):
        """Current scenarios as the {id,label,summary,impacts} view the LLM/offline model deliberates on."""
        return [{"id": sc["_pid"], "label": sc["label"], "summary": sc["_summary"], "impacts": sc["indicators"]}
                for sc in self.scenarios]

    def _sc(self, pid):
        return next(sc for sc in self.scenarios if sc["_pid"] == pid)

    @staticmethod
    def _tag(base, rnd):
        return base if rnd == 1 else f"{base}·r{rnd}"

    # ----------------------------------------------------------------- M4 (each round)
    def m4_constraints(self, rnd=1):
        reports = {}
        for sc in self.scenarios:
            violations, required = [], []
            for con in self.s["constraints"]:
                val = sc["indicators"].get(con["dimension"], 0.0)
                if con["op"] == "min" and val < con["threshold"]:
                    (required if con.get("soft") else violations).append(
                        {"constraint": con["name"], "kind": con["kind"], "dimension": con["dimension"],
                         "value": round(val, 2), "threshold": con["threshold"], "message": con["message"]})
            reports[sc["_pid"]] = {"scenario_id": sc["scenario_id"], "passed": not violations,
                "violations": violations, "required_modifications": required}
        self.constraint_reports = reports
        self.eligible = {pid for pid, r in reports.items() if r["passed"]}
        auto = [s for s in self.scenarios if s["origin"] == "auto_generated"]
        extra = (f" ({len(auto)} auto-generated between Modules 3 and 4)" if rnd == 1 else " (revised set)")
        self.log(self._tag("M4", rnd), "Constraint Checking" + (" (+ auto-generated scenarios)" if rnd == 1 else " (re-check)"),
                 f"{len(self.scenarios)} candidate scenarios{extra}. {len(self.eligible)}/{len(self.scenarios)} "
                 "pass hard constraints.", scenarios=self.scenarios, reports=reports,
                 auto_generated=[a['_pid'] for a in auto], round=rnd)
        return self

    # ----------------------------------------------------------------- M5 (each round)
    def m5_deliberation(self, rnd=1):
        delib = self.llm.deliberate(self.s, self.personas, self._proposals_view())
        votes, objections = [], []
        for d in delib:
            sc = self._sc(d["proposal_id"]) if any(s["_pid"] == d["proposal_id"] for s in self.scenarios) else None
            if not sc:
                continue
            votes.append({"vote_id": f"{self.node}:V-{d['persona_id'].split(':')[1]}-{d['proposal_id']}-r{rnd}",
                "issue_id": self.issue["issue_id"], "scenario_id": sc["scenario_id"], "node_id": self.node,
                "participant_id": d["persona_id"], "support": d["support"], "weight": 1.0,
                "comment": d["comment"], "conditions": [], "created_at": self.ts})
            if d.get("objection"):
                o = d["objection"]
                objections.append({"objection_id": f"{self.node}:OBJ-r{rnd}-{len(objections)+1:03d}",
                    "issue_id": self.issue["issue_id"], "scenario_id": sc["scenario_id"], "node_id": self.node,
                    "participant_id": d["persona_id"], "severity": o["severity"], "scope": o["scope"],
                    "description": o["description"], "dimension": o.get("dimension"),
                    "created_at": self.ts, "resolved": False,
                    "_value_conflict": o.get("is_value_conflict", False), "_pid": d["proposal_id"]})
        self.votes, self.objections = votes, objections
        self.log(self._tag("M5", rnd), "Participatory Deliberation Workspace"
                 + (f" — revision round {rnd}" if rnd > 1 else ""),
                 f"{len(self.personas)} participants weighed {len(self.scenarios)} scenarios: "
                 f"{len(votes)} preference gradients, {len(objections)} principled objections.",
                 votes=votes, objections=objections, personas=self.personas, round=rnd)
        return self

    # ----------------------------------------------------------------- M6 + orchestrator (each round)
    def m6_consensus(self, rnd=1):
        results = {}
        for sc in self.scenarios:
            pid = sc["_pid"]
            vs = [v for v in self.votes if v["scenario_id"] == sc["scenario_id"]]
            cs = round(sum(GRADIENT[v["support"]] * v["weight"] for v in vs) / sum(v["weight"] for v in vs), 4) if vs else 0.0
            objs = [o for o in self.objections if o["_pid"] == pid]
            oi = round(max((o["severity"] * o["scope"] for o in objs), default=0.0), 4)
            value_conflict = any(o["_value_conflict"] for o in objs if o["severity"] * o["scope"] >= BLOCK_THRESHOLD)
            blocking = oi >= BLOCK_THRESHOLD
            if pid not in self.eligible:
                directive, esc = "revise", None
            elif cs >= CONSENSUS_THRESHOLD and not blocking:
                directive, esc = "approve", None
            elif cs >= CONSENSUS_THRESHOLD and blocking and value_conflict:
                directive, esc = "escalate_to_module9", "unresolved_value_conflict"
            else:
                directive, esc = "revise", None
            results[pid] = {"issue_id": self.issue["issue_id"], "scenario_id": sc["scenario_id"], "pid": pid,
                "node_id": self.node, "consensus_score": cs, "objection_index": oi, "directive": directive,
                "escalation_reason": esc, "value_conflict_present": value_conflict, "blocking_objection": blocking,
                "required_conditions": [] if directive == "approve" else
                    (["resolve blocking objection / heritage review"] if blocking else
                     ["raise consensus above threshold"] if pid in self.eligible else
                     ["address failed hard constraint before re-submission"]),
                "synthesized_by": f"{self.node}:facilitator", "created_at": self.ts}
        self.results = results
        approved = [r for r in results.values() if r["directive"] == "approve"]
        winner = max(approved, key=lambda r: (r["consensus_score"], -r["objection_index"])) if approved else None
        escalated = [r for r in results.values() if r["directive"] == "escalate_to_module9"]
        self.winner, self.escalated = winner, escalated
        self.log(self._tag("M6", rnd), "Weighted Consensus + Orchestrator Selection"
                 + (f" — round {rnd}" if rnd > 1 else ""),
                 f"Per-scenario consensus & objection (gradient 1/.6/0/-.4/-1; thresholds "
                 f"{CONSENSUS_THRESHOLD}/{BLOCK_THRESHOLD}). "
                 + (f"Winner: {winner['scenario_id']} (consensus {winner['consensus_score']}, objection "
                    f"{winner['objection_index']})." if winner else
                    f"No scenario approved this round{' — escalating (value conflict)' if escalated else ''}."),
                 results=results, winner=winner, escalated=escalated,
                 thresholds={"consensus": CONSENSUS_THRESHOLD, "block": BLOCK_THRESHOLD}, gradient=GRADIENT, round=rnd)
        return self

    # ----------------------------------------------------------------- revision between rounds
    def _refine(self, rnd):
        """Facilitator applies a scenario's required_modifications: ease its worst-objected/most-negative
        dimension. Mutates the lead revisable scenario in place (lineage preserved). Deterministic."""
        revisable = [r for r in self.results.values() if r["directive"] == "revise"]
        if not revisable:
            return
        lead = max(revisable, key=lambda r: r["consensus_score"])
        sc = self._sc(lead["pid"])
        objs = [o for o in self.objections if o["_pid"] == sc["_pid"]]
        if objs:
            worst = max(objs, key=lambda o: o["severity"] * o["scope"])
            dim = worst.get("dimension") if worst.get("dimension") in DIMENSIONS else None
        else:
            dim = None
        if dim is None:
            dim = min(DIMENSIONS, key=lambda d: sc["indicators"].get(d, 0))
        old = round(sc["indicators"].get(dim, 0.0), 2)
        new = round(min(0.2, old + 0.5), 2)  # mitigate the harm; never overshoot into strong positive
        sc["indicators"][dim] = new
        sc["parent_scenario_id"] = sc["scenario_id"]
        sc["revision_count"] += 1
        sc["scenario_id"] = f"{self.node}:{sc['_pid']}.r{rnd + 1}"
        sc["origin"] = "deliberation"
        sc["label"] = f"{sc['_base_label']} — revised (eased {dim})"
        self.log(self._tag("↻ REV", rnd), f"Revision: round {rnd} → {rnd + 1}",
                 f"Facilitator refined {lead['pid']} ('{sc['_base_label']}') to address its blocking concern: "
                 f"eased {dim} from {old:+} to {new:+}. New version {sc['scenario_id']} re-enters M4→M5→M6.",
                 refined=sc["_pid"], dimension=dim, old=old, new=new,
                 scenario_id=sc["scenario_id"], parent=sc["parent_scenario_id"], round=rnd)

    def _revision_failure(self, rnd):
        """Persistent disagreement across MAX_ROUNDS → escalate to Module 9 (the spec's first trigger)."""
        revisable = [r for r in self.results.values() if r["directive"] == "revise"]
        lead = max(revisable, key=lambda r: r["consensus_score"]) if revisable else None
        if lead:
            lead["directive"] = "escalate_to_module9"
            lead["escalation_reason"] = "revision_failure"
            self.escalated = [lead]
        self.winner = None
        self.log("↻ CAP", "Revision cap reached",
                 f"After {MAX_ROUNDS} revision rounds no scenario converged to consensus. Per the spec's "
                 "persistent-disagreement trigger, the issue escalates to Module 9 (Syntegrity) rather than "
                 "cycling indefinitely. (Hard cap prevents an infinite loop.)", round=rnd)

    # ----------------------------------------------------------------- M7
    def m7_record(self):
        if not self.winner:
            self.decision = None
            kind = None
            if self.escalated:
                reasons = {r.get("escalation_reason") for r in self.escalated}
                ids = ", ".join(r["scenario_id"] for r in self.escalated)
                if "revision_failure" in reasons:
                    kind = "revision_failure"
                    msg = (f"No scenario converged after {MAX_ROUNDS} revision rounds. {ids} is escalated to "
                           "Module 9 (Syntegrity) under the persistent-disagreement trigger — human "
                           "deliberation, not indefinite cycling. No automated decision recorded.")
                else:
                    kind = "value_conflict"
                    msg = (f"{ids} reached consensus but carries an unresolved value-conflict objection → "
                           "routed to Module 9 (Syntegrity). The system does not override a principled value "
                           "conflict; no automated decision recorded.")
            else:
                msg = ("No scenario met the consensus threshold and no value conflict to escalate; the set "
                       "returns to Module 5 for revision.")
            self.issue["status"] = "deliberation"
            self.log("M7", "Decision Recording, Versioning & Accountability", msg, decision=None,
                     escalated=self.escalated, no_winner_reason=("module9" if self.escalated else "revise"),
                     escalation_kind=kind)
            return self
        win = self.winner
        sc = self._sc(win["pid"])
        esc_note = ""
        if self.escalated:
            esc_note = (f" Scenario(s) {', '.join(r['scenario_id'] for r in self.escalated)} were escalated to "
                        "Module 9 rather than overridden.")
        rev_note = (f" (selected option was refined over {sc['revision_count']} revision round(s))"
                    if sc["revision_count"] else "")
        rationale = (f"Approved {win['scenario_id']} ('{sc['_base_label']}'){rev_note} with consensus "
                     f"{win['consensus_score']} and objection index {win['objection_index']}.{esc_note}")
        rec = {"decision_id": f"{self.node}:DR-001", "issue_id": self.issue["issue_id"],
               "scenario_id": win["scenario_id"], "node_id": self.node, "governance_scope": "node",
               "coop_id": None, "originating_node": None, "status": "approved",
               "consensus_score": win["consensus_score"], "objection_index": win["objection_index"],
               "decided_at": self.ts, "decided_by": [f"{self.node}:facilitator"],
               "considered_scenario_ids": [s["scenario_id"] for s in self.scenarios],
               "consensus_results": [{"scenario_id": r["scenario_id"], "consensus_score": r["consensus_score"],
                                      "objection_index": r["objection_index"], "directive": r["directive"]}
                                     for r in self.results.values()],
               "escalation_reason": None, "supersedes_decision_id": None, "rationale": rationale,
               "rationale_hash": schema.sha256(rationale),
               "review_triggers": ["frs_risk_signal", "new_evidence"],
               "frs_monitor_keys": [k.replace(" ", "-") for k in self.s.get("frs_monitors", ["outcome-metric-1"])],
               "prev_hash": "GENESIS", "entry_hash": None, "created_at": self.ts}
        rec["entry_hash"] = schema.sha256(schema.canon({k: v for k, v in rec.items() if k != "entry_hash"}) + rec["prev_hash"])
        self.decision = self._validate("DecisionRecord", rec)
        self.issue["status"] = "decided"
        self.log("M7", "Decision Recording, Versioning & Accountability",
                 "Append-only decision record written with real rationale + entry hashes (chain start GENESIS)."
                 + (rev_note and " " + rev_note.strip()), decision=rec)
        return self

    # ----------------------------------------------------------------- M8
    def m8_dispatch(self):
        if not self.decision:
            self.log("M8", "Implementation Dispatch Interface", "No decision to dispatch.", dispatch=None)
            return self
        win = self.winner
        sc = self._sc(win["pid"])
        monitors = [k.replace(" ", "-") for k in self.s.get("frs_monitors", ["outcome-metric-1"])]
        pkt = {"packet_id": f"{self.node}:DSP-001", "decision_id": self.decision["decision_id"],
               "issue_id": self.issue["issue_id"], "scenario_id": win["scenario_id"],
               "node_id": self.node, "created_at": self.ts, "target_systems": ["OAD", "COS", "FRS"],
               "oad_flags": {"design_task": f"Detailed design for: {sc['_base_label']}",
                             "preserve_structure": sc["parameters"].get("preserves_structure")},
               "tasks": [{"assignee": "implementing-coop", "action": sc["_summary"]}],
               "materials": {"new_material": sc["parameters"].get("new_material")},
               "schedule": {"window": "next planning window"}, "itc_adjustments": None,
               "frs_monitors": monitors, "acknowledgement_refs": None,
               "metadata": {"consensus_score": win["consensus_score"], "generated_at": self.ts}}
        self.dispatch = self._validate("DispatchPacket", pkt)
        self.log("M8", "Implementation Dispatch Interface",
                 f"Decision dispatched to {', '.join(pkt['target_systems'])}; FRS set to monitor "
                 f"{', '.join(monitors)}. The loop is primed to close.", dispatch=pkt)
        return self

    def run(self):
        self.m1_intake().m2_structure().m3_context()
        self._build_scenarios()
        self.rounds = 0
        rnd = 1
        while True:
            self.rounds = rnd
            self.m4_constraints(rnd).m5_deliberation(rnd).m6_consensus(rnd)
            if self.winner or self.escalated:
                break
            if rnd >= MAX_ROUNDS:
                self._revision_failure(rnd)
                break
            self._refine(rnd)
            rnd += 1
        self.m7_record().m8_dispatch()
        return self
