# Pandemic Treaty PABS Simulation Tool & Gemini 2.5 Flash Workspace

## 👉 [Open the simulation tool](https://sserenity22.github.io/pandemic-treaty-pabs-simulation/app/)  ·  [Minister’s brief](https://sserenity22.github.io/pandemic-treaty-pabs-simulation/minister/)  ·  [Read the proposal](https://sserenity22.github.io/pandemic-treaty-pabs-simulation/proposal/)

**Website:** https://sserenity22.github.io/pandemic-treaty-pabs-simulation/
*(Opens in your browser — no download, no sign-in. The files below are the source code behind these pages.)*

---

## Quick Start (Local Server)

Run from the repository root:
```bash
node server.mjs
```
Then open:
- **Unified v2 Workspace & Gemini “Today’s Text” Agent**: [http://localhost:8787/demo-v2/](http://localhost:8787/demo-v2/)
- **Landing Page**: [http://localhost:8787/](http://localhost:8787/)

*(Optional: Set `GEMINI_API_KEY` in `.env` or click **Gemini key** in the top bar of `/demo-v2/` to enable live `gemini-2.5-flash` calls. Without a key, the app runs seamlessly using pre-verified mappings and deterministic templates.)*

---

## What Is Included

| Component | Description |
|---|---|
| **Unified v2 Workspace & Gemini Agent** ([`demo-v2/`](demo-v2/)) | Combines the 217-country Minister’s Brief, the full 7+6 clause-level PABS simulation engine, the Trade Finder, and the 3-part **Gemini 2.5 Flash “Today’s Text” Agentic Suite** (Draft & Bracket Reader, Bridging Clause Copilot, and Ministerial Q&A Synthesizer). |
| **Simulation tool** ([`app/`](app/)) | Build a package on the seven key issues; see whether the Parties could sign it, what it delivers in four outbreak scenarios, and which trades close the gap. Runs entirely in the browser; nothing is sent to a server. |
| **Minister’s brief (test)** ([`minister/`](minister/)) | Choose a country and a deal; get a one-page cheat sheet on whether a COVID 2.0 would leave the country better or worse off than 2020–23. Pakistan is the worked example. |
| **Proposal** ([`proposal/`](proposal/)) | 12 slides: the problem, the tool, privacy, engineering, timeline, budget (planning estimates), governance, and the Slide 8 *“Today’s Text”* agent design. |
| **Local Server** ([`server.mjs`](server.mjs)) | Zero-dependency Node HTTP server that serves the repository and proxies optional `/api/gemini/generate` requests to `gemini-2.5-flash`. |

---

## Guide to the 5 Views in [`demo-v2/`](demo-v2/)

1. **`01 Ministerial briefing`**: Select any of 217 countries (default: Pakistan) and negotiating bloc. View the 3-part Cabinet Cheat Sheet (*Does it help me politically?*, *Does it help my country?*, *Will it get through?*), the 24-month COVID-19 vs. COVID 2.0 coverage chart, and synthesize a **Cabinet Brief, 90-second Plenary Intervention, & 3 Defensive Q&As**.
2. **`02 Today’s text · Agent` (Slide 8 Prototype)**: Paste draft or bracketed PABS Annex text (or load one of 4 built-in room texts). The agent maps clauses to the 7 core issues + 6 secondary levers with verbatim quotes, flags **Outside Model Scope** provisions, and lets you accept or override every mapping before applying it to the model.
3. **`03 Negotiating package`**: Configure all 7 core issues (`link`, `access`, `tier`, `money`, `pheic`, `lic`, `abs`) and 6 secondary levers (`scope`, `share`, `ip`, `pandemic`, `export`, `gov`) with verbatim A79/8 quotes, red-line indicators, and delegation notes.
4. **`04 Compare & Trade finder`**: Compare two packages issue-by-issue, run the deterministic **Trade Finder** to find consensus packages, and click **Draft bridging clause** on any move to generate diplomat-ready A79/8 text and bilateral talking points.
5. **`05 Blocs, weights & evidence`**: Edit the 6×7 bloc importance weights, test model sensitivity sliders, and review primary WHO / IGWG / OWID sources.

---

## Status and Limits
- Illustrative model for discussion, **not validated**. Base text: draft PABS Annex, on-screen text as at 30 April 2026 (WHA79 document A79/8).
- All numbers (doses, coverage curves, manufacturer participation, bloc scores) are computed deterministically in [`demo-v2/model.mjs`](demo-v2/model.mjs); the Gemini agent never invents or alters numerical outputs.
- Not affiliated with or endorsed by WHO or any negotiating party.

## Credits
- Photo of Committee A, 19 May 2025: © WHO / Pierre Albouy (WHO news release), used with credit.
- Nelson Mandela photo: South Africa The Good News, CC BY 2.0, via Wikimedia Commons. Quote attributed to Nelson Mandela.

Author: Christina Liu.
