"""Participant-input backends. Both produce the SAME structured shapes the pipeline consumes:

  generate_concerns(scenario, personas) -> [ {persona_id, kind, text} ]
  deliberate(scenario, personas, proposals) -> [ {persona_id, proposal_id, support, comment, objection?} ]

LiveLLM   — Anthropic Messages API; roleplays each persona; prompt-cached shared context.
ModelLLM  — offline, deterministic: derives each persona's reaction from the dot product of their
            concern-weights with each proposal's declared dimension impacts. Reproducible for review.
"""
import json, os
from .personas import DIMENSIONS

SUPPORT_LEVELS = ["strong_support", "support", "neutral", "concern", "block"]


# --------------------------------------------------------------------------- offline model
class ModelLLM:
    backend = "offline-model"

    # per-dimension first-person concern templates (model-driven, scenario-agnostic)
    _CONCERN = {
        "resilience": "Every storm the crossing fails and the crew is cut off — we need a fix that actually holds.",
        "ecology": "Mill Creek is salmon-bearing; whatever we do can't disturb the stream or import high-carbon material.",
        "cost": "We have ~140 labor-hours this window. A heavy build eats all of it — who carries that load?",
        "heritage": "That bridge was raised by our own hands sixty years ago. It is not just lumber to some of us.",
        "equity": "When it floods, our elderly and wheelchair members can't reach the farm at all. People get stranded.",
        "speed": "People need relief now, not after a whole season of construction.",
    }
    # near-duplicate "cut off" line emitted by resilience-leaning members → exercises M1 dedup
    _CUTOFF = {
        "stillwater:maya": "When Mill Creek floods, the farm crew gets cut off and produce can't move.",
        "stillwater:devon": "When the creek floods, the farm crew is cut off and deliveries can't move.",
        "stillwater:sam": "When Mill Creek floods the farm crew is cut off and produce can't move.",
    }

    def generate_concerns(self, scenario, personas):
        # scenario-supplied intake takes precedence (self-contained, realistic per scenario)
        if scenario.get("intake"):
            return [{"persona_id": x.get("author"), "kind": x.get("kind", "concern"),
                     "text": x["text"], "source_system": x.get("source_system")}
                    for x in scenario["intake"]]
        subs = []  # generic fallback (per-persona, derived from top concern dimension)
        for p in personas:
            top = max(DIMENSIONS, key=lambda d: p["weights"][d])
            subs.append({"persona_id": p["id"], "kind": "concern", "text": self._CONCERN[top]})
            if p["id"] in self._CUTOFF:  # second, near-duplicate submission
                subs.append({"persona_id": p["id"], "kind": "concern", "text": self._CUTOFF[p["id"]]})
        return subs

    @staticmethod
    def _alignment(weights, impacts):
        num = sum(weights[d] * impacts.get(d, 0.0) for d in DIMENSIONS)
        den = sum(weights[d] for d in DIMENSIONS) * 0.5  # gain so genuine alignment can reach strong
        a = num / den if den else 0.0
        return max(-1.0, min(1.0, a))

    @staticmethod
    def _bucket(a):
        if a >= 0.5: return "strong_support"
        if a >= 0.15: return "support"
        if a > -0.15: return "neutral"
        if a > -0.5: return "concern"
        return "block"

    def _comment(self, persona, proposal, a):
        impacts = proposal["impacts"]
        drivers = sorted(DIMENSIONS, key=lambda d: persona["weights"][d] * impacts.get(d, 0), reverse=True)
        pos = [d for d in drivers if persona["weights"][d] * impacts.get(d, 0) > 0.08][:2]
        neg = [d for d in reversed(drivers) if persona["weights"][d] * impacts.get(d, 0) < -0.08][:2]
        bits = []
        if pos: bits.append("it serves " + " and ".join(pos))
        if neg: bits.append("but it costs us on " + " and ".join(neg))
        stance = {"strong_support": "Strongly behind this", "support": "I can support this",
                  "neutral": "I'm on the fence", "concern": "I have real concerns here",
                  "block": "I can't accept this"}[self._bucket(a)]
        return f"{stance}: {'; '.join(bits) if bits else 'no strong pull either way'}."

    def deliberate(self, scenario, personas, proposals):
        scope = scenario["dimension_scope"]
        out = []
        for p in personas:
            for pr in proposals:
                a = self._alignment(p["weights"], pr["impacts"])
                rec = {"persona_id": p["id"], "proposal_id": pr["id"],
                       "support": self._bucket(a), "comment": self._comment(p, pr, a), "objection": None}
                # principled objection: a dimension this persona holds dear is badly harmed
                hits = [(d, pr["impacts"].get(d, 0)) for d in DIMENSIONS
                        if p["weights"][d] >= 0.7 and pr["impacts"].get(d, 0) <= -0.5]
                if hits:
                    d, imp = min(hits, key=lambda x: x[1])  # worst-hit dimension
                    sev = round(min(1.0, p["weights"][d] * abs(imp) * 1.1), 2)
                    rec["objection"] = {
                        "dimension": d, "severity": sev, "scope": round(scope.get(d, 0.5), 2),
                        "is_value_conflict": d == "heritage",
                        "description": self._objection_text(p, pr, d)}
                out.append(rec)
        return out

    @staticmethod
    def _objection_text(persona, proposal, d):
        T = {
            "heritage": f"{proposal['label']} would destroy something of deep communal and historical "
                        "meaning. This is a value the numbers don't capture; I object on principle.",
            "ecology": f"{proposal['label']} exceeds what our watershed and ecological budget can absorb. "
                       "I object on ecological grounds.",
            "equity": f"{proposal['label']} strands our most vulnerable members; equitable access is "
                      "non-negotiable.",
            "cost": f"{proposal['label']} consumes more labor and material than the node can fairly carry "
                    "this window.",
            "resilience": f"{proposal['label']} leaves the core problem unsolved — it won't hold, and we'll "
                          "be back here next season.",
        }
        return T.get(d, f"{proposal['label']} causes serious harm on {d}.")


