# Integral Design Language

> A reference for building Integral **communication artifacts** — the single-page HTML explainers we
> use to make complex economic-systems work legible to the working groups and the wider community.
> Derived from two reference implementations:
> - `integral-schema-exercise/PHASE-1-PLAN.html` — "Why we lock the schema first"
> - `valueflows-integral-proposal.html` — "Integral × ValueFlows: should we use a shared ledger?"
>
> If you're making another page like these, start here. Copy the tokens, reuse the components,
> keep the voice. **Consistency is the point** — every artifact should feel like it came from the
> same hand.

---

## 1. Philosophy

Three commitments shape everything:

1. **Plain language first.** We explain genuinely hard ideas (append-only ledgers, non-transferable
   credits, REA ontology) to a mixed audience of developers, economists, and curious newcomers.
   Lead with an everyday analogy, then earn the technical term. *"Every economy is, underneath, a
   set of books."* *"Imagine building a house — you could start framing walls tomorrow, or get the
   foundation right."*

2. **Sourcing is a first-class feature, not a footnote.** Integral's community trusts the
   **white paper** and the **Dev Guide** as sources of truth. Every substantive claim should be
   openable to the exact passage it rests on, inline, without leaving the page. This is the
   signature move of the design language — the collapsible **source expansion** (`details.dg`).
   Where relevant, also cite adjacent bodies of work (e.g. ValueFlows) the same way.

3. **Honest, not promotional.** We present tensions, open questions, and the author's own caveats.
   Panels are literally labelled "Worth weighing." Nothing is "decided" unless it is. The tone is a
   smart colleague walking you through a real decision, not a pitch.

The aesthetic that carries this: **dark, editorial-technical.** A near-black ink ground, warm cream
text, a serif display face for warmth, a grotesque sans for clarity, and a mono for anything
machine-flavoured (labels, code, citations). One amber accent does most of the work; a cyan and a
red carry secondary meaning.

---

## 2. Foundations

### 2.1 Color tokens

Drop this `:root` block in verbatim. Don't invent new hexes — extend the palette only with a
documented reason.

```css
:root{
  /* grounds */
  --ink:#0a0e0c;      /* page background */
  --ink-2:#101510;    /* gradient partner, panel bottoms */
  --panel:#141b17;    /* card surface (top of gradient) */
  --panel-2:#1a231e;  /* raised surface */
  /* text */
  --cream:#f3eee1;    /* primary text + headings */
  --muted:#9aa39b;    /* secondary text, leads */
  --faint:#5f6b62;    /* tertiary: labels, captions, citations */
  /* accents */
  --amber:#f2b134;    /* PRIMARY accent — section accents, links, primary system */
  --amber-2:#ffd277;  /* lighter amber — pull-quotes, summaries */
  --cyan:#5cd6c6;     /* SECONDARY — "good"/affirmative, cross-checking, plain-language labels */
  --red:#ff6f6f;      /* WARNING — blockers, "no analog", costs, must-close */
  --green:#84d6a0;    /* TERTIARY — used in the VF proposal for affirmative/“permitted” + VF accent */
  --green-2:#a9e6bf;
  /* lines */
  --line:rgba(243,238,225,0.10);
  --line-2:rgba(243,238,225,0.06);
  --r:14px;           /* standard border-radius */
}
```

**Semantic use of accent colors** (keep this consistent across artifacts):

| Color | Meaning |
|-------|---------|
| **amber** | the primary thread; the "spine" system or topic; links; section accents |
| **cyan** | affirmative / "do this" / cross-checking / plain-language framing |
| **green** | affirmative-permitted, and an adjacent-body-of-work accent (e.g. ValueFlows) when a page contrasts two systems |
| **red** | warnings, blockers, "no analog", costs, anything that must close |
| **muted / faint** | structure and de-emphasis — most of the page is these |

> **Rule:** a dominant ground (ink) + cream text + *one* loud accent (amber) reads as designed.
> Spreading color evenly reads as noise. Use cyan/green/red sparingly, only where they carry meaning.

### 2.2 Typography

Load three families. **Never** substitute system fonts, Inter, or Roboto.

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,900&family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

| Role | Family | Notes |
|------|--------|-------|
| **Display / headings** | `Fraunces` serif | `900` for `h1`, `600` for `h2`/`h3`. Use the *italic 400* as the accent voice (pull-quotes, the `.it` word in the hero). Optical sizing on. |
| **Body / UI** | `Archivo` sans | `400` body, `600`–`700` emphasis. Line-height `1.65`. |
| **Mono / labels / code / citations** | `JetBrains Mono` | section tags, chips, code, `.cite`, SVG labels. Letter-spacing `.04em`–`.2em` when uppercased. |

