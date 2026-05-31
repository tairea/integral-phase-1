#!/usr/bin/env python3
"""
DR-001 — build the full CDS pipeline as schema-valid instances and validate them
against ../../schemas/. Dogfoods the CDS schema by recording the schema exercise's
own ratification process (OQ-12). Real sha256 hashes; consensus math computed, not asserted.

This is a CANDIDATE / worked instance. Illustrative working-group votes are flagged
`illustrative: true`. The substantive schema ratification (the 16 OQs) remains OPEN; this
decision only adopts the candidate set as the review BASELINE and opens that review.
"""
import json, hashlib, glob, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "instances")
os.makedirs(OUT, exist_ok=True)

NODE = "dev"                 # the development project, acting as the node
SCOPE = "node"               # a project-level development-process decision (§6.3)
TS = "2026-05-30T12:00:00Z"  # fixed timestamp (passed in, not Date.now())

# --- canonical support-gradient map (Ep.59 frame 65; a ConsensusPolicy parameter) ---
GRAD = {"strong_support": 1.0, "support": 0.6, "neutral": 0.0, "concern": -0.4, "block": -1.0}
CONSENSUS_THRESHOLD = 0.72
BLOCK_THRESHOLD = 0.30

def sha256(s): return "sha256:" + hashlib.sha256(s.encode("utf-8")).hexdigest()
def canon(obj): return json.dumps(obj, sort_keys=True, separators=(",", ":"))

# ---------------------------------------------------------------- Issue (Module 1)
issue = {
    "issue_id": "dev:ISS-001", "node_id": NODE, "governance_scope": SCOPE, "coop_id": None,
    "escalated_from": None,
    "title": "Adopt the Phase-1 candidate schema set as working baseline and open ratification",
    "description": ("The Phase-1 schema design exercise (DEVGUIDE §5.1) has produced a complete "
        "candidate schema for all five systems with 16 open questions. Decide whether to adopt it "
        "as the working baseline and open the OQs for community ratification, gating Phase 2 on the "
        "two blocking questions (OQ-01 notation, OQ-04 decay sync)."),
    "created_at": TS, "last_updated_at": TS, "status": "decided", "priority": "routine",
    "tags": None, "submission_ids": ["dev:SUB-001", "dev:SUB-002"], "federation_hash": None,
}

# ---------------------------------------------------------------- Submissions (Module 1)
submissions = [
    {"submission_id": "dev:SUB-001", "issue_id": "dev:ISS-001", "node_id": NODE,
     "author_id": "dev:schema-exercise", "type": "proposal", "created_at": TS,
     "content": ("Adopt candidate schema set v0.1 as the working baseline; open all 16 OQs for "
                 "ratification; gate Phase 2 on OQ-01 + OQ-04."),
     "source_system": None, "source_ref": None, "embedding": None, "duplicate_of": None,
     "metadata": None},
    {"submission_id": "dev:SUB-002", "issue_id": "dev:ISS-001", "node_id": NODE,
     "author_id": "dev:validation", "type": "evidence", "created_at": TS,
     "content": ("All boundary-crossing JSON Schemas meta-validate; cross-$refs resolve; "
                 "non-transferability and node-id:participant-id enforced; 'regional' rejected as a "
                 "governance_scope. Evidence is a pass-through to Module 3, not clustered (Ep.59)."),
     "source_system": None, "source_ref": None, "embedding": None, "duplicate_of": None,
     "metadata": None},
]

# ---------------------------------------------------------------- Scenarios (Module 1/5)
scenarios = [
    {"scenario_id": "dev:SCN-001", "issue_id": "dev:ISS-001", "node_id": NODE,
     "label": "Adopt as baseline + open ratification",
     "parameters": {"adopt_as": "working_baseline", "open_oqs": "OQ-01..OQ-16",
                    "phase2_gate": ["OQ-01", "OQ-04"]},
     "indicators": None, "origin": "submission", "parent_scenario_id": None,
     "revision_count": 0, "created_at": TS},
    {"scenario_id": "dev:SCN-002", "issue_id": "dev:ISS-001", "node_id": NODE,
     "label": "Ratify the schema as FINAL now",
     "parameters": {"adopt_as": "final", "open_oqs": "none"},
     "indicators": None, "origin": "deliberation", "parent_scenario_id": None,
     "revision_count": 0, "created_at": TS},
    {"scenario_id": "dev:SCN-003", "issue_id": "dev:ISS-001", "node_id": NODE,
     "label": "Defer: keep iterating privately, no baseline yet",
     "parameters": {"adopt_as": "none"},
     "indicators": None, "origin": "deliberation", "parent_scenario_id": None,
     "revision_count": 0, "created_at": TS},
]

