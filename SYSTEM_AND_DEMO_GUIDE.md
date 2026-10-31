# Pandemic Treaty PABS Simulation & Gemini 2.5 Flash Workspace — Complete Guide & Links

An interactive simulation and agentic negotiation workspace for the **WHO Pandemic Agreement’s Pathogen Access and Benefit-Sharing (PABS) Annex**, ahead of the World Health Assembly in May 2027.

---

## 1. All Live Links (Local Server & Published Links)

### Live Local Server Links (Port `8787`)
Start the server with `node server.mjs` from `/Users/sserenity22/Google Deepmind Hackathon`:
- **Updated Unified v2 Demo & Gemini “Today’s Text” Agent**: [http://localhost:8787/demo-v2/](http://localhost:8787/demo-v2/)
- **Updated Demo Video Graphics Gallery (8 1080p Scenes + Editable SVGs)**: [http://localhost:8787/demo-v2/video-graphics/](http://localhost:8787/demo-v2/video-graphics/)
  - **All 8 Video Plates Contact Sheet**: [http://localhost:8787/demo-v2/video-graphics/contact-sheet.jpg](http://localhost:8787/demo-v2/video-graphics/contact-sheet.jpg)
  - **Video Timing & Shot Map Notes**: [http://localhost:8787/demo-v2/video-graphics/README.md](http://localhost:8787/demo-v2/video-graphics/README.md)
  - **AI Image Prompts & Provenance**: [http://localhost:8787/demo-v2/video-graphics/images/final-prompts.md](http://localhost:8787/demo-v2/video-graphics/images/final-prompts.md)
- **Landing Page (All Tools)**: [http://localhost:8787/](http://localhost:8787/)
- **Original Negotiator Simulation Tool**: [http://localhost:8787/app/](http://localhost:8787/app/)
- **Original Minister’s Brief (Pakistan Worked Example)**: [http://localhost:8787/minister/](http://localhost:8787/minister/)
- **12-Slide Proposal Deck (Slide 8 = “Today’s Text” Agent)**: [http://localhost:8787/proposal/](http://localhost:8787/proposal/)

### Published GitHub Pages Links
- **Published Pitch Video Page**: https://sserenity22.github.io/pandemic-treaty-pabs-simulation/pitch/
- **Published Main Site**: https://sserenity22.github.io/pandemic-treaty-pabs-simulation/
- **Published Simulation Tool**: https://sserenity22.github.io/pandemic-treaty-pabs-simulation/app/
- **Published Minister’s Brief**: https://sserenity22.github.io/pandemic-treaty-pabs-simulation/minister/
- **Published 12-Slide Proposal**: https://sserenity22.github.io/pandemic-treaty-pabs-simulation/proposal/

---

## 2. Quick Start (Run in 30 Seconds)

1. **Start the local server** from `/Users/sserenity22/Google Deepmind Hackathon`:
   ```bash
   node server.mjs
   ```
2. **Open the Unified Workspace**:
   - Visit [http://localhost:8787/demo-v2/](http://localhost:8787/demo-v2/)

### Using Gemini 2.5 Flash (Optional)
The workspace works **out of the box without an API key** using pre-verified mappings and deterministic legal templates. To enable live **Gemini 2.5 Flash** generation, choose either option:
- **In the browser**: Click **Gemini key** in the top-right bar of `/demo-v2/` and paste your key (saved only in your current browser tab).
- **Via `.env` file**: Copy `.env.example` to `.env`, add `GEMINI_API_KEY=your_key_here`, and restart `node server.mjs`.

---

## 3. What Is Included in the Folder

| Path | Purpose |
| :--- | :--- |
| [`server.mjs`](server.mjs) | Root launcher for the local web server and `/api/gemini/*` proxy on port `8787`. |
| [`.env.example`](.env.example) | Template for setting `GEMINI_API_KEY` and `PORT=8787`. |
| [`pandemic-treaty-pabs-simulation/index.html`](pandemic-treaty-pabs-simulation/index.html) | Main landing page with entry cards for the Unified v2 Workspace, Original Simulation Tool, Minister’s Brief, and 12-Slide Proposal. |
| [`pandemic-treaty-pabs-simulation/demo-v2/index.html`](pandemic-treaty-pabs-simulation/demo-v2/index.html) | **Unified Ministerial & Negotiator Workspace UI** (`demo.css`, `demo.mjs`). |
| [`pandemic-treaty-pabs-simulation/demo-v2/model.mjs`](pandemic-treaty-pabs-simulation/demo-v2/model.mjs) | **Deterministic PABS Engine** — 7 core issues, 6 secondary provisions, 6 blocs, 4 outbreak scenarios, 217-country `covid2()` trajectory calculator, and `findTrades()` solver. |
| [`pandemic-treaty-pabs-simulation/demo-v2/country-data.mjs`](pandemic-treaty-pabs-simulation/demo-v2/country-data.mjs) | **Empirical Country Dataset** — 217 OWID countries (`COUNTRY`), global rollout curve (`WORLD_CUM`), and Pakistan’s negotiation record (`PK_CONTEXT`). |
| [`pandemic-treaty-pabs-simulation/demo-v2/agent.mjs`](pandemic-treaty-pabs-simulation/demo-v2/agent.mjs) | **Gemini 2.5 Flash Agentic Suite** — (1) “Today’s Text” Draft & Bracket Reader, (2) Bridging Clause Copilot, and (3) Ministerial Brief & Defensive Q&A Synthesizer. |
| [`pandemic-treaty-pabs-simulation/demo-v2/model-checks.mjs`](pandemic-treaty-pabs-simulation/demo-v2/model-checks.mjs) | **Automated Verification Suite** — Tests 2,187 package combinations, 217 country trajectories, Trade Finder, and Agent workflows. |
| [`pandemic-treaty-pabs-simulation/demo-v2/video-graphics/`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/) | **Updated Demo Video Graphics** — 8 1920×1080 PNG and editable SVG scenes (`01-opening` through `08-community-protection`), contact sheet, and shot map. |
| [`pandemic-treaty-pabs-simulation/app/`](pandemic-treaty-pabs-simulation/app/) | Original standalone Negotiator Simulation Tool. |
| [`pandemic-treaty-pabs-simulation/minister/`](pandemic-treaty-pabs-simulation/minister/) | Original standalone Minister’s Brief (test version). |
| [`pandemic-treaty-pabs-simulation/proposal/`](pandemic-treaty-pabs-simulation/proposal/) | 12-slide proposal deck. |

---

## 4. Step-by-Step Guide to the 5 Workspace Views (`/demo-v2/`)

### Left Sidebar: Always-Visible Controls & Live Status
- **Country & Group Context**: Pick any of **217 countries** (defaults to **Pakistan**) and your **negotiating bloc** (`Group for Equity`, `Africa Group +`, `EU`, `CH·NO·JP·UK·CA`, `Pharma (IFPMA)`, or `Civil society`).
- **Outbreak Scenario**: Switch between **COVID-type** (13B doses), **Novel-X** (6B doses), **H1N1-type** (500M doses), and **Ebola-type PHEIC** (1M doses).
- **Deal Presets**: Jump between 6 benchmark deals (*Term sheet bridge*, *30 Apr unbracketed text*, *EU hybrid*, *Africa Plus federated*, *Equity maximal*, *EU/pharma minimal*).
- **Live Multilateral Verdict**: Shows at a glance whether all 4 State Blocs can sign (`SIGNABLE` vs. `NOT SIGNABLE`), global doses to WHO, manufacturer participation %, and bloc scores.

### The 5 Workspace Views

1. **`01 Ministerial briefing`**
   - Answers three cabinet questions for your selected country:
     1. *Does it help me politically?* (Headline you can announce, likely attack line, and bloc red lines).
     2. *Does it help my country?* (Extra WHO doses at 6 and 12 months, donated vs. affordable split, and dollar value).
     3. *Will it get through?* (Which state groups pass or block the deal, and manufacturer sign-up rate).
   - **COVID-19 vs. COVID 2.0 Trajectory Chart**: Compares your country’s actual 2020–22 vaccination rollout against what the current PABS package would deliver.
   - **Gemini Ministerial Brief & Q&A Synthesizer**: Click **Synthesize Cabinet brief & Q&A** to generate a tailored 90-second IGWG plenary intervention and 3 defensive Q&As grounded strictly in the model’s numbers.

2. **`02 Today’s text · Agent` (Slide 8 Prototype)**
   - **Load a room draft or paste your own text**: Choose from 4 built-in negotiating texts (*WHA79 On-Screen Text A79/8*, *IGWG-9 Chair’s Bridge*, *Equity & Africa Plus Joint Draft*, *EU Hybrid Deck*) or paste any new room proposal.
   - **Read & Map with Citations**: Click **Read & map text to model**. Gemini extracts verbatim quotes, paragraph references, and bracket status for all 7 core issues and 6 secondary provisions.
   - **Human-in-the-Loop Review**: Inspect or override any mapped position in the review table, check the **Outside Model Scope** register (clauses like arbitration or governance that aren’t quantitative levers), and click **Apply reviewed mapping to workspace**.

3. **`03 Negotiating package`**
   - Adjust all **7 core term-sheet issues** and **6 secondary provisions** directly.
   - View exact **A79/8 treaty quotes**, see which options trigger a **Red Line (`RL`)** for which bloc, add delegation drafting notes, or share a compact base64 **Package Code**.

4. **`04 Compare & Trade finder`**
   - **Package Comparison Waterfall**: Compare any two packages side-by-side to see how each issue shifts WHO doses and the lowest state bloc’s acceptance score.
   - **Deterministic Trade Finder**: Set your minimum acceptable dose floor (e.g., 80% of current doses) and click **Run Trade Finder** to find the smallest set of clause moves that clears every bloc’s red line.
   - **Gemini Bridging Clause Copilot**: On any suggested trade move, click **Draft bridging clause** to generate clean A79/8 treaty text, a bracketed fallback, and talking points for both Equity/Africa and EU/Industry—then insert the text directly into your package notes.

5. **`05 Blocs, weights & evidence`**
   - Inspect and adjust the **6×7 bloc importance weights** (`0` to `3`), test **model sensitivity sliders** (manufacturer burden tolerance, affordable price discount, consensus threshold), and browse links to the primary WHA79 / IGWG documents and OWID data sources.

---

## 5. Updated Demo Video Graphics & Shot Map (`/demo-v2/video-graphics/`)

Eight editable 1920 × 1080 graphics, with matching PNG exports and an offline-friendly preview gallery at [http://localhost:8787/demo-v2/video-graphics/](http://localhost:8787/demo-v2/video-graphics/).

### Video Graphic Files & Shot Map
| Time | File | Editorial Purpose |
| :--- | :--- | :--- |
| 0–18 s | [`01-opening.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/01-opening.png) / `.svg` | Introduce the objective; reveal title before the globe/network |
| 18–30 s | [`02-bargain.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/02-bargain.png) / `.svg` | Establish the exchange; reveal science, then protection |
| 30–40 s | [`03-national-interest.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/03-national-interest.png) / `.svg` | Introduce the four ministerial briefing questions |
| 40–55 s | [`04-ministerial-briefing.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/04-ministerial-briefing.png) / `.svg` | Show the updated ministerial demonstration and its illustrative status |
| 55–68 s | [`05-compare-packages.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/05-compare-packages.png) / `.svg` | Show the difference under the same assumptions |
| 68–80.5 s | [`06-closing.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/06-closing.png) / `.svg` | Hold the demonstration invitation long enough to read |
| Optional | [`07-vaccine-science.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/07-vaccine-science.png) / `.svg` | Optional AI-illustrated science transition plate with editable text |
| Optional | [`08-community-protection.png`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/08-community-protection.png) / `.svg` | Optional AI-illustrated community transition plate with editable text |
| Overview | [`contact-sheet.jpg`](pandemic-treaty-pabs-simulation/demo-v2/video-graphics/contact-sheet.jpg) | All eight plates at a glance |

---

## 6. How the Math & AI Work Together

- **Zero Hallucinated Numbers**: Every number in the app (doses, coverage curves, manufacturer sign-up %, funds, and bloc acceptance scores) is calculated **100% deterministically** in [`demo-v2/model.mjs`](pandemic-treaty-pabs-simulation/demo-v2/model.mjs).
- **Cited Text & Grounded Drafting**: [`demo-v2/agent.mjs`](pandemic-treaty-pabs-simulation/demo-v2/agent.mjs) uses `gemini-2.5-flash` strictly to read draft treaty text into model levers with verbatim citations, flag out-of-scope legal provisions, draft compromise treaty language, and write briefings using the exact figures supplied by `model.mjs`.

---

## 7. Running Automated Checks

```bash
node pandemic-treaty-pabs-simulation/demo-v2/model-checks.mjs
```