Type scale (clamp for fluid sizing):
- `h1`: `clamp(2.5rem, 6.2vw, 4.7rem)`, line-height `1.0`, letter-spacing `-0.02em`
- `h2`: `clamp(1.7rem, 3.4vw, 2.5rem)`, line-height `1.1`
- body prose: `1.1rem`, max-width `730px`
- lead: `1.08rem`, color `--muted`

### 2.3 Background treatment

Three stacked layers give the "schematic on dark paper" depth. Reuse as-is:

- **Grid** (`body::before`): faint cyan 46px grid, masked to fade out below the fold.
- **Noise** (`body::after`): SVG `feTurbulence` at `opacity:0.04`, multiply-blended grain.
- **Glow** (`.glow` div near the hero): a single soft amber radial, blurred, behind the title.

```css
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(92,214,198,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(92,214,198,0.035) 1px,transparent 1px);
  background-size:46px 46px;mask-image:radial-gradient(ellipse 120% 80% at 50% 0%,#000 30%,transparent 90%)}
body::after{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.04;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
```

Surfaces (cards, diagrams, panels) use a subtle top-lit gradient: `linear-gradient(160deg,var(--panel),var(--ink-2))`.

---

## 3. Layout

- **Container:** `.wrap` — `max-width:1080px`, centered, `padding:0 28px`, `position:relative; z-index:1`
  (so content sits above the fixed grid/noise).
- **Reading column:** `.narrow` — `max-width:760px`. Use for prose-heavy sections; use full `.wrap`
  for diagrams, card grids, and the workstream/mapping lists.
- **Section rhythm:** `section{padding:58px 0; border-top:1px solid var(--line-2)}`.
- **Section header:** a mono `// lowercase comment` tag, then the `h2` with one amber-accented phrase.

```html
<section>
  <div class="wrap narrow">
    <div class="sec-tag">// why this work, and why now</div>
    <h2>This is pouring the <span class="accent">foundation</span></h2>
    <p class="lead">One or two sentences setting up the section, in <b>plain language</b>.</p>
    <!-- ...content... -->
  </div>
</section>
```

```css
.sec-tag{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.2em;color:var(--faint);text-transform:uppercase;margin-bottom:14px}
h2 .accent{color:var(--amber)}   /* one accent phrase per heading; optionally h2 .vf{color:var(--green)} for a second system */
```

---

## 4. Component library

Each component below is canonical — copy the markup and the CSS, don't reinvent.

### 4.1 Hero / masthead

Eyebrow (mono) → Fraunces-900 title with one italic accent word → muted sub → row of meta chips.
The four hero elements animate in on load via staggered `animation-delay` (see §5).

```html
<header>
  <div class="wrap">
    <div class="eyebrow">Integral · Phase 1 · A proposal for the working groups</div>
    <h1>Get the foundation<br><span class="it">right</span>, once.</h1>
    <p class="sub">One paragraph, plain language, <b>bolding the few words that matter</b>.</p>
    <div class="meta-row">
      <span class="chip">A <b>plain-language</b> walkthrough</span>
      <span class="chip"><b>9</b> workstreams</span>
      <span class="chip red">2 must close before Phase 2</span>
    </div>
  </div>
</header>
```

`h1 .it{font-style:italic;font-weight:400;color:var(--amber-2)}`. Chips are mono, pill-shaped,
`1px` border; add `.red`/`.green` variants for emphasis.

### 4.2 Prose, leads, and pull-quotes

- `.lead` — muted intro line, `max-width:730px`, `b` goes cream.
- `.prose p` — `1.1rem`, color `#d7d3c6`, `b` goes cream. Inline `code` is mono on `#0a0c0a`.
- **Pull-quote** `.pull` — the *editorial* device for a source's own words used as a banner
  (distinct from the collapsible expansion). Fraunces italic, amber-2, left amber rule, with a
  mono `<cite>`.

```html
<div class="pull">
  "This is not glamorous work and it does not produce running software — but it is arguably the
  highest-leverage technical work in the entire project."
  <cite>Integral Dev Guide · §5.1</cite>
</div>
```

### 4.3 ★ Source expansion (`details.dg`) — the signature pattern

The most important component. Lets a reader open the **exact** white-paper / Dev-Guide / external
passage behind a claim, inline. Use it liberally — at least one per substantive section.

**Hard rules:**
- **One visual style for every source.** Always amber. **Never** color-code the box by source
  (no cyan "white paper" boxes, no green "ValueFlows" boxes). Provenance is carried by the **`.cite`
  text** and by inline **`tg-*` tags** (§4.4), never by the box.
