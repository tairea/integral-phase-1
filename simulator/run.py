#!/usr/bin/env python3
"""CDS data-flow simulator — CLI entry point.

  python run.py                                  # offline model, footbridge scenario, HTML report
  python run.py --scenario scenarios/footbridge.json
  python run.py --live                           # use Anthropic LLM participants (needs ANTHROPIC_API_KEY)
  python run.py --out out/my-run.html --json out/my-run.json
"""
import argparse, json, os, sys, webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def load_dotenv():
    """Minimal .env loader (no dependency) — populates os.environ for keys not already set."""
    path = os.path.join(HERE, ".env")
    if not os.path.exists(path):
        return
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

from cds_sim import schema
from cds_sim.personas import PERSONAS
from cds_sim.llm import get_client
from cds_sim.pipeline import Pipeline
from cds_sim import report


def main():
    ap = argparse.ArgumentParser(description="Simulate the CDS data flow with simulated participants.")
    ap.add_argument("--scenario", default=os.path.join(HERE, "scenarios", "footbridge.json"))
    ap.add_argument("--live", action="store_true", help="use a live LLM backend (default: OpenRouter)")
    ap.add_argument("--provider", choices=["openrouter", "anthropic"], default="openrouter",
                    help="live LLM provider (default openrouter)")
    ap.add_argument("--model", default=None, help="model id (default per provider; openrouter→deepseek/deepseek-v4-flash)")
    ap.add_argument("--out", default=os.path.join(HERE, "out", "cds-run.html"))
    ap.add_argument("--json", dest="json_out", default=os.path.join(HERE, "out", "cds-run.json"))
    ap.add_argument("--open", action="store_true", help="open the report in a browser")
    args = ap.parse_args()

    load_dotenv()
    scenario = json.load(open(args.scenario))
    llm = get_client(offline=not args.live, provider=args.provider, model=args.model)
    mode = "deterministic (reproducible)" if llm.backend == "offline-model" else "live (stochastic)"
    if not schema.available():
        print("[warn] jsonschema/referencing not installed — schema validation skipped (pip install -r requirements.txt)")

    print(f"▶ scenario: {scenario['issue']['title']}")
    print(f"▶ participant inputs: {llm.backend} ({mode})")

    pipe = Pipeline(scenario, PERSONAS, llm).run()

    # console trace
    print("\n── CDS pipeline ──")
    for t in pipe.trace:
        print(f"  [{t['module']}] {t['title']}\n        {t['summary']}")
    val_ok = all(v["ok"] for v in pipe.validations)
    print(f"\n  schema validation: {'ALL VALID ✓' if val_ok else 'FAILURES ✗ ' + str([v for v in pipe.validations if not v['ok']])}")
    if pipe.winner:
        print(f"  decision: {pipe.decision['decision_id']} → {pipe.winner['scenario_id']} "
              f"(consensus {pipe.winner['consensus_score']}, objection {pipe.winner['objection_index']})")
    if pipe.escalated:
        reasons = ", ".join(sorted({r.get("escalation_reason") or "value_conflict" for r in pipe.escalated}))
        print(f"  escalated to Module 9 ({reasons}) after {getattr(pipe, 'rounds', 1)} round(s): "
              f"{[r['scenario_id'] for r in pipe.escalated]}")

    meta = {"backend": llm.backend, "mode": mode}
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    open(args.out, "w").write(report.render(pipe, scenario, meta))
    json.dump({"trace": pipe.trace, "validations": pipe.validations}, open(args.json_out, "w"),
              indent=2, default=str)
    print(f"\n  report : {args.out}\n  trace  : {args.json_out}")
    if args.open:
        webbrowser.open("file://" + os.path.abspath(args.out))
    sys.exit(0 if val_ok else 1)


if __name__ == "__main__":
    main()