# --------------------------------------------------------------------------- live LLMs (shared prompts)
class _PromptLLM:
    """Shared prompt-building + robust JSON coercion. Subclasses implement _chat(system, user)->str."""

    def _context_block(self, scenario, personas):
        roster = "\n".join(f'- {p["id"]} = {p["name"]} ({p["role"]}): {p["voice"]}' for p in personas)
        return (f"You are simulating a real Integral cooperative node deliberation.\n\n"
                f"ISSUE: {scenario['issue']['title']}\n{scenario['issue']['description']}\n\n"
                f"CONTEXT: {json.dumps(scenario['context'])}\n\nPARTICIPANTS (use these exact persona_id values):\n"
                f"{roster}\n\nStay in character; reason from each participant's stated values. Be realistic, "
                "concise, specific to this issue. Output ONLY valid JSON — no prose, no markdown fences.")

    @staticmethod
    def _extract_array(text):
        s, e = text.find("["), text.rfind("]")
        if s < 0 or e < 0:
            raise ValueError("no JSON array in model output")
        return json.loads(text[s:e + 1])

    def generate_concerns(self, scenario, personas):
        ids = ", ".join(p["id"] for p in personas)
        user = (f"Each participant ({ids}) submits 1-2 short first-person concerns about this issue to the "
                "node's decision system. It is realistic for some concerns to overlap or near-duplicate. "
                'Return ONLY a JSON array of objects {"persona_id","kind":"concern" or "proposal","text"}.')
        try:
            raw = self._extract_array(self._chat(self._context_block(scenario, personas), user))
        except Exception as ex:
            print(f"[llm] generate_concerns parse failed ({ex}); using offline model for intake.")
            return ModelLLM().generate_concerns(scenario, personas)
        valid = {p["id"] for p in personas}
        out = []
        for r in raw:
            pid = r.get("persona_id")
            if pid in valid and r.get("text"):
                out.append({"persona_id": pid, "kind": r.get("kind", "concern"),
                            "text": str(r["text"]), "source_system": r.get("source_system")})
        return out or ModelLLM().generate_concerns(scenario, personas)

    def deliberate(self, scenario, personas, proposals):
        opts = "\n".join(f'  {pr["id"]} = {pr["label"]}: {pr["summary"]}' for pr in proposals)
        pids = ", ".join(p["id"] for p in personas)
        oids = ", ".join(pr["id"] for pr in proposals)
        user = (f"Options under deliberation (use these exact proposal_id values: {oids}):\n{opts}\n\n"
                f"For EACH participant ({pids}) and EACH option, give a support level and a one-sentence "
                "reasoning in that participant's voice, plus a principled objection ONLY where their core "
                "values are seriously harmed. Return ONLY a JSON array of objects "
                '{"persona_id","proposal_id","support","comment","objection"} where support is exactly one '
                f'of {SUPPORT_LEVELS}, and objection is null OR '
                '{"dimension","severity":0.0-1.0,"scope":0.0-1.0,"is_value_conflict":true/false,"description"}. '
                "Mark is_value_conflict true only for sentimental/cultural/heritage objections.")
        try:
            raw = self._extract_array(self._chat(self._context_block(scenario, personas), user))
        except Exception as ex:
            print(f"[llm] deliberate parse failed ({ex}); using offline model for deliberation.")
            return ModelLLM().deliberate(scenario, personas, proposals)
        return self._coerce_delib(raw, personas, proposals)

    @staticmethod
    def _coerce_delib(raw, personas, proposals):
        valid_p = {p["id"] for p in personas}
        valid_o = {pr["id"] for pr in proposals}
        def f01(x):
            try: return max(0.0, min(1.0, float(x)))
            except Exception: return 0.5
        out = []
        for r in raw:
            if r.get("persona_id") not in valid_p or r.get("proposal_id") not in valid_o:
                continue
            sup = r.get("support") if r.get("support") in SUPPORT_LEVELS else "neutral"
            obj = r.get("objection")
            if isinstance(obj, dict):
                obj = {"dimension": str(obj.get("dimension", "other")),
                       "severity": f01(obj.get("severity", 0.5)), "scope": f01(obj.get("scope", 0.5)),
                       "is_value_conflict": bool(obj.get("is_value_conflict", False)),
                       "description": str(obj.get("description", "")).strip() or "(no detail)"}
            else:
                obj = None
            out.append({"persona_id": r["persona_id"], "proposal_id": r["proposal_id"],
                        "support": sup, "comment": str(r.get("comment", "")).strip(), "objection": obj})
        return out


