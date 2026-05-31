#!/usr/bin/env python3
"""Assemble the GitHub-Pages distribution for the Integral Data Start-Here site into ./dist-site/.

Layout (repo root = GH Pages site root, hub is the landing page):
  index.html            <- the hub (from Integral-Data-Start-Here/index.html), links de-../'d
  engine.css engine.js  <- shared engine (from Integral-Data-Start-Here/)
  CDS-Start-Here/       <- self-contained
  OAD/ITC/COS/FRS-Start-Here/  <- thin index.html (engine path ../engine.js) + data.js
  integral-schema-exercise/    <- copy (so GitHub blob links resolve + browsable)
  simulator/            <- copy (source; SECRETS EXCLUDED)
  .nojekyll README.md
"""
import os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "_site")
HUB = os.path.join(ROOT, "Integral-Data-Start-Here")
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

    # hub -> root index.html (strip the ../ on the five module-card links)
    hub = open(os.path.join(HUB, "index.html"), encoding="utf-8").read()
    hub = re.sub(r'href="\.\./((?:CDS|OAD|ITC|COS|FRS)-Start-Here/)', r'href="\1', hub)
    open(os.path.join(DIST, "index.html"), "w", encoding="utf-8").write(hub)

    # shared engine at root
    for f in ("engine.css", "engine.js"):
        shutil.copy2(os.path.join(HUB, f), os.path.join(DIST, f))

    # CDS (self-contained) verbatim
    os.makedirs(os.path.join(DIST, "CDS-Start-Here"))
    shutil.copy2(os.path.join(ROOT, "CDS-Start-Here", "index.html"),
                 os.path.join(DIST, "CDS-Start-Here", "index.html"))

    # engine-based modules: data.js verbatim; index.html engine path -> ../engine.*
    for d in MODS:
        os.makedirs(os.path.join(DIST, d))
        idx = open(os.path.join(ROOT, d, "index.html"), encoding="utf-8").read()
        idx = idx.replace("../Integral-Data-Start-Here/engine.", "../engine.")
        open(os.path.join(DIST, d, "index.html"), "w", encoding="utf-8").write(idx)
        shutil.copy2(os.path.join(ROOT, d, "data.js"), os.path.join(DIST, d, "data.js"))

    # reference projects (so blob links resolve + browsable)
    shutil.copytree(os.path.join(ROOT, "integral-schema-exercise"),
                    os.path.join(DIST, "integral-schema-exercise"), ignore=ignore)
    shutil.copytree(os.path.join(ROOT, "simulator"),
                    os.path.join(DIST, "simulator"), ignore=ignore)

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