- The `<summary>` opens with **📖** and ends with a rotating **`+`**.
- The `<blockquote>` is a **verbatim quote** — quote accurately; bold the key clause with `<b>`.
- The `.cite` names the section precisely and, when a canonical URL exists, links to it
  (`view on GitHub ↗`). If no stable URL exists (e.g. the white paper), cite the section in text
  only — don't fabricate a link.

```html
<details class="dg">
  <summary>📖 Read the actual Dev Guide passage — right here <span class="plus">+</span></summary>
  <blockquote>
    <p>"The output of this exercise is a ratified, complete schema for each system — with all
    deferred fields present as typed, nullable placeholders — <b>before the first line of production
    code is written.</b>"</p>
  </blockquote>
  <div class="cite">Dev Guide §5.1 ·
    <a href="https://github.com/Integral-Collective/integral-devguide/blob/main/DEVGUIDE.md#51-..." target="_blank" rel="noopener">view on GitHub ↗</a>
  </div>
</details>
```

```css
details.dg{margin-top:12px;border:1px solid var(--line-2);border-left:3px solid rgba(242,177,52,.45);border-radius:0 8px 8px 0;background:rgba(242,177,52,0.03);overflow:hidden}
details.dg summary{list-style:none;cursor:pointer;padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:11.5px;letter-spacing:.04em;color:var(--amber-2);display:flex;align-items:center;gap:8px}
details.dg summary::-webkit-details-marker{display:none}
details.dg summary .plus{margin-left:auto;transition:transform .3s}
details.dg[open] summary .plus{transform:rotate(45deg)}
details.dg blockquote{padding:4px 18px 16px 18px;font-family:'Archivo',sans-serif;font-size:.97rem;line-height:1.68;color:#d7d3c6;font-style:normal}
details.dg blockquote p{margin-bottom:12px}
details.dg blockquote p:last-child{margin-bottom:0}
details.dg blockquote b{color:var(--cream);font-weight:600}
details.dg .cite{padding:0 18px 14px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
details.dg .cite a{color:var(--amber);text-decoration:none;border-bottom:1px solid rgba(242,177,52,.3)}
```

`details.dg` may nest inside the "Source" row of an `.oq` panel (§4.6) — a citation that opens to its
own passage.

### 4.4 Provenance tags (`tg-*`)

Tiny mono chips that label *where a field/claim/decision comes from* inline, without a box. This is
how we differentiate sources after unifying the expansion style.

```html
<span class="tg tg-wp">WHITE PAPER</span>
<span class="tg tg-dg">DEV GUIDE</span>
<span class="tg tg-vf">VALUEFLOWS</span>
<span class="tg tg-deferred">NO VF ANALOG</span>
<span class="tg tg-fed">FEDERATION</span>
```

| Tag | Color | Meaning |
|-----|-------|---------|
| `tg-wp` | cyan | sourced from the Technical White Paper |
| `tg-dg` | amber | sourced from the Dev Guide |
| `tg-vf` | green | sourced from ValueFlows / an external body of work |
| `tg-deferred` | red | deferred / absent / no analog |
| `tg-fed` | violet | federation-related field |

```css
.tg{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.04em;padding:2px 6px;border-radius:4px;margin-left:4px;vertical-align:middle;white-space:nowrap}
.tg-wp{background:rgba(92,214,198,0.12);color:#7fd9cb}
.tg-dg{background:rgba(242,177,52,0.13);color:#ffd277}
.tg-vf{background:rgba(132,214,160,0.14);color:#a9e6bf}
.tg-deferred{background:rgba(255,111,111,0.12);color:#ff9b9b}
.tg-fed{background:rgba(167,139,250,0.14);color:#c4b5fd}
```

### 4.5 System / topic card (`.ws`)

A bordered panel with a colored left spine. Use for "one item in a list" — a workstream, a system
mapping, a module. Header row = mono id + a right-aligned pill; Fraunces sub-head; body copy.

```html
<div class="ws cos reveal">   <!-- spine color: default amber; .cos green; .itc red -->
  <div class="ws-top">
    <span class="ws-id">COS · COOPERATIVE ORGANIZATION</span>
    <span class="maps-to">→ VF EconomicEvent</span>
  </div>
  <h3>Doing the work is recording an "event"</h3>
  <p class="deliver">Plain-language explanation, <b>bolding what matters</b>, with inline <code>code</code>.</p>
  <!-- optional: details.dg source expansions -->
</div>
```

The left spine is a `::before` bar; recolor per variant (`.ws.cos::before{background:var(--green)}`).

### 4.6 Open-question / decision panel (`details.oq`)