class LiveLLM(_PromptLLM):
    backend = "anthropic"

    def __init__(self, model="claude-sonnet-4-6"):
        import anthropic
        self.client = anthropic.Anthropic()
        self.model = model

    def _chat(self, system, user):
        msg = self.client.messages.create(
            model=self.model, max_tokens=4000,
            system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": user}])
        return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


class OpenRouterLLM(_PromptLLM):
    """OpenAI-compatible chat completions via OpenRouter (stdlib HTTP — no extra deps)."""
    backend = "openrouter"

    def __init__(self, model="deepseek/deepseek-v4-flash", temperature=0.6):
        self.model = model
        self.temperature = temperature
        self.key = os.environ.get("OPENROUTER_API_KEY")
        if not self.key:
            raise RuntimeError("OPENROUTER_API_KEY not set")
        self.backend = f"openrouter:{model}"

    def _chat(self, system, user):
        import urllib.request
        body = json.dumps({"model": self.model, "temperature": self.temperature,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}).encode()
        req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=body,
            headers={"Authorization": "Bearer " + self.key, "Content-Type": "application/json",
                     "HTTP-Referer": "https://integralcollective.io", "X-Title": "Integral CDS Simulator"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.load(resp)
        return data["choices"][0]["message"]["content"]


def get_client(offline: bool, provider="openrouter", model=None):
    if offline:
        return ModelLLM()
    try:
        if provider == "anthropic":
            return LiveLLM(model or "claude-sonnet-4-6")
        return OpenRouterLLM(model or "deepseek/deepseek-v4-flash")
    except Exception as e:
        print(f"[llm] live backend unavailable ({e}); falling back to offline model.")
        return ModelLLM()
