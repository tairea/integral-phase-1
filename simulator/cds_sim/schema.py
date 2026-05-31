"""Binds the simulator to the candidate CDS schemas so every object it emits is validated
against the real contracts (integral-schema-exercise/schemas). If the simulator can push a
full deliberation through these schemas, the data flow is sound."""
import json, os, glob, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "integral-schema-exercise", "schemas"))

_REGISTRY = None
_DOCS = {}


def _load():
    global _REGISTRY, _DOCS
    if _REGISTRY is not None:
        return
    try:
        from jsonschema import Draft202012Validator  # noqa
        from referencing import Registry, Resource
    except Exception:
        _REGISTRY = False  # validation unavailable
        return
    reg = Registry()
    for f in glob.glob(os.path.join(SCHEMA_ROOT, "**", "*.json"), recursive=True):
        d = json.load(open(f))
        _DOCS[d["$id"]] = d
        reg = reg.with_resource(d["$id"], Resource.from_contents(d))
    _REGISTRY = reg


_SID = "https://integral.candidate/schemas"
_MAP = {
    "Issue": f"{_SID}/cds/issue.json",
    "Submission": f"{_SID}/cds/submission.json",
    "DecisionRecord": f"{_SID}/cds/decision-record.json",
    "DispatchPacket": f"{_SID}/cds/dispatch-packet.json",
}


def validate(kind: str, instance: dict):
    """Return list of error strings (empty = valid). No-op if jsonschema isn't installed."""
    _load()
    if _REGISTRY is False or kind not in _MAP:
        return []
    from jsonschema import Draft202012Validator
    v = Draft202012Validator(_DOCS[_MAP[kind]], registry=_REGISTRY)
    return [e.message for e in v.iter_errors(instance)]


def available() -> bool:
    _load()
    return _REGISTRY is not False


def sha256(s: str) -> str:
    return "sha256:" + hashlib.sha256(s.encode("utf-8")).hexdigest()


def canon(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))
