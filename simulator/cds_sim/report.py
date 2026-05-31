"""Renders a pipeline trace into a single self-contained HTML file — the artifact the collective
opens to watch the CDS data flow module by module."""
import html, json, re

GCOLOR = {"strong_support": "#1a7f37", "support": "#5a9e5a", "neutral": "#8a8a8a",
          "concern": "#d9822b", "block": "#b3261e"}
GLABEL = {"strong_support": "strong", "support": "support", "neutral": "neutral",
          "concern": "concern", "block": "block"}


def e(x): return html.escape(str(x))


def _bar(value, lo, hi, threshold, color, tcolor="#222"):
    pct = (value - lo) / (hi - lo) * 100
    tpct = (threshold - lo) / (hi - lo) * 100
    return (f'<div class="bar"><div class="fill" style="width:{pct:.1f}%;background:{color}"></div>'
            f'<div class="thresh" style="left:{tpct:.1f}%"></div></div>')


def _persona_map(personas):
    return {p["id"]: p for p in personas}


# Which schema object(s) each module produces/updates, and whether each is backed by a *ratified*
# JSON-Schema contract (validated live) or is only a *proposed shape* in the spec prose (no JSON
# Schema yet — an improvement area for the collective). (type, trace-data-key, is_array, tier)
RATIFIED = {"Issue": "cds/issue.json", "Submission": "cds/submission.json",
            "DecisionRecord": "cds/decision-record.json", "DispatchPacket": "cds/dispatch-packet.json"}
EMITS = {
    "M1": [("Issue", "issue", False, "ratified"), ("Submission", "submissions", True, "ratified")],
    "M2": [("StructuredIssueView", "view", False, "proposed")],
    "M3": [("ContextModel", "context", False, "proposed")],
    "M4": [("Scenario", "scenarios", True, "proposed"), ("ConstraintReport", "reports", True, "proposed")],
    "M5": [("Vote", "votes", True, "proposed"), ("Objection", "objections", True, "proposed")],
    "M6": [("ConsensusResult", "results", True, "proposed")],
    "M7": [("DecisionRecord", "decision", False, "ratified")],
    "M8": [("DispatchPacket", "dispatch", False, "ratified")],
}


def _schema_panel(t, validations):
    mkey = t["module"].split("·")[0]
    emits = EMITS.get(mkey)
    if not emits:
        return ""
    valmap = {v["kind"]: v for v in validations}
    chips, details = [], []
    for typ, key, is_arr, tier in emits:
        data = t["data"].get(key)
        if data is None or (is_arr and not data):
            continue
        if tier == "ratified":
            v = valmap.get(typ)
            ok = bool(v and v["ok"])
            badge = f'contract <code>{RATIFIED[typ]}</code> · {"✓ validated live" if ok else "✗ invalid"}'
            bg, fg = ("#10331c", "#7ee2a8") if ok else ("#3a1413", "#f2938c")
        else:
            badge = "proposed shape — no JSON-Schema contract yet"
            bg, fg = "#3a2410", "#f0b070"
        cnt = f" ×{len(data)}" if is_arr else ""
        chips.append(f'<span class="schip" style="background:{bg};color:{fg}">{e(typ)}{cnt} — {badge}</span>')
        view = data
        if is_arr:
            view = dict(list(data.items())[:2]) if isinstance(data, dict) else data[:2]
        js = json.dumps(view, indent=2, default=str)
        if len(js) > 3500:
            js = js[:3500] + "\n… (truncated)"
        more = " (first 2 shown)" if is_arr and len(data) > 2 else ""
        details.append(f'<details><summary>view {e(typ)} object{more}</summary><pre>{e(js)}</pre></details>')
    if not chips:
        return ""
    extra = ""
    if mkey == "M7" and t["data"].get("decision"):
        extra = ('<div class="note" style="margin-top:6px">↻ <code>Issue.status</code> updated '
                 '<code>intake</code> → <code>decided</code> — the same append-only Issue object, mutated '
                 'as it moved through the pipeline.</div>')
    return f'<div class="schema"><div class="schead">📦 schema objects produced / updated at this step</div>{"".join(chips)}{extra}{"".join(details)}</div>'


