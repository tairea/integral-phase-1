#!/usr/bin/env python3
"""Assemble the GitHub-Pages distribution for the Integral Data Start-Here site into ../_site/.

Source: everything start-here lives in this folder (integral-start-here/). The published site
flattens it to the Pages root (so the live URLs stay /CDS-Start-Here/ etc., not nested):

  _site/index.html            <- the hub (from integral-start-here/index.html) — the landing page
  _site/engine.css engine.js  <- shared engine
  _site/CDS-Start-Here/       <- self-contained
  _site/OAD/ITC/COS/FRS-Start-Here/  <- thin index.html (engine path ../engine.js) + data.js
  _site/integral-schema-exercise/    <- copy (so GitHub blob links resolve + browsable)
  _site/simulator/            <- copy (source; SECRETS EXCLUDED)
  _site/.nojekyll

The hub links the modules as `CDS-Start-Here/...` and each module loads `../engine.js` — those
relative paths are identical in the source folder and in the flattened site, so nothing is
rewritten here; we just copy.
"""
import os, re, shutil

BASE = os.path.dirname(os.path.abspath(__file__))          # integral-start-here/
ROOT = os.path.dirname(BASE)                               # repo root
DIST = os.path.join(ROOT, "_site")
MODS = ["OAD-Start-Here", "ITC-Start-Here", "COS-Start-Here", "FRS-Start-Here"]

EXCLUDE = {".git", "__pycache__", ".env", "_site", ".DS_Store"}
def ignore(dirpath, names):
    skip = set(n for n in names if n in EXCLUDE or n.endswith(".pyc"))
    # in simulator/out keep only the deterministic .html reports
    if os.path.basename(dirpath) == "out":
        for n in names:
            if n.endswith(".png") or "-live." in n or n.endswith(".json"):
                skip.add(n)
    return skip

def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    open(os.path.join(DIST, ".nojekyll"), "w").close()

    # hub -> root index.html (landing); links are already `CDS-Start-Here/...` — copy as-is
    shutil.copy2(os.path.join(BASE, "index.html"), os.path.join(DIST, "index.html"))

    # shared engine at root
    for f in ("engine.css", "engine.js"):
        shutil.copy2(os.path.join(BASE, f), os.path.join(DIST, f))

    # the five walkthroughs (index.html + data.js where present) verbatim
    for d in ["CDS-Start-Here"] + MODS:
        os.makedirs(os.path.join(DIST, d))
        shutil.copy2(os.path.join(BASE, d, "index.html"), os.path.join(DIST, d, "index.html"))
        dj = os.path.join(BASE, d, "data.js")
        if os.path.exists(dj):
            shutil.copy2(dj, os.path.join(DIST, d, "data.js"))

    # reference projects at repo root (so blob links resolve + browsable)
    shutil.copytree(os.path.join(ROOT, "integral-schema-exercise"),
                    os.path.join(DIST, "integral-schema-exercise"), ignore=ignore)
    shutil.copytree(os.path.join(ROOT, "simulator"),
                    os.path.join(DIST, "simulator"), ignore=ignore)

    # HTML communication artifacts + the ValueFlows deep-research note (browsable; blob links resolve)
    for d in ("html-artifacts", "valueflow-integral"):
        src = os.path.join(ROOT, d)
        if os.path.exists(src):
            shutil.copytree(src, os.path.join(DIST, d), ignore=ignore)

    # ValueFlows proposal: clean shareable route -> /valueflows/  (self-contained HTML, no local assets)
    vf_src = os.path.join(ROOT, "html-artifacts", "valueflows-integral-proposal.html")
    if os.path.exists(vf_src):
        vf_dir = os.path.join(DIST, "valueflows")
        os.makedirs(vf_dir, exist_ok=True)
        shutil.copy2(vf_src, os.path.join(vf_dir, "index.html"))

    # Phase-1 plan: clean shareable route -> /phase-1-plan/  (self-contained HTML, no local assets)
    plan_src = os.path.join(ROOT, "integral-schema-exercise", "PHASE-1-PLAN.html")
    if os.path.exists(plan_src):
        plan_dir = os.path.join(DIST, "phase-1-plan")
        os.makedirs(plan_dir, exist_ok=True)
        shutil.copy2(plan_src, os.path.join(plan_dir, "index.html"))

    # SAFETY: no secrets in the distribution
    bad = []
    for dp, _, names in os.walk(DIST):
        for n in names:
            if n == ".env":
                bad.append(os.path.join(dp, n))
    leaks = []
    keypat = re.compile(r'sk-or-v1-[A-Za-z0-9]{20,}')   # a REAL OpenRouter key (not the 'sk-or-...' placeholder)
    for dp, _, names in os.walk(DIST):
        for n in names:
            p = os.path.join(dp, n)
            try:
                if keypat.search(open(p, encoding="utf-8", errors="ignore").read()):
                    leaks.append(p)
            except Exception:
                pass
    assert not bad, f".env leaked into dist: {bad}"
    assert not leaks, f"API key string leaked into dist: {leaks}"
    print("assembled ->", DIST, "| no .env, no key strings ✓")

if __name__ == "__main__":
    main()