# ---------------------------------------------------------------- Votes (Module 5) — ILLUSTRATIVE
# Synthetic working-group stand-ins; flagged illustrative. They stand in for the WG that will
# actually deliberate once applications are processed (Ep.59). Weights all 1.0 (no expertise gate).
def V(p, scn, sup): return {"vote_id": f"dev:V-{p}-{scn}", "issue_id": "dev:ISS-001",
    "scenario_id": scn, "node_id": NODE, "participant_id": f"dev:wg-{p}", "support": sup,
    "weight": 1.0, "comment": "", "conditions": [], "created_at": TS}
votes = {"illustrative": True, "votes": (
    [V(f"{i:02d}", "dev:SCN-001", s) for i, s in enumerate(
        ["strong_support","strong_support","strong_support","strong_support","support","support"], 1)] +
    [V(f"{i:02d}", "dev:SCN-002", s) for i, s in enumerate(
        ["strong_support","strong_support","strong_support","support","support","concern"], 1)] +
    [V(f"{i:02d}", "dev:SCN-003", s) for i, s in enumerate(
        ["support","neutral","neutral","concern","concern","concern"], 1)]
)}

# ---------------------------------------------------------------- Objections (Module 5)
objections = [
    {"objection_id": "dev:OBJ-001", "issue_id": "dev:ISS-001", "scenario_id": "dev:SCN-002",
     "node_id": NODE, "participant_id": "dev:wg-06", "severity": 0.8, "scope": 0.7,
     "description": ("Ratifying as FINAL while OQ-01 (notation/source-of-truth) and OQ-04 (decay "
        "policy/snapshot sync) are unresolved risks exactly the schema-migration / historical-record "
        "invalidation §4.1 warns is unfixable-by-patch. Premature."),
     "created_at": TS, "resolved": False},
    {"objection_id": "dev:OBJ-002", "issue_id": "dev:ISS-001", "scenario_id": "dev:SCN-001",
     "node_id": NODE, "participant_id": "dev:wg-05", "severity": 0.3, "scope": 0.3,
     "description": "Minor: 'baseline' could be misread as 'final'; the decision text must be explicit.",
     "created_at": TS, "resolved": True},
]

# ---------------------------------------------------------------- Module 6 consensus math
def consensus_score(scn):
    vs = [v for v in votes["votes"] if v["scenario_id"] == scn]
    num = sum(GRAD[v["support"]] * v["weight"] for v in vs)
    den = sum(v["weight"] for v in vs)
    return round(num / den, 4)

def objection_index(scn):
    objs = [o for o in objections if o["scenario_id"] == scn]
    return round(max((o["severity"] * o["scope"] for o in objs), default=0.0), 4)

def directive(cs, oi):
    if cs >= CONSENSUS_THRESHOLD and oi < BLOCK_THRESHOLD: return "approve"
    return "revise"  # below consensus OR blocked → back to Module 5

consensus_results = []
for scn in ["dev:SCN-001", "dev:SCN-002", "dev:SCN-003"]:
    cs, oi = consensus_score(scn), objection_index(scn)
    consensus_results.append({"issue_id": "dev:ISS-001", "scenario_id": scn, "node_id": NODE,
        "consensus_score": cs, "objection_index": oi, "directive": directive(cs, oi),
        "escalation_reason": None,
        "required_conditions": ([] if directive(cs, oi) == "approve" else ["Resolve blocking objection / raise consensus"]),
        "synthesized_by": "dev:facilitator-01", "created_at": TS})

# ---------------------------------------------------------------- Orchestrator selection (R6)
approved = [r for r in consensus_results if r["directive"] == "approve"]
assert len(approved) == 1 and approved[0]["scenario_id"] == "dev:SCN-001", "expected SCN-001 to win"
winner = approved[0]

# ---------------------------------------------------------------- DecisionRecord (Module 7)
rationale = ("Adopt candidate schema set v0.1 as the working baseline and open all 16 open questions "
    "for community ratification. Gate Phase 2 on OQ-01 (notation/source-of-truth) and OQ-04 (decay "
    "policy/snapshot sync). 'Ratify as final now' (SCN-002) was blocked by a high-severity objection: "
    "ratifying with OQ-01/OQ-04 open risks the unfixable schema-migration disruption §4.1 describes. "
    "'Defer entirely' (SCN-003) failed consensus. This decision is a development-process decision "
    "(§6.3 provisional precursor to CDS); it adopts a review baseline, it does NOT finalize the schema.")