def _coverage_section(p):
    rat, prop = {}, {}
    for t in p.trace:
        for typ, key, arr, tier in EMITS.get(t["module"].split("·")[0], []):
            if t["data"].get(key) is None:
                continue
            (rat if tier == "ratified" else prop)[typ] = RATIFIED.get(typ)
    valmap = {v["kind"]: v for v in p.validations}
    rchips = "".join(f'<span class="schip" style="background:#10331c;color:#7ee2a8">{e(t)} '
                     f'<code>{e(f)}</code> {"✓" if valmap.get(t, {}).get("ok") else ""}</span>'
                     for t, f in sorted(rat.items()))
    pchips = "".join(f'<span class="schip" style="background:#3a2410;color:#f0b070">{e(t)}</span>'
                     for t in sorted(prop))
    return (f'<div class="cov"><div class="schead">Schema coverage across this run</div>'
            f'<p class="note" style="margin:4px 0 10px">{len(rat) + len(prop)} object types crossed the '
            f'pipeline. <b style="color:#7ee2a8">{len(rat)}</b> are backed by a ratified JSON-Schema contract '
            f'and were <b>validated live</b> against it; <b style="color:#f0b070">{len(prop)}</b> are proposed '
            'shapes defined in the spec prose but <b>not yet schematized</b> — these are the prime areas for '
            'the collective to formalize next.</p>'
            f'<div><b class="note">ratified + validated:</b><br>{rchips}</div>'
            f'<div style="margin-top:8px"><b class="note">proposed shapes (schema TODO):</b><br>{pchips}</div></div>')