For anything still being decided. **Always use the same four-row anatomy** so readers learn the
rhythm: **In plain terms → Why it matters → Directions on the table → Source.** The code chip is
amber normally, red (`.hot`) for a must-close.

```html
<details class="oq">
  <summary><span class="code">OPEN-QUESTION-03</span><span class="qt">Keep "raw work" and "credited value" as one record or two?</span><span class="plus">+</span></summary>
  <div class="oq-body">
    <div class="row"><div class="k plain">In plain terms</div><div class="v">...</div></div>
    <div class="row"><div class="k why">Why it matters</div><div class="v">...</div></div>
    <div class="row"><div class="k dir">Directions on the table</div>
      <div class="v"><span class="prop">Proposed:</span> ... <br><span class="weigh">Worth weighing:</span> <span class="alt">...</span></div></div>
    <div class="row"><div class="k src">Source</div>
      <div class="v"><a class="srcl" href="..." target="_blank" rel="noopener">Dev Guide §4.3 ↗</a>
        <details class="dg">…verbatim passage…</details>
      </div></div>
  </div>
</details>
```

Row-label colors: `plain` cyan, `why` amber, `dir` green-2, `src` faint. `.prop` cream-bold,
`.weigh` amber-2, `.alt` muted.

### 4.7 Verdict cards & ledger

- **Consequence cards** `.ccard.good` / `.ccard.bad` — two-up grid, cyan/green vs red headings with
  an inline 22px SVG icon. Use for "do X / don't do X" or "covers / doesn't cover".
- **Balance-sheet ledger** `.ledger` — `lk` label column (`.buy` green / `.cost` red) + `lv` value,
  with a `+`/`−` `.sign`. Use for "what it buys / what it costs".

### 4.8 Insight banner

A single high-emphasis statement (the one thing to remember). Dark inset panel, green/amber hairline
border, a faint `★` watermark, a mono uppercase label, then a Fraunces line with italic
affirmative/negative spans.

```html
<div class="insight">
  <div class="lbl">Non-transferability, expressed natively</div>
  <p class="big">A credit account may <span class="yes">only ever</span> be raised, lowered, or
  consumed — and may <span class="no">never</span> be transferred, moved, or copied.</p>
</div>
```

### 4.9 Transparency block: QA + links-grid + source-cta

The "see for yourself" closer. A cyan-bordered `.qa` ("a fair question") + a 2-col `.links-grid` of
`.link-card`s to public sources + a prominent `.source-cta` button to the canonical doc. This is how
we make sourcing feel open rather than authoritative.

```html
<div class="qa">
  <div class="q">Short answer: nothing here is decided.</div>
  <p>...honest framing, quoting the artifact's own caveat...</p>
</div>
<div class="links-grid">
  <a class="link-card" href="..." target="_blank" rel="noopener">
    <div class="lc-top"><span class="lc-ic">📐</span><span class="lc-title">The candidate schemas</span><span class="lc-arr">↗</span></div>
    <div class="lc-desc">One-line description of what's behind the link.</div>
  </a>
  <!-- ...more cards... -->
</div>
```

### 4.10 Meta chips

Mono pills in the hero and section intros for at-a-glance facts. `.chip`, with `.red`/`.green`
variants. `b` goes cream.

---

## 5. Diagrams (inline SVG)

We hand-author **inline SVG** for all schematics. Do **not** reach for raster image generation —
SVG is crisp, legible, editable, theme-matched, and (importantly) works without image-gen API keys.

**Container & responsiveness (this prevents horizontal scrollbars — a known failure):**

```css
.diagram{margin-top:6px;background:linear-gradient(160deg,var(--panel),var(--ink-2));
  border:1px solid var(--line);border-radius:18px;padding:28px 22px;overflow:hidden}
.diagram svg{display:block;width:100%;height:auto;margin:0 auto}   /* responsive — NEVER min-width */
/* let a diagram in a .narrow prose column break out wider, with no scroll: */
.narrow .diagram.wide{width:min(94vw,1000px);margin-left:calc(50% - min(94vw,1000px)/2)}
```

- The `<svg>` carries a `viewBox` and scales to `width:100%`. **Never set a pixel `min-width`** — that
  is what causes the scroll-x bar. If a diagram needs more room than the 760px reading column, add
  `class="wide"` to break it out (works because `body{overflow-x:hidden}` guards the page edge).
- Always add `role="img"` and a descriptive `aria-label`.
- Follow with a `.legend` (mono key) and/or a `figcaption` (muted, `b` cream).

