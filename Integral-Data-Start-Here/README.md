# Integral · Data Start-Here

The **contents page + shared engine** for the Integral onboarding explainers. Open `index.html` to
pick a system; each links to its own interactive walkthrough.

```
Integral-Data-Start-Here/
  index.html          the hub / contents page (links to all five explainers)
  engine.css          shared styles  ─┐  generated from the CDS template by build.py
  engine.js           shared engine  ─┘  (render, nav, tabs, copy, mobile, data panel)
  build.py            extracts the engine from CDS-Start-Here/index.html and (re)builds each
                      module's thin index.html from its data.js
  cds-data-example.js the CDS content block, kept as the authoring reference for new modules
```

Sibling explainer dirs (each = a thin `index.html` + a per-system `data.js`, except CDS):

| Dir | System | Primary object |
|-----|--------|----------------|
| `CDS-Start-Here/` | Collaborative Decision System 🐴 | Issue *(self-contained: it is the template the engine is derived from)* |
| `OAD-Start-Here/` | Open Access Design 📐 | CertifiedDesign |
| `COS-Start-Here/` | Cooperative Organization System 🛠️ | ProductionPlan |
| `ITC-Start-Here/` | Integral Time Credits ⏳ | ITCLedgerEntry |
| `FRS-Start-Here/` | Feedback & Review System 📡 | Signal → Finding |

## How it works

- **`CDS-Start-Here/index.html` is the source of truth** for the engine — it's the fully self-contained,
  hand-tuned page. `build.py` extracts everything *outside* its `DATA_START … DATA_END` markers into
  `engine.css` + `engine.js`, and turns the part *inside* the markers into the per-system data format.
- The four other modules are **thin**: `index.html` just loads `../Integral-Data-Start-Here/engine.css`
  + `engine.js` + their own `data.js`. `data.js` defines `REF / STATUS / OBJECTS / STEPS / META`.
- To change the look/behaviour for all modules: edit the CDS template (or `build.py`) and re-run
  `python3 Integral-Data-Start-Here/build.py`. To change one module's content: edit its `data.js`
  and re-run the build (it regenerates the thin `index.html`, baking in the correct title).

## Portability note

The four engine-based pages use **relative** links (`../Integral-Data-Start-Here/engine.js`,
`../integral-schema-exercise/...`). They work when opened from this repo layout (sibling dirs). If you
host a single page standalone, keep the sibling structure or inline the engine.