def render(p, scenario, meta):
    P = _persona_map(p.personas)
    out = []
    A = out.append

    A(f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CDS Data-Flow Simulation — {e(scenario['issue']['title'])}</title>
<style>
:root{{--bg:#0f1115;--card:#181b22;--ink:#e7e9ee;--mut:#9aa3b2;--line:#272b34;--acc:#6ea8fe}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}}
.wrap{{max-width:1080px;margin:0 auto;padding:28px 20px 80px}}
h1{{font-size:24px;margin:0 0 4px}} h2{{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:0 0 10px}}
a{{color:var(--acc)}}
.sub{{color:var(--mut);margin:0 0 18px}}
.badge{{display:inline-block;padding:2px 9px;border-radius:20px;font-size:12px;font-weight:600}}
.ok{{background:#10331c;color:#7ee2a8}} .warn{{background:#3a2410;color:#f0b070}} .bad{{background:#3a1413;color:#f2938c}}
.pill{{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;background:#222732;color:var(--mut);margin:0 4px 4px 0}}
.personas{{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 26px}}
.persona{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;flex:1 1 195px}}
.persona b{{display:block}} .persona span{{color:var(--mut);font-size:12.5px}}
.module{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:0 0 16px}}
.mhead{{display:flex;align-items:center;gap:13px;margin:0 0 3px}}
.mnum{{flex:none;background:var(--acc);color:#0a0c10;font-weight:800;font-size:11.5px;letter-spacing:.02em;border-radius:7px;padding:3px 10px;white-space:nowrap}}
.module h3{{margin:0;font-size:17px}} .module .s{{color:var(--mut);margin:0 0 14px;font-size:13.5px}}
.flow{{text-align:center;color:var(--line);font-size:20px;margin:-6px 0 10px}}
table{{width:100%;border-collapse:collapse;font-size:13px}} th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}}
th{{color:var(--mut);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em}}
.dup{{opacity:.55}} .dup td:first-child:before{{content:"⤷ dup ";color:#f0b070}}
.cell{{padding:3px 7px;border-radius:6px;color:#fff;font-size:12px;font-weight:600;text-align:center;display:inline-block;min-width:62px}}
.bar{{position:relative;height:10px;background:#222732;border-radius:6px;overflow:hidden;margin:3px 0}}
.bar .fill{{position:absolute;height:100%;left:0;border-radius:6px}}
.bar .thresh{{position:absolute;top:-3px;width:2px;height:16px;background:#fff}}
.scn{{border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:0 0 9px}}
.scn.win{{border-color:#1a7f37;box-shadow:0 0 0 1px #1a7f37 inset}} .scn.esc{{border-color:#8a5cf6}}
.kv{{display:grid;grid-template-columns:140px 1fr;gap:3px 12px;font-size:13px}} .kv b{{color:var(--mut);font-weight:600}}
.obj{{border-left:3px solid #b3261e;padding:5px 10px;margin:6px 0;background:#1d1416;border-radius:0 8px 8px 0;font-size:13px}}
.obj.vc{{border-color:#8a5cf6;background:#181425}}
code{{background:#0c0e13;padding:1px 5px;border-radius:5px;font-size:12px;color:#cdd6e6;word-break:break-all}}
.mono{{font-family:ui-monospace,Menlo,monospace}}
.dir-approve{{color:#7ee2a8;font-weight:700}} .dir-revise{{color:#f0b070;font-weight:700}} .dir-escalate_to_module9{{color:#b79cff;font-weight:700}}
.note{{font-size:12.5px;color:var(--mut)}}
.schema{{margin-top:14px;padding:12px;border:1px dashed var(--line);border-radius:10px;background:#0c0e13}}
.schead{{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);margin-bottom:8px}}
.schip{{display:inline-block;padding:3px 9px;border-radius:7px;font-size:11.5px;margin:0 5px 5px 0}}
.cov{{background:#12151c;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 22px}}
details{{margin:6px 0}} summary{{cursor:pointer;color:var(--acc);font-size:12.5px}}
pre{{background:#08090d;border:1px solid var(--line);border-radius:8px;padding:10px;overflow:auto;font-size:11.5px;color:#cdd6e6;max-height:340px}}
</style></head><body><div class="wrap">""")

    # header
    val_ok = all(v["ok"] for v in p.validations)
    vbadge = (f'<span class="badge ok">✓ {len(p.validations)} objects schema-valid</span>' if val_ok
              else '<span class="badge bad">schema validation FAILED</span>')
    A(f"<h1>CDS Data-Flow Simulation</h1>")
    A(f'<p class="sub">{e(scenario["issue"]["title"])}</p>')
    A(f'<p>{vbadge} &nbsp; <span class="pill">node: {e(p.node)}</span>'
      f'<span class="pill">participants: {len(p.personas)}</span>'
      f'<span class="pill">inputs: {e(meta["backend"])}</span>'
      f'<span class="pill">{e(meta["mode"])}</span></p>')
    A(f'<p class="note">{e(scenario["issue"]["description"])}</p>')

    # personas
    A('<h2 style="margin-top:22px">Participants</h2><div class="personas">')
    for pr in p.personas:
        A(f'<div class="persona"><b>{e(pr["name"])}</b><span>{e(pr["role"])}</span></div>')
    A('</div>')

    # schema coverage banner (the review aid)
    A(_coverage_section(p))

    # modules
    flow = '<div class="flow">▼</div>'
    for t in p.trace:
        if t is not p.trace[0]:
            A(flow)
        mod = " · ".join(t["module"].split("·"))            # space the round suffix: "M5·r2" -> "M5 · r2"
        blabel = ("CDS · " + mod) if re.match(r'^M\d', mod) else mod   # numbered CDS modules get the CDS prefix
        A(f'<div class="module"><div class="mhead"><span class="mnum">{e(blabel)}</span>'
          f'<h3>{e(t["title"])}</h3></div>'
          f'<p class="s">{e(t["summary"])}</p>')
        A(_render_body(t, P, p))
        A(_schema_panel(t, p.validations))
        A('</div>')

    # validation footer
    A('<h2 style="margin-top:30px">Schema validation (every object checked against the candidate contracts)</h2><table><tr><th>object</th><th>result</th></tr>')
    for v in p.validations:
        b = '<span class="badge ok">valid</span>' if v["ok"] else f'<span class="badge bad">{e(v["errors"])}</span>'
        A(f'<tr><td>{e(v["kind"])}</td><td>{b}</td></tr>')
    A('</table>')
    A('<p class="note" style="margin-top:24px">Generated by the Integral CDS data-flow simulator. '
      'Every Issue / DecisionRecord / DispatchPacket above is validated live against '
      '<code>integral-schema-exercise/schemas</code>. Offline participant inputs are computed from a '
      'transparent persona/dimension model; run with an <code>ANTHROPIC_API_KEY</code> for live LLM participants.</p>')
    A('</div></body></html>')
    return "".join(out)


def _render_body(t, P, p):
    m, d = t["module"].split("·")[0], t["data"]
    if m == "↻ REV":
        return (f'<div class="obj" style="border-color:#6ea8fe;background:#101726">'
                f'<b>Refined {e(d["refined"])}</b> — eased <b>{e(d["dimension"])}</b> from {d["old"]:+} to {d["new"]:+}.<br>'
                f'<span class="note">New version <code>{e(d["scenario_id"])}</code> '
                f'(parent <code>{e(d["parent"])}</code>) re-enters M4→M5→M6.</span></div>')
    if m == "↻ CAP":
        return ('<div class="obj vc"><b>Revision cap reached.</b> No convergence after the maximum rounds; '
                'escalating to Module 9 rather than looping forever (infinite-loop guard).</div>')
    if m == "M1":
        rows = []
        for s in d["submissions"]:
            cls = "dup" if s["duplicate_of"] else ""
            who = P.get(s["author_id"], {}).get("name", s["author_id"])
            rows.append(f'<tr class="{cls}"><td>{e(who)}</td><td>{e(s["content"])}</td>'
                        f'<td class="mono note">{e(s["submission_id"])}</td></tr>')
        return (f'<table><tr><th>participant</th><th>submission</th><th>id</th></tr>{"".join(rows)}</table>')
    if m == "M2":
        return "".join(f'<span class="pill">{e(c["label"])} · {len(c["submission_ids"])}</span>'
                       for c in d["view"]["clusters"])
    if m == "M3":
        c = d["context"]
        return ('<div class="kv">' + "".join(
            f'<b>{e(k)}</b><div>{e(c[k])}</div>' for k in ["historical", "ecological", "resources", "labor", "dependencies"]
        ) + f'<b>evidence</b><div>{" ".join("<code>"+e(x)+"</code>" for x in c["evidence_index"])}</div></div>')
    if m == "M4":
        out = []
        for sc in d["scenarios"]:
            r = d["reports"][sc["_pid"]]
            badge = ('<span class="badge ok">passes constraints</span>' if r["passed"]
                     else '<span class="badge bad">constraint violation</span>')
            org = '<span class="pill">auto-generated (M3→M4)</span>' if sc["origin"] == "auto_generated" else '<span class="pill">submitted</span>'
            v = "".join(f'<div class="obj">✗ <b>{e(x["constraint"])}</b> ({e(x["dimension"])} {x["value"]:+} &lt; {x["threshold"]:+}): {e(x["message"])}</div>' for x in r["violations"])
            rq = "".join(f'<div class="obj vc">⚠ <b>{e(x["constraint"])}</b>: {e(x["message"])}</div>' for x in r["required_modifications"])
            out.append(f'<div class="scn"><b>{e(sc["_pid"])} · {e(sc["label"])}</b> {badge} {org}'
                       f'<div class="note">{e(sc["_summary"])}</div>{v}{rq}</div>')
        return "".join(out)
    if m == "M5":
        scns = sorted({v["scenario_id"] for v in d["votes"]})
        pids = [s.split(":")[1] for s in scns]
        head = "".join(f"<th>{e(x)}</th>" for x in pids)
        rows = []
        for pr in d["personas"]:
            cells = []
            for sc in scns:
                v = next((x for x in d["votes"] if x["participant_id"] == pr["id"] and x["scenario_id"] == sc), None)
                if v:
                    cells.append(f'<td><span class="cell" style="background:{GCOLOR[v["support"]]}" title="{e(v["comment"])}">{GLABEL[v["support"]]}</span></td>')
                else:
                    cells.append("<td></td>")
            rows.append(f'<tr><td>{e(pr["name"])}</td>{"".join(cells)}</tr>')
        tbl = f'<table><tr><th>participant</th>{head}</tr>{"".join(rows)}</table>'
        objs = ""
        for o in d["objections"]:
            who = P.get(o["participant_id"], {}).get("name", o["participant_id"])
            cls = "obj vc" if o["_value_conflict"] else "obj"
            tag = '<span class="pill">value conflict</span>' if o["_value_conflict"] else ''
            objs += (f'<div class="{cls}"><b>{e(who)}</b> on {e(o["_pid"])} {tag}<br>{e(o["description"])}'
                     f'<div class="note">severity {o["severity"]} × scope {o["scope"]} = '
                     f'{o["severity"]*o["scope"]:.2f}</div></div>')
        return tbl + ('<h2 style="margin-top:14px">Objections raised</h2>' + objs if objs else "")
    if m == "M6":
        th = d["thresholds"]
        out = []
        for pid, r in d["results"].items():
            win = d["winner"] and d["winner"]["scenario_id"] == r["scenario_id"]
            esc = r["directive"] == "escalate_to_module9"
            cls = "scn win" if win else ("scn esc" if esc else "scn")
            cbar = _bar(r["consensus_score"], -1, 1, th["consensus"], GCOLOR["support"])
            obar = _bar(r["objection_index"], 0, 1, th["block"], "#b3261e")
            crown = " 👑 selected" if win else ""
            flags = ""
            if r.get("value_conflict_present"):
                flags += ' <span class="pill" style="background:#181425;color:#b79cff">⚑ value-conflict objection</span>'
            if r.get("blocking_objection") and not esc:
                flags += ' <span class="pill" style="background:#3a1413;color:#f2938c">blocked by objection</span>'
            out.append(
                f'<div class="{cls}"><b>{e(r["scenario_id"])}</b> '
                f'<span class="dir-{r["directive"]}">{e(r["directive"])}</span>{crown}{flags}'
                f'<div class="kv" style="margin-top:6px"><b>consensus {r["consensus_score"]:+.2f}</b><div>{cbar}'
                f'<span class="note">threshold {th["consensus"]}</span></div>'
                f'<b>objection {r["objection_index"]:.2f}</b><div>{obar}'
                f'<span class="note">block ≥ {th["block"]}</span></div></div>'
                + (f'<div class="note" style="color:#b79cff">↳ escalated to Module 9: {e(r["escalation_reason"])}</div>' if esc else "")
                + '</div>')
        return "".join(out)
    if m == "M7":
        if not d.get("decision"):
            if d.get("no_winner_reason") == "module9":
                ids = ", ".join(r["scenario_id"] for r in d.get("escalated", []))
                if d.get("escalation_kind") == "revision_failure":
                    return ('<div class="obj vc"><b>↳ Routed to Module 9 (Syntegrity) — persistent disagreement</b><br>'
                            f'{e(ids)} did not converge after the maximum revision rounds. Rather than cycle '
                            'forever, the CDS escalates to high-bandwidth human deliberation. No automated '
                            'decision recorded.</div>')
                return ('<div class="obj vc"><b>↳ Routed to Module 9 (Syntegrity) — value conflict</b><br>'
                        f'{e(ids)} reached consensus but carries an <b>unresolved value-conflict objection</b>. '
                        'The CDS does not override a principled value conflict — it hands the decision to '
                        'high-bandwidth human deliberation. No automated decision recorded.</div>')
            return ('<p class="note">No scenario met the consensus threshold (and no value conflict to '
                    'escalate). The full set returns to Module 5 for revision — the cyclical path.</p>')
        r = d["decision"]
        return ('<div class="kv">'
                f'<b>decision</b><div class="mono">{e(r["decision_id"])} → {e(r["scenario_id"])} '
                f'<span class="badge ok">{e(r["status"])}</span></div>'
                f'<b>consensus</b><div>{r["consensus_score"]:+.2f} &nbsp; objection {r["objection_index"]:.2f}</div>'
                f'<b>rationale</b><div>{e(r["rationale"])}</div>'
                f'<b>considered</b><div>{e(", ".join(r["considered_scenario_ids"]))}</div>'
                f'<b>review triggers</b><div>{e(", ".join(r["review_triggers"]))}</div>'
                f'<b>rationale_hash</b><div><code>{e(r["rationale_hash"])}</code></div>'
                f'<b>entry_hash</b><div><code>{e(r["entry_hash"])}</code> <span class="note">(prev: {e(r["prev_hash"])})</span></div>'
                '</div>')
    if m == "M8":
        if not d.get("dispatch"):
            return '<p class="note">No decision to dispatch (issue escalated or returned to deliberation).</p>'
        r = d["dispatch"]
        return ('<div class="kv">'
                f'<b>dispatched to</b><div>{" ".join("<span class=pill>"+e(x)+"</span>" for x in r["target_systems"])}</div>'
                f'<b>OAD</b><div>{e(r["oad_flags"]["design_task"])}</div>'
                f'<b>COS tasks</b><div>{e(r["tasks"][0]["action"])}</div>'
                f'<b>FRS monitors</b><div>{e(", ".join(r["frs_monitors"]))}</div>'
                '</div><p class="note" style="margin-top:8px">FRS will read these monitors and feed results back '
                'to CDS — closing the cybernetic loop.</p>')
    return ""
