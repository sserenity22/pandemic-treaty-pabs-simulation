# PABS Unified Ministerial & Negotiator Workspace (`demo-v2`) · Gemini 2.5 Flash "Today's Text" Prototype

Unified Ministerial & Negotiator workspace built on the `demo-v2` layout, combining:
1. **The empirical 217-country Ministerial Brief engine** (`country-data.mjs` + `covid2()` trajectory model) with Pakistan (`PAK`) as the worked deep-dive example (`PK_CONTEXT`).
2. **The full clause-level PABS simulation engine** (`model.mjs`) covering the **7 core Annex issues** (`share`, `price`, `fin`, `scope`, `trig`, `gov`, `link`), **6 secondary operational levers** (`liability`, `ip`, `exclusivity`, `traceability`, `surveillance`, `duration`), **4 outbreak scenarios** (`covid`, `panflu`, `ebolalike`, `silent`), **6 negotiating groups** (`EQ`, `AF`, `EU`, `G6`, `IF`, `CS`), red-line vetoes, and the deterministic **Trade Finder** (`findTrades()`).
3. **The 3-part Gemini 2.5 Flash Agentic Suite** (`agent.mjs`), implementing the Slide 8 *"Today's text"* workflow while keeping **all numerical calculations strictly inside the deterministic model**:
   - **Workflow 1 · "Today's Text" Draft & Bracket Reader**: Reads pasted treaty drafts or bracketed IGWG A79/8 text, maps provisions to the 7 core issues (`a`/`b`/`c`) and 6 secondary levers (`0`/`1`/`2`) with verbatim quotes, confidence badges, bracket status, and an explicit **Outside Model Scope** register (`provisionsOutsideScope`), and lets the negotiator accept or override each mapping before applying to the live simulation.
   - **Workflow 2 · Bridging Clause Drafter Copilot**: Turns deterministic 1-step or 2-step Trade Finder moves into diplomat-ready A79/8 annex wording (clean text + bracketed fallback) and bilateral talking points, with one-click insertion into package notes.
   - **Workflow 3 · Ministerial Brief & Q&A Synthesizer**: Synthesizes country-tailored Cabinet briefing notes, 90-second IGWG plenary interventions, and 3 defensive parliamentary/press Q&As strictly grounded in the deterministic engine's numbers.

## Running the Workspace

### Option A: Zero-dependency Node server with optional `.env` Gemini proxy (Recommended)
From `/Users/sserenity22/Google Deepmind Hackathon` or `/Users/sserenity22/Google Deepmind Hackathon/pandemic-treaty-pabs-simulation`:
```bash
node server.mjs
```
Then open:
- `http://localhost:8787/demo-v2/` (Unified Ministerial & Negotiator Workspace)
- `http://localhost:8787/` (Repository landing page)

To use live `gemini-2.5-flash` calls via the local proxy, either:
- Set `GEMINI_API_KEY=...` in `.env` (see `.env.example`), **or**
- Click **Gemini key** in the top bar of `/demo-v2/` to store a key in browser `sessionStorage` for your current tab.
- Without an API key, the workspace runs seamlessly using verified pre-computed / deterministic clause analysis and drafting fallbacks.

### Option B: Any static web server (or GitHub Pages)
Serve the repository root with any static server (`python3 -m http.server 8000` or GitHub Pages) and open `/demo-v2/`.

## Architecture & Files

- `index.html`, `demo.css`, `demo.mjs`: 5-view unified interface (`01 Ministerial briefing`, `02 Today's text · Agent`, `03 Negotiating package`, `04 Compare & Trade finder`, `05 Blocs, weights & evidence`).
- `model.mjs`: Deterministic clause-level PABS simulation engine, `covid2()` trajectory calculator, `findTrades()` solver, and backwards-compatible `demo-v2` snapshot & evaluator exports.
- `country-data.mjs`: Empirical COVID-19 vaccination curves (`MONTHS`, `WORLD_CUM`, `POOL`, `COUNTRY` for 217 countries from OWID/COVAX) and Pakistan negotiation context (`PK_CONTEXT`).
- `agent.mjs`: Gemini 2.5 Flash client + structured schemas + sample bracketed texts + verified deterministic fallback engine.
- `model-checks.mjs`: Automated verification suite covering both the 2,187-package `demo-v2` invariants and the full clause-level PABS engine, 217-country `covid2()` trajectories, `findTrades()`, and `agent.mjs` workflows.
- `video-graphics/`: Eight 1920x1080 video graphics in PNG and editable SVG.

## Running Automated Checks

```bash
node pandemic-treaty-pabs-simulation/demo-v2/model-checks.mjs
```