**SVG drawing conventions (so diagrams match the page):**
- Node fills `#141b17`; node strokes use accent colors (amber/green/cyan), `stroke-width` ~2.2.
- "Absent / deferred / forbidden" nodes: red stroke, `stroke-dasharray:5 5`, `opacity:.45`.
- Connector lines: `#2a322c`, `stroke-width:2`, arrowheads via a `<marker>` filled `#5f6b62`.
- Text: titles JetBrains Mono bold in the node's accent color; role labels Archivo `--muted`;
  section band labels mono uppercased.
- Affirmative flows green + solid; forbidden flows red + dashed + an ✕ strike.

A small `.progress` scroll bar (fixed, top, amber→green gradient) is a nice touch for long pages.

---

## 6. Motion

Restrained and purposeful. Two mechanisms only:

1. **Hero load-in** — the eyebrow/title/sub/chips rise+fade via CSS `animation` with staggered
   `animation-delay` (`.05s`, `.12s`, `.22s`, `.3s`).
   ```css
   @keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
   ```
2. **Scroll reveal** — elements with `.reveal` start `opacity:0; translateY(24px)` and get `.in`
   added by an `IntersectionObserver` (`threshold:0.12`, `rootMargin:'0px 0px -8% 0px'`).

> ⚠️ Don't combine a layout `transform` (e.g. a diagram breakout via `translateX`) with `.reveal` —
> the reveal's `transform:none` will cancel it. Use margin-based offsets for breakout (as in §5).

Hover affordances: cards/links lift `translateY(-2…3px)` and brighten their border on `:hover`.
Optional `[data-tip]` CSS tooltips (hover + focus) for compact extra context on names/terms.

---

## 7. Accessibility & responsive

- Single breakpoint at `max-width:780px`: collapse 2-col grids to 1, reduce hero padding, stack
  ledger rows.
- `body{overflow-x:hidden}` — the safety net against any breakout overflow. Keep it.
- Color is never the *only* signal — pair it with a label (`tg-*` text, a strike mark, an icon).
- Every diagram has `role="img"` + `aria-label`. Every external link is `target="_blank" rel="noopener"`.
- Maintain contrast: cream/muted on ink passes; don't put `--faint` on small body text.

---

## 8. Voice checklist (content)

Before shipping, the copy should pass all of these:

- [ ] Does each section open with a **plain-language** framing a non-specialist understands?
- [ ] Is there at least one **analogy** carrying the hardest idea?
- [ ] Is every substantive claim **openable to its source** (`details.dg`) or tagged (`tg-*`)?
- [ ] Are sources cited **precisely** (`§` number / module), and linked only where a stable URL exists?
- [ ] Are **white paper** and **Dev Guide** treated as the sources of truth, with external bodies of
      work (e.g. ValueFlows) cited the same careful way?
- [ ] Are open items honestly labelled **not decided** ("Proposed" / "Worth weighing"), never oversold?
- [ ] Does the page **end in the open** — a transparency block linking the public sources?

## 9. Build & verify checklist (technical)

- [ ] Single self-contained `.html` file; fonts via Google Fonts `<link>`; no build step.
- [ ] `:root` tokens copied verbatim; no ad-hoc hexes.
- [ ] All three font families loaded and assigned to their roles.
- [ ] Diagrams are inline SVG, `width:100%`, **no `min-width`**, `role`+`aria-label`.
- [ ] **Verify rendering headlessly** before declaring done — screenshot the page and read it back:
      ```bash
      chromium --headless --no-sandbox --hide-scrollbars --window-size=1100,8000 \
        --virtual-time-budget=3500 --screenshot=out.png file:///abs/path/to/page.html
      ```
      Confirm: no horizontal scrollbars, diagrams centered and uncut, source expansions styled amber,
      reveals fired, contrast holds.

---

## 10. Reference implementations

| File | What it demonstrates |
|------|----------------------|
| `integral-schema-exercise/PHASE-1-PLAN.html` | The fullest expression: hero, flow diagram, workstream `.ws` cards with team pills + tooltips, `.oq` panels, the `.schema-mount` tabbed schema preview, transparency block. The **canonical source** for `details.dg` and `.oq`. |
| `valueflows-integral-proposal.html` | A proposal/analysis: layer + loop + action-set SVGs, mapping `.ws` cards, the insight banner, ledger verdict, tensions as `.oq`, dual-system accenting (amber + green), and `details.dg` citing white paper / Dev Guide / an external body of work. |

When in doubt, open these two and match them.

---

*Integral Design Language · v1.0 · distilled from the first two HTML communication artifacts.
Extend it as new patterns prove themselves — but change the tokens and core components only by
deliberate, documented decision, the same way we change anything else in Integral.*
