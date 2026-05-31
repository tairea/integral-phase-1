# Integral · Data Start-Here

**An interactive, plain-language tour of the data structures behind [Integral](https://integralcollective.io)'s
five systems** — one step at a time.

### ▶ Live site: https://tairea.github.io/integral-data-start-here/

Open the hub and pick a system; each links to a step-by-step walkthrough that follows a single real
decision/flow through that system's modules, showing exactly which data objects are created and updated
at every step — with the candidate JSON-Schema always one click away.

| | System | What it does |
|---|--------|--------------|
| 🐴 | [CDS](CDS-Start-Here/) | Collaborative Decision System — how the community decides |
| 📐 | [OAD](OAD-Start-Here/) | Open Access Design — how things are designed & certified |
| 🛠️ | [COS](COS-Start-Here/) | Cooperative Organization System — where work happens |
| ⏳ | [ITC](ITC-Start-Here/) | Integral Time Credits — contribution & access |
| 📡 | [FRS](FRS-Start-Here/) | Feedback & Review System — the nervous system |

All five follow one node — **Stillwater** — and one thread (a flooding footbridge), so you can see the
systems hand data to each other in a closed cybernetic loop.

> **⚠️ Status: a proposed candidate — not ratified.** Everything here (schemas, simulator, example
> records) is Phase-1 candidate work offered to the contributor community to review, challenge, and
> ratify. Nothing is adopted; the design questions are deliberately still open.

## What's in this repo

```
index.html                 the hub / landing page
engine.css  engine.js      the shared engine that powers all five walkthroughs
CDS-Start-Here/            the CDS walkthrough (self-contained — also the engine's source template)
OAD/ITC/COS/FRS-Start-Here/  thin pages (data.js) over the shared engine
integral-schema-exercise/   the candidate schemas, specs, open questions, and DR-001 the links point to
simulator/                  a runnable simulator that pushes LLM-driven participant input through
                            the real CDS contracts (Python; run locally — see simulator/README.md)
```

## Run locally

It's static — just open `index.html` in a browser (or `python3 -m http.server` in this folder and
visit `http://localhost:8000/`). The four engine-based pages load `../engine.js`; keep the folder
structure intact.

## Editing

The CDS page is the source-of-truth template; the shared engine and the other pages are built from it.
See the build notes in the upstream working tree (`Integral-Data-Start-Here/build.py`,
`assemble_site.py`). To change the look for all five: edit the CDS template and rebuild. To change one
walkthrough's content: edit its `data.js`.

## Provenance

Grounded in Integral's [Technical White Paper](https://github.com/Integral-Collective/integral-whitepaper),
[Developer Guide](https://github.com/Integral-Collective/integral-devguide), and the author's walkthrough
(Revolution Now! Ep. 59). Built as candidate work for the Integral collective.
