# Integral · Data Start-Here

**An interactive, plain-language tour of the data structures behind [Integral](https://integralcollective.io)'s
five systems** — one step at a time.

### ▶ Live site: https://tairea.github.io/integral-data-start-here/

This repo is the **source**. A GitHub Action builds the static site and deploys it to GitHub Pages on
every push to `main` (commit → deploy). You don't commit the built site — CI assembles it.

## The five walkthroughs

| | System | What it does |
|---|--------|--------------|
| 🐴 | [CDS](CDS-Start-Here/) | Collaborative Decision System — how the community decides |
| 📐 | [OAD](OAD-Start-Here/) | Open Access Design — how things are designed & certified |
| 🛠️ | [COS](COS-Start-Here/) | Cooperative Organization System — where work happens |
| ⏳ | [ITC](ITC-Start-Here/) | Integral Time Credits — contribution & access |
| 📡 | [FRS](FRS-Start-Here/) | Feedback & Review System — the nervous system |

All five follow one node — **Stillwater** — and one thread (a flooding footbridge), so you can see the
systems hand data to each other in a closed cybernetic loop.

> **⚠️ Status: a proposed candidate — not ratified.** Everything here is Phase-1 candidate work offered
> to the contributor community to review, challenge, and ratify. Nothing is adopted.

## How it's built (commit → deploy)

```
CDS-Start-Here/index.html        the CDS walkthrough — self-contained, AND the engine's source template
Integral-Data-Start-Here/
  index.html                     the hub / landing page (source)
  engine.css  engine.js          shared engine, generated from the CDS template by build.py
  build.py                       extracts the engine from the CDS template + regenerates each thin page
  assemble_site.py               assembles the deployable static site into _site/ (paths fixed for Pages)
OAD/ITC/COS/FRS-Start-Here/      thin index.html + data.js (per-system content over the shared engine)
integral-schema-exercise/        the candidate schemas/specs/open-questions the walkthroughs link to
simulator/                       a runnable simulator (Python) — run locally; see simulator/README.md
.github/workflows/deploy.yml     the build-and-deploy Action
```

**The pipeline** (`.github/workflows/deploy.yml`, on push to `main`):
1. `python3 Integral-Data-Start-Here/build.py` — regenerate `engine.{css,js}` from the CDS template and
   the four thin pages from their `data.js`.
2. `python3 Integral-Data-Start-Here/assemble_site.py` — assemble `_site/` (hub at root, engine at root,
   relative paths fixed for the Pages base URL; secrets excluded and scanned for).
3. Upload `_site/` and deploy to GitHub Pages.

## To change the site

- **One walkthrough's content:** edit that system's `*-Start-Here/data.js`, commit, push → it redeploys.
- **Look / behaviour for all five:** edit the CDS template (`CDS-Start-Here/index.html`) or `build.py`,
  commit, push → the engine rebuilds and all redeploy.
- **Preview locally:** `python3 Integral-Data-Start-Here/build.py && python3 Integral-Data-Start-Here/assemble_site.py`
  then open `_site/index.html` (or `python3 -m http.server` in `_site/`).

## Provenance

Grounded in Integral's [Technical White Paper](https://github.com/Integral-Collective/integral-whitepaper),
[Developer Guide](https://github.com/Integral-Collective/integral-devguide), and the author's walkthrough
(Revolution Now! Ep. 59). Candidate work for the Integral collective.