decision = {
    "decision_id": "dev:DR-001", "issue_id": "dev:ISS-001", "scenario_id": "dev:SCN-001",
    "node_id": NODE, "governance_scope": SCOPE, "coop_id": None, "originating_node": None,
    "status": "approved", "consensus_score": winner["consensus_score"],
    "objection_index": winner["objection_index"], "decided_at": TS,
    "decided_by": ["dev:facilitator-01"],
    "considered_scenario_ids": ["dev:SCN-001", "dev:SCN-002", "dev:SCN-003"],
    "consensus_results": consensus_results, "escalation_reason": None,
    "supersedes_decision_id": None, "rationale": rationale, "rationale_hash": sha256(rationale),
    "review_triggers": ["new_evidence", "changed_conditions"],
    "frs_monitor_keys": ["oq-01-closed", "oq-04-closed", "phase2-gate"],
    "prev_hash": "GENESIS", "entry_hash": None, "created_at": TS,
}
# entry_hash over the canonical record (excluding entry_hash) || prev_hash — append-only chain start
decision["entry_hash"] = sha256(canon({k: v for k, v in decision.items() if k != "entry_hash"}) + decision["prev_hash"])

# ---------------------------------------------------------------- DispatchPacket (Module 8)
dispatch = {
    "packet_id": "dev:DSP-001", "decision_id": "dev:DR-001", "issue_id": "dev:ISS-001",
    "scenario_id": "dev:SCN-001", "node_id": NODE, "created_at": TS,
    "target_systems": ["CDS"],   # a governance / development-process dispatch
    "oad_flags": None,
    "tasks": [
        {"assignee": "specifications-wg", "action": "open OQ ratification sessions OQ-01..OQ-16"},
        {"assignee": "per-system-wgs", "action": "review specs 01-05 + their relevant OQs"},
        {"assignee": "joint-#specifications", "action": "resolve cross-cutting OQ-01/04/07/08/16"},
    ],
    "materials": None, "schedule": None, "itc_adjustments": None,
    "frs_monitors": ["Phase-2 gate: OQ-01 AND OQ-04 must close before Phase 2 begins"],
    "acknowledgement_refs": None,
    "metadata": {"consensus_score": winner["consensus_score"], "generated_at": TS,
                 "note": "development-process decision; substantive schema ratification remains open"},
}

# ---------------------------------------------------------------- write instances
files = {"issue.json": issue, "submissions.json": submissions, "scenarios.json": scenarios,
         "votes.json": votes, "objections.json": objections,
         "consensus-results.json": consensus_results, "decision-record.json": decision,
         "dispatch-packet.json": dispatch}
for name, obj in files.items():
    json.dump(obj, open(os.path.join(OUT, name), "w"), indent=2)

# ---------------------------------------------------------------- validate against schemas/
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
docs = {}
for f in glob.glob(os.path.join(ROOT, "schemas", "**", "*.json"), recursive=True):
    d = json.load(open(f)); docs[d["$id"]] = d
reg = Registry()
for sid, d in docs.items(): reg = reg.with_resource(sid, Resource.from_contents(d))

S = "https://integral.candidate/schemas"
checks = [
    (issue, f"{S}/cds/issue.json", "Issue"),
    (decision, f"{S}/cds/decision-record.json", "DecisionRecord"),
    (dispatch, f"{S}/cds/dispatch-packet.json", "DispatchPacket"),
]
errs = 0
for inst, sid, label in checks:
    e = list(Draft202012Validator(docs[sid], registry=reg).iter_errors(inst))
    print(("PASS " if not e else "FAIL ") + label, "" if not e else [x.message for x in e[:4]])
    errs += len(e)

print("\nConsensus results:")
for r in consensus_results:
    print(f"  {r['scenario_id']}: consensus={r['consensus_score']:+.4f} "
          f"objection={r['objection_index']:.2f} -> {r['directive']}")
print(f"\nWinner: {winner['scenario_id']} | DR-001 status={decision['status']} "
      f"consensus={decision['consensus_score']} objection={decision['objection_index']}")
print(f"rationale_hash={decision['rationale_hash'][:23]}...  entry_hash={decision['entry_hash'][:23]}...")
sys.exit(1 if errs else 0)
