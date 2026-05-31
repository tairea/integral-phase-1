"""Simulated node participants. Each persona has a *voice* (used to prompt the live LLM) and
*concern weights* over decision dimensions (used by the offline model to produce deterministic,
explainable reactions). Both backends produce the same structured inputs the pipeline consumes.

Dimensions a proposal can affect (each scenario declares its impact on these, -1..+1):
  resilience — does it robustly solve the problem
  ecology    — ecological cost/benefit
  cost       — labor + material burden (negative = costly)
  heritage   — sentimental / cultural / historical value preserved (+) or lost (-)
  equity     — fairness & access (e.g. for elderly/disabled)
  speed      — how quickly relief arrives
"""

DIMENSIONS = ["resilience", "ecology", "cost", "heritage", "equity", "speed"]

PERSONAS = [
    {
        "id": "stillwater:maya",
        "name": "Maya Okonkwo",
        "role": "Fabrication & structures (vertical-farm co-op)",
        "voice": ("A pragmatic structural fabricator. Cares first that the fix actually holds up "
                  "under real storms; impatient with options that don't durably solve the problem. "
                  "Speaks plainly, in engineering terms."),
        "weights": {"resilience": 0.9, "ecology": 0.3, "cost": 0.5, "heritage": 0.1, "equity": 0.3, "speed": 0.6},
    },
    {
        "id": "stillwater:tomas",
        "name": "Tomas Reyes",
        "role": "Ecological steward",
        "voice": ("An ecological steward who weighs embodied carbon, materials, and watershed impact "
                  "above convenience. Wary of new-build solutions that import high-impact materials."),
        "weights": {"resilience": 0.3, "ecology": 0.9, "cost": 0.2, "heritage": 0.4, "equity": 0.5, "speed": 0.2},
    },
    {
        "id": "stillwater:beatrice",
        "name": "Beatrice Hale",
        "role": "Elder / heritage keeper",
        "voice": ("A long-time elder of the node. Her grandfather helped build the original timber "
                  "footbridge 60 years ago; it carries deep communal memory. Soft-spoken but firm "
                  "that what holds a community together is not only function."),
        "weights": {"resilience": 0.3, "ecology": 0.3, "cost": 0.2, "heritage": 0.95, "equity": 0.4, "speed": 0.1},
    },
    {
        "id": "stillwater:devon",
        "name": "Devon Park",
        "role": "Access & logistics coordinator",
        "voice": ("Coordinates daily access. Focused on whether every member — including elderly and "
                  "wheelchair users — can still reach the farm, and how fast relief comes. Allergic to "
                  "solutions that quietly strand people."),
        "weights": {"resilience": 0.5, "ecology": 0.3, "cost": 0.4, "heritage": 0.2, "equity": 0.8, "speed": 0.7},
    },
    {
        "id": "stillwater:sam",
        "name": "Sam Whitefeather",
        "role": "Labor & materials steward (ITC-minded)",
        "voice": ("Tracks the labor-hours and material burden every option places on the node, and "
                  "who carries it. Prefers minimal, repairable interventions; skeptical of big builds."),
        "weights": {"resilience": 0.5, "ecology": 0.4, "cost": 0.8, "heritage": 0.2, "equity": 0.5, "speed": 0.3},
    },
]

NODE_ID = "stillwater"


def by_id(pid):
    return next(p for p in PERSONAS if p["id"] == pid)
