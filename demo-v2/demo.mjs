import {
  MONTHS,
  COUNTRY,
  PK_CONTEXT,
  BLOCS,
  LEVERS,
  SECONDARY,
  ISSUES,
  W0,
  SECDEF,
  CLAUSE_PRESETS,
  SCEN,
  DEFAULT_ASSUMPTIONS,
  SOURCES,
  clone,
  posOf,
  leversOf,
  model,
  evalBlocs,
  verdictOf,
  covid2,
  findTrades,
  idealFor,
  comparePackages,
  encodePackageCode,
  decodePackageCode,
  formatBriefText,
  serializeWorkspaceSnapshot,
  parseWorkspaceSnapshot,
  fmtD,
  fmt$,
  fmtL,
  fmtPop
} from './model.mjs';

import {
  SAMPLE_TEXTS,
  checkAgentStatus,
  getBrowserApiKey,
  setBrowserApiKey,
  analyzeDraftText,
  draftBridgingClause,
  synthesizeMinisterialBrief
} from './agent.mjs';

/* ==========================================================================
   WORKSPACE STATE
   ========================================================================== */

const state = {
  view: 'briefing',
  countryCode: 'PAK',
  blocKey: 'EQ',
  scenarioKey: 'covid',
  milestoneMonth: 12,
  activePreset: 'unb',
  pkg: Object.assign(clone(CLAUSE_PRESETS[0].p), { notes: {} }),
  weights: clone(W0),
  assumptions: clone(DEFAULT_ASSUMPTIONS),
  savedPackages: [],
  // View 02: Today's Text Agent state
  selectedSampleId: 'igwg9-chair-bridge',
  agentAnalysis: null,
  mappedPkg: Object.assign(clone(CLAUSE_PRESETS[1].p), { notes: {} }),
  // View 04: Trade finder & Bridging Clause Copilot state
  lastTradeResult: null,
  activeClauseDraft: null,
  activeClauseMove: null,
  // View 01: Ministerial brief cache
  lastMinisterialBrief: null
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const qfmt = q => esc(q).replace(/\[|\]/g, m => `<span class="bk">${m}</span>`);

function setStatus(msg) {
  const el = $('#status-line');
  if (el) el.textContent = msg;
}

function loadLocalSavedPackages() {
  try {
    const raw = localStorage.getItem('pal-pkgs');
    if (raw) state.savedPackages = JSON.parse(raw);
    const rawW = localStorage.getItem('pal-w');
    if (rawW) state.weights = JSON.parse(rawW);
  } catch {
    // ignore storage restrictions
  }
}

function detectMatchingPresetKey(pkg) {
  for (const pr of CLAUSE_PRESETS) {
    const sameIssues = ISSUES.every(iss => pr.p.i[iss.id] === pkg.i[iss.id]);
    const sA = Object.assign({}, SECDEF, pr.p.s);
    const sB = Object.assign({}, SECDEF, pkg.s);
    const sameSec = SECONDARY.every(id => sA[id] === sB[id]);
    if (sameIssues && sameSec) return pr.k;
  }
  return 'custom';
}

/* ==========================================================================
   INITIALIZATION & CONTROLS
   ========================================================================== */

function initSidebarControls() {
  // 1. Populate 217 OWID countries sorted alphabetically, with Pakistan at top + selected
  const countryEntries = Object.entries(COUNTRY).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const countrySelect = $('#country-select');
  countrySelect.innerHTML = countryEntries
    .map(([code, c]) => `<option value="${code}"${code === state.countryCode ? ' selected' : ''}>${esc(c.name)} (${code})</option>`)
    .join('');
  countrySelect.onchange = () => {
    state.countryCode = countrySelect.value;
    // Automatically align default bloc if user switches to a known regional country, while keeping manual override open
    updateAll({ refreshBrief: true });
    setStatus(`Switched national delegation view to ${COUNTRY[state.countryCode].name} (${state.countryCode}).`);
  };

  // 2. Populate 6 Blocs
  const blocSelect = $('#bloc-select');
  blocSelect.innerHTML = BLOCS.map(
    b => `<option value="${b.k}"${b.k === state.blocKey ? ' selected' : ''}>${esc(b.n)} (${b.party ? 'Party' : 'non-Party'})</option>`
  ).join('');
  blocSelect.onchange = () => {
    state.blocKey = blocSelect.value;
    updateAll({ refreshBrief: true });
    setStatus(`Switched perspective bloc to ${BLOCS.find(b => b.k === state.blocKey).n}.`);
  };

  // 3. Populate 4 Outbreak Scenarios
  const scenSelect = $('#scenario-select');
  scenSelect.innerHTML = SCEN.map(
    s => `<option value="${s.k}"${s.k === state.scenarioKey ? ' selected' : ''}>${esc(s.n)} (${s.type === 'pheic' ? 'PHEIC' : 'Pandemic'})</option>`
  ).join('');
  scenSelect.onchange = () => {
    state.scenarioKey = scenSelect.value;
    updateAll({ refreshBrief: true });
    setStatus(`Switched outbreak scenario to ${SCEN.find(s => s.k === state.scenarioKey).n}.`);
  };

  // 4. View navigation tabs
  $$('.view-tab').forEach(btn => {
    btn.onclick = () => switchView(btn.dataset.view);
  });
  $$('[data-goto-view]').forEach(btn => {
    btn.onclick = () => switchView(btn.dataset.gotoView);
  });

  // 5. Milestone horizon pills on View 01
  $$('.horizon-pill').forEach(btn => {
    btn.onclick = () => {
      state.milestoneMonth = Number(btn.dataset.month);
      $$('.horizon-pill').forEach(b => b.classList.toggle('is-active', b === btn));
      renderBriefingView();
    };
  });

  // 6. API Key drawer
  const keyDrawer = $('#key-drawer');
  const keyInput = $('#browser-api-key');
  keyInput.value = getBrowserApiKey();
  $('#open-key-modal').onclick = () => {
    keyDrawer.hidden = !keyDrawer.hidden;
  };
  $('#save-api-key').onclick = async () => {
    setBrowserApiKey(keyInput.value);
    keyDrawer.hidden = true;
    await refreshAgentStatusBanner();
    setStatus('Updated Gemini API key for this browser session.');
  };
  $('#clear-api-key').onclick = async () => {
    keyInput.value = '';
    setBrowserApiKey('');
    await refreshAgentStatusBanner();
    setStatus('Cleared browser Gemini API key; using built-in A79/8 citation & template engine.');
  };

  // 7. Save / Load / Reset Workspace JSON
  $('#save-snapshot').onclick = () => {
    const json = serializeWorkspaceSnapshot(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pabs-workspace-${state.countryCode.toLowerCase()}-${state.activePreset || 'custom'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported workspace snapshot for ${COUNTRY[state.countryCode].name}.`);
  };

  $('#load-snapshot-trigger').onclick = () => $('#load-snapshot-input').click();
  $('#load-snapshot-input').onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const loaded = parseWorkspaceSnapshot(text);
      state.countryCode = loaded.countryCode;
      state.blocKey = loaded.blocKey;
      state.scenarioKey = loaded.scenarioKey;
      state.activePreset = loaded.activePreset;
      state.pkg = loaded.pkg;
      state.weights = loaded.weights;
      state.assumptions = loaded.assumptions;
      $('#country-select').value = state.countryCode;
      $('#bloc-select').value = state.blocKey;
      $('#scenario-select').value = state.scenarioKey;
      syncSlidersFromAssumptions();
      updateAll({ refreshBrief: true });
      setStatus(`Loaded workspace snapshot from ${file.name}.`);
    } catch (err) {
      setStatus(`Could not load snapshot: ${err.message}`);
    }
    e.target.value = '';
  };

  $('#reset-workspace').onclick = () => {
    state.countryCode = 'PAK';
    state.blocKey = 'EQ';
    state.scenarioKey = 'covid';
    state.activePreset = 'unb';
    state.pkg = Object.assign(clone(CLAUSE_PRESETS[0].p), { notes: {} });
    state.weights = clone(W0);
    state.assumptions = clone(DEFAULT_ASSUMPTIONS);
    $('#country-select').value = 'PAK';
    $('#bloc-select').value = 'EQ';
    $('#scenario-select').value = 'covid';
    syncSlidersFromAssumptions();
    updateAll({ refreshBrief: true });
    setStatus('Reset workspace to Pakistan (Group for Equity) & 30 April 2026 unbracketed baseline.');
  };
}

export function switchView(viewName) {
  state.view = viewName;
  $$('.view-tab').forEach(btn => {
    btn.setAttribute('aria-selected', String(btn.dataset.view === viewName));
  });
  $$('.view-panel').forEach(panel => {
    panel.hidden = panel.id !== `view-${viewName}`;
  });
  if (viewName === 'compare') {
    populateCompareDropdowns();
    renderCompareAndTradesView();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function refreshAgentStatusBanner() {
  const status = await checkAgentStatus();
  const dot = $('#agent-status-dot');
  const title = $('#agent-status-title');
  const sub = $('#agent-status-sub');
  if (status.mode === 'server-gemini') {
    dot.className = 'status-dot is-live';
    title.textContent = `${status.model} · Live (.env)`;
    sub.textContent = 'Connected to local server.mjs proxy';
  } else if (status.mode === 'browser-gemini') {
    dot.className = 'status-dot is-live';
    title.textContent = `${status.model} · Live (Browser Key)`;
    sub.textContent = 'Direct Gemini REST API active';
  } else {
    dot.className = 'status-dot';
    title.textContent = 'A79/8 Citation & Copilot Engine';
    sub.textContent = 'Ready (instant verified mode · add key for live LLM)';
  }
}

function applyPreset(presetKey) {
  const found = CLAUSE_PRESETS.find(p => p.k === presetKey);
  if (!found) return;
  const existingNotes = state.pkg.notes || {};
  state.pkg = Object.assign(clone(found.p), { notes: existingNotes });
  state.activePreset = presetKey;
  updateAll({ refreshBrief: true });
  setStatus(`Loaded preset package: "${found.n}".`);
}

function renderPresetBars() {
  state.activePreset = detectMatchingPresetKey(state.pkg);
  const activeObj = CLAUSE_PRESETS.find(p => p.k === state.activePreset);
  $('#active-preset-badge').textContent = activeObj ? activeObj.short : 'Custom draft';

  const makeButtons = containerSelector => {
    const box = $(containerSelector);
    if (!box) return;
    box.innerHTML = CLAUSE_PRESETS.map(
      p => `<button type="button" class="preset-chip${state.activePreset === p.k ? ' is-active' : ''}" data-preset="${p.k}" title="${esc(p.desc)}">${esc(p.n)}</button>`
    ).join('');
    box.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => applyPreset(btn.dataset.preset);
    });
  };

  makeButtons('#sidebar-preset-buttons');
  makeButtons('#briefing-preset-bar');
  makeButtons('#package-preset-bar');
}

/* ==========================================================================
   PERSISTENT TOP SUMMARY STRIP & SIDEBAR CONTEXT
   ========================================================================== */

function renderSummaryStrip() {
  const c2 = covid2(state.pkg, state.countryCode, state.assumptions);
  const sc = SCEN.find(s => s.k === state.scenarioKey) || SCEN[2];
  const m = model(state.pkg, sc, {}, state.assumptions);
  const ev = evalBlocs(state.pkg, state.weights, state.assumptions);
  const v = verdictOf(ev);
  const bloc = BLOCS.find(b => b.k === state.blocKey) || BLOCS[0];

  $('#delegation-meta').innerHTML = `
    <span>Pop: <strong>${fmtPop(c2.country.pop)}</strong></span>
    <span>COVID-19 1st dose: <strong>${c2.country.first || 'N/A'}</strong></span>
    <span>Bloc: <strong>${esc(bloc.k)}</strong></span>
  `;

  const vBox = $('#strip-verdict-box');
  vBox.className = `strip-item strip-verdict ${v.signable ? 'is-good' : 'is-bad'}`;
  $('#strip-verdict-title').textContent = v.signable ? 'Signable by all 4 Parties' : 'Not signable yet';
  $('#strip-verdict-sub').textContent = v.signable
    ? `All 4 state blocs ≥ ${state.assumptions.thr} (lowest: ${v.minP}/100)`
    : `Blocked by ${v.blocking.map(x => x.b.k).join(', ')} (lowest: ${v.minP}/100)`;

  $('#strip-country-label').textContent = `${c2.country.name} PABS supply (24m)`;
  $('#strip-country-doses').textContent = `${fmtD(c2.extraEnd / 1e6)} doses`;
  $('#strip-country-sub').textContent = `${fmtD(c2.donatedDosesEnd / 1e6)} free + ${fmtD(c2.affordableDosesEnd / 1e6)} affordable`;

  $('#strip-cov6').textContent = `${c2.gap6mActual.toFixed(1)}% → ${c2.gap6mWithPabs.toFixed(1)}%`;
  $('#strip-cov6-sub').textContent = `+${c2.gain6mPoints} pts at 6m (12m: +${c2.gain12mPoints} pts)`;

  $('#strip-scen-label').textContent = `Global WHO pool (${sc.n})`;
  $('#strip-global-doses').textContent = `${fmtD(m.doses)} doses`;
  $('#strip-uptake-sub').textContent = m.inPABS
    ? `Manufacturer uptake: ${Math.round(m.p * 100)}% · PABS fund ${fmt$(m.fundB)}`
    : `Routed to PIP Framework (influenza excluded)`;
}

/* ==========================================================================
   VIEW 01: MINISTERIAL BRIEFING (COUNTRY COVID-2 CHART + BRIEF COPILOT)
   ========================================================================== */

function buildCountryTrajectorySVG(c2, milestoneIdx = 12) {
  const W = 640;
  const H = 265;
  const pl = 44;
  const pr = 18;
  const pt = 18;
  const pb = 34;
  const plotW = W - pl - pr;
  const plotH = H - pt - pb;

  const X = m => pl + (m / 24) * plotW;
  const Y = val => pt + (1 - Math.min(100, Math.max(0, val)) / 100) * plotH;

  const path1 = c2.cov1.map((v, m) => `${m ? 'L' : 'M'}${X(m).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const path2 = c2.cov2.map((v, m) => `${m ? 'L' : 'M'}${X(m).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const areaPath = `${path2} L${X(24).toFixed(1)} ${Y(c2.cov1[24]).toFixed(1)} ${c2.cov1
    .slice()
    .reverse()
    .map((v, idx) => `L${X(24 - idx).toFixed(1)} ${Y(v).toFixed(1)}`)
    .join(' ')} Z`;

  let grid = '';
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = Y(pct).toFixed(1);
    grid += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="rgba(22,32,30,0.09)" />`;
    grid += `<text x="${pl - 7}" y="${Number(y) + 4}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#64706c">${pct}%</text>`;
  });

  [0, 6, 12, 18, 24].forEach(m => {
    const x = X(m).toFixed(1);
    const label = MONTHS[m].slice(0, 7);
    grid += `<line x1="${x}" x2="${x}" y1="${pt}" y2="${H - pb}" stroke="rgba(22,32,30,0.06)" />`;
    grid += `<text x="${x}" y="${H - 10}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#64706c">${label}</text>`;
  });

  const mx = X(milestoneIdx).toFixed(1);
  const my1 = Y(c2.cov1[milestoneIdx]).toFixed(1);
  const my2 = Y(c2.cov2[milestoneIdx]).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="COVID-19 actual vs COVID-2 PABS coverage trajectory for ${esc(c2.country.name)}">
    ${grid}
    <path d="${areaPath}" fill="rgba(14, 91, 117, 0.14)" />
    <path d="${path1}" fill="none" stroke="#7c8582" stroke-width="2" stroke-dasharray="4 3" />
    <path d="${path2}" fill="none" stroke="#0e5b75" stroke-width="2.6" />
    <line x1="${mx}" x2="${mx}" y1="${pt}" y2="${H - pb}" stroke="#a1302a" stroke-width="1.5" stroke-dasharray="3 3" />
    <circle cx="${mx}" cy="${my1}" r="4.5" fill="#7c8582" stroke="#fff" stroke-width="1.5" />
    <circle cx="${mx}" cy="${my2}" r="5.5" fill="#0e5b75" stroke="#fff" stroke-width="1.5" />
    <text x="${pl + 10}" y="${pt + 16}" font-family="JetBrains Mono, monospace" font-size="11" fill="#0e5b75" font-weight="600">― With this PABS package (COVID-2)</text>
    <text x="${pl + 250}" y="${pt + 16}" font-family="JetBrains Mono, monospace" font-size="11" fill="#64706c">-- Actual COVID-19 (OWID)</text>
  </svg>`;
}

function renderBlocMetersHTML(ev) {
  return ev
    .map(x => {
      const isSelected = x.b.k === state.blocKey;
      const color = x.rls.length ? '#a1302a' : x.score >= state.assumptions.thr ? '#25631c' : '#b87314';
      return `<div class="bloc-meter-row${isSelected ? ' is-active-bloc' : ''}">
        <span><strong>${esc(x.b.n)}</strong> <span class="bloc-party-tag">${x.b.party ? 'Party' : 'non-Party'}</span></span>
        <span class="meter-track"><i class="meter-fill" style="width:${x.score}%;background:${color}"></i></span>
        <span class="num" style="text-align:right;font-weight:600">${x.score}${x.rls.length ? '⚑' : ''}</span>
      </div>`;
    })
    .join('');
}

function renderBriefingView() {
  const c2 = covid2(state.pkg, state.countryCode, state.assumptions);
  const sc = SCEN.find(s => s.k === state.scenarioKey) || SCEN[2];
  const m = model(state.pkg, sc, {}, state.assumptions);
  const ev = evalBlocs(state.pkg, state.weights, state.assumptions);
  const v = verdictOf(ev);
  const bloc = BLOCS.find(b => b.k === state.blocKey) || BLOCS[0];
  const mIdx = state.milestoneMonth;

  $('#briefing-eyebrow').textContent = `01 · Ministerial Briefing · ${c2.country.name} (${bloc.n})`;
  $('#briefing-title').textContent = `If a COVID-2 hits tomorrow, what does this PABS text deliver to ${c2.country.name}?`;
  $('#chart-country-heading').textContent = `${c2.country.name}: Population vaccine coverage over 24 months (Dec 2020 – Dec 2022)`;

  $('#briefing-kpis').innerHTML = `
    <div class="kpi-card">
      <span class="eyebrow">PABS supply to ${esc(c2.country.name)} (24m)</span>
      <div class="kpi-val">${fmtD(c2.extraEnd / 1e6)} doses</div>
      <div class="kpi-sub">${fmtD(c2.donatedDosesEnd / 1e6)} free donation + ${fmtD(c2.affordableDosesEnd / 1e6)} not-for-profit</div>
    </div>
    <div class="kpi-card">
      <span class="eyebrow">Coverage at ${mIdx}m (${MONTHS[mIdx].slice(0, 7)})</span>
      <div class="kpi-val">${c2.cov1[mIdx].toFixed(1)}% → ${c2.cov2[mIdx].toFixed(1)}%</div>
      <div class="kpi-sub">+${(c2.cov2[mIdx] - c2.cov1[mIdx]).toFixed(1)} percentage points over COVID-19</div>
    </div>
    <div class="kpi-card">
      <span class="eyebrow">First supply arrival</span>
      <div class="kpi-val">Day ${c2.firstDay2}</div>
      <div class="kpi-sub">${c2.firstDay1 != null ? `vs Day ${c2.firstDay1} in COVID-19 (${c2.daysSaved}d faster)` : 'Within 30 days of first global authorization'}</div>
    </div>
    <div class="kpi-card">
      <span class="eyebrow">Two-signature viability (${esc(sc.n)})</span>
      <div class="kpi-val" style="color:${v.signable ? 'var(--good)' : 'var(--bad)'}">${v.signable ? 'Signable' : 'Blocked'} · ${Math.round(m.p * 100)}% mfr</div>
      <div class="kpi-sub">Lowest Party: ${v.minP}/100 · Global WHO pool: ${fmtD(m.doses)}</div>
    </div>
  `;

  $('#country-covid2-chart').innerHTML = buildCountryTrajectorySVG(c2, mIdx);
  const extraAtM = c2.extra(mIdx) / 1e6;
  $('#country-chart-caption').innerHTML = `At <strong>month ${mIdx} (${MONTHS[mIdx]})</strong>, ${esc(c2.country.name)} recorded <strong>${c2.cov1[mIdx].toFixed(1)}%</strong> coverage in COVID-19. With this PABS package, <strong>${fmtD(extraAtM)} cumulative WHO PABS doses</strong> arrive by month ${mIdx} (${(c2.myShare * 100).toFixed(2)}% population share of the 4.17B developing-country pool), lifting coverage to <strong>${c2.cov2[mIdx].toFixed(1)}%</strong>.`;

  $('#briefing-bloc-meters').innerHTML = renderBlocMetersHTML(ev);
  const rls = ev.filter(x => x.rls.length);
  $('#briefing-redlines').innerHTML = rls.length
    ? rls.map(x => `<span>⚑ <strong>${esc(x.b.n)}</strong>${x.b.party ? '' : ' (non-Party)'}: ${esc(x.rls.join('; '))}</span>`).join('')
    : `<span style="color:var(--good);font-weight:600">✓ Zero coded red lines tripped across all 6 blocs.</span>`;

  const maxPkg = CLAUSE_PRESETS.find(p => p.k === 'max').p;
  const bridgePkg = CLAUSE_PRESETS.find(p => p.k === 'bridge').p;
  const c2Max = covid2(maxPkg, state.countryCode, state.assumptions);
  const c2Bridge = covid2(bridgePkg, state.countryCode, state.assumptions);
  $('#briefing-tradeoff-note').innerHTML = `<strong>The Hardline Paradox for ${esc(c2.country.name)}:</strong> Under the <em>Equity maximal</em> package, commercial burden rises so high that manufacturer uptake falls to <strong>${Math.round(c2Max.r.p * 100)}%</strong> (${fmtD(c2Max.extraEnd / 1e6)} doses for ${esc(c2.country.name)}) and EU/G6 block adoption. Under the <em>Term sheet bridge</em>, <strong>${Math.round(c2Bridge.r.p * 100)}%</strong> of manufacturers sign, all 4 state blocs clear 50/100, and ${esc(c2.country.name)} receives <strong>${fmtD(c2Bridge.extraEnd / 1e6)} doses</strong>.`;

  // Country negotiation record
  $('#country-record-eyebrow').textContent = `Empirical OWID baseline & negotiation record · ${c2.country.name} (${state.countryCode})`;
  $('#country-record-title').textContent = `${c2.country.name} in COVID-19 and in the PABS Annex negotiations`;
  if (state.countryCode === 'PAK') {
    $('#country-context-body').innerHTML = PK_CONTEXT;
  } else {
    $('#country-context-body').innerHTML = `
      <div>
        <h3>${esc(c2.country.name)} in COVID-19 (Our World in Data)</h3>
        <p><strong>Population (2021):</strong> ${ c2.country.pop.toLocaleString() } (${(c2.myShare * 100).toFixed(2)}% of the 4.17 billion developing-country PABS allocation pool).</p>
        <p><strong>First recorded vaccine dose:</strong> ${esc(c2.country.first || 'Not recorded in OWID')} (${c2.firstDay1 != null ? `${c2.firstDay1} days after the first global authorization on 8 Dec 2020` : 'timing unrecorded'}).</p>
        <p><strong>Rollout trajectory:</strong> 6-month coverage (June 2021) stood at <strong>${c2.gap6mActual.toFixed(1)}%</strong>; 12-month coverage (Dec 2021) reached <strong>${c2.gap12mActual.toFixed(1)}%</strong>; 24-month coverage (Dec 2022) reached <strong>${c2.cov1[24].toFixed(1)}%</strong>.</p>
        <p><strong>Estimated excess mortality (2020–2021):</strong> ${c2.country.deaths != null ? `${c2.country.deaths.toLocaleString()} excess deaths (${c2.country.deaths_pm} per million people, WHO estimate via OWID)` : 'Not separately reported in the WHO/OWID excess-mortality series'}.</p>
      </div>
      <div>
        <h3>Aligned Bloc Posture: ${esc(bloc.n)}</h3>
        <p>${esc(bloc.d)}</p>
        <p><strong>How this workspace models ${esc(c2.country.name)}:</strong> You can test any package from ${esc(c2.country.name)}’s national perspective while adjusting ${esc(bloc.n)}’s priority weights on View 05. Switch back to <strong>Pakistan (PAK)</strong> at any time to view the full verbatim IGWG-6 / IGWG-7 / WHA79 EMRO intervention record.</p>
      </div>
    `;
  }
}

async function refreshMinisterialBrief() {
  const out = $('#ministerial-brief-output');
  if (!out) return;
  const brief = await synthesizeMinisterialBrief(state.countryCode, state.blocKey, state.pkg, state.scenarioKey);
  state.lastMinisterialBrief = brief;
  $('#brief-agent-source').textContent = brief.engineSource || 'Grounded in model.mjs';

  out.innerHTML = `
    <div class="brief-box">
      <span class="eyebrow">Cabinet Bottom Line</span>
      <h4 style="margin-top:3px">${esc(brief.headline)}</h4>
      <ul class="brief-list" style="margin-top:8px">
        ${(brief.executiveSummary || []).map(item => `<li>${esc(item)}</li>`).join('')}
      </ul>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
        <span class="eyebrow">90-Second IGWG Plenary Intervention</span>
        <p style="font-family:var(--serif);font-size:14px;line-height:1.55;margin-top:5px;color:var(--ink)">“${esc(brief.plenaryIntervention)}”</p>
      </div>
    </div>
    <div class="brief-box">
      <span class="eyebrow">Defensive Q&amp;A (Press, Parliament &amp; Bilateral Room)</span>
      <div style="margin-top:6px">
        ${(brief.defensiveQA || [])
          .map(
            qa => `<div class="qa-item">
              <strong>Q: ${esc(qa.question)}</strong>
              <p class="muted-copy">A: ${esc(qa.answer)}</p>
            </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

function initBriefingEvents() {
  $('#generate-ministerial-brief').onclick = async () => {
    $('#brief-agent-source').textContent = 'Synthesizing from model.mjs…';
    await refreshMinisterialBrief();
    setStatus(`Synthesized Cabinet brief & Q&A for ${COUNTRY[state.countryCode].name}.`);
  };
  $('#copy-ministerial-brief').onclick = () => {
    if (!state.lastMinisterialBrief) return;
    const b = state.lastMinisterialBrief;
    const text = [
      b.headline,
      '',
      'EXECUTIVE SUMMARY',
      ...(b.executiveSummary || []).map(x => `- ${x}`),
      '',
      'PLENARY INTERVENTION',
      `"${b.plenaryIntervention}"`,
      '',
      'DEFENSIVE Q&A',
      ...(b.defensiveQA || []).map(q => `Q: ${q.question}\nA: ${q.answer}\n`)
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setStatus('Copied Ministerial Brief & Q&A to clipboard.');
  };
}

/* ==========================================================================
   VIEW 02: TODAY'S TEXT · AGENT (SLIDE 8 WORKFLOW)
   ========================================================================== */

function initAgentView() {
  const sampleBtnsBox = $('#sample-text-buttons');
  sampleBtnsBox.innerHTML = SAMPLE_TEXTS.map(
    s => `<button type="button" class="preset-chip${s.id === state.selectedSampleId ? ' is-active' : ''}" data-sample="${s.id}">${esc(s.badge)}: ${esc(s.title.split('—')[0].trim())}</button>`
  ).join('');

  const loadSample = async sampleId => {
    const sample = SAMPLE_TEXTS.find(s => s.id === sampleId) || SAMPLE_TEXTS[0];
    state.selectedSampleId = sample.id;
    $$('#sample-text-buttons .preset-chip').forEach(b => b.classList.toggle('is-active', b.dataset.sample === sample.id));
    $('#sample-source-badge').textContent = sample.source;
    $('#sample-text-desc').textContent = sample.description;
    $('#draft-text-input').value = sample.text;
    await executeDraftTextAnalysis(sample.text, sample.id, false);
  };

  sampleBtnsBox.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => loadSample(btn.dataset.sample);
  });

  $('#run-text-agent').onclick = async () => {
    const raw = $('#draft-text-input').value;
    const matchingSample = SAMPLE_TEXTS.find(s => s.text.trim() === raw.trim());
    await executeDraftTextAnalysis(raw, matchingSample ? matchingSample.id : null, true);
    setStatus('Analyzed draft text, extracted citations, and updated deterministic impact preview.');
  };

  $('#apply-mapped-package').onclick = () => {
    state.pkg = clone(state.mappedPkg);
    updateAll({ refreshBrief: true });
    setStatus('Applied mapped positions from Today’s Text into active workspace package.');
  };

  $('#apply-mapped-and-view').onclick = () => {
    state.pkg = clone(state.mappedPkg);
    updateAll({ refreshBrief: true });
    switchView('package');
    setStatus('Applied mapped positions and opened Clause-Level Package Builder.');
  };

  // Initial load with IGWG-9 Chair's Bridging Non-Paper
  loadSample(state.selectedSampleId);
}

async function executeDraftTextAnalysis(rawText, sampleId = null, preferLive = false) {
  $('#text-agent-source-tag').textContent = 'Analyzing clauses…';
  const analysis = await analyzeDraftText(rawText, { sampleId, preferLive });
  state.agentAnalysis = analysis;
  $('#text-agent-source-tag').textContent = analysis.engineSource || 'Mapped';

  // Populate mappedPkg from analysis
  const nextPkg = { i: {}, s: Object.assign({}, SECDEF), notes: clone(state.pkg.notes || {}) };
  ISSUES.forEach(iss => {
    const mapped = analysis.issues && analysis.issues[iss.id];
    nextPkg.i[iss.id] = mapped && iss.pos.some(p => p.k === mapped.pos) ? mapped.pos : 'a';
  });
  SECONDARY.forEach(id => {
    const mapped = analysis.secondary && analysis.secondary[id];
    nextPkg.s[id] = mapped && LEVERS[id].opts[mapped.opt] ? mapped.opt : SECDEF[id];
  });
  state.mappedPkg = nextPkg;

  renderAgentMappingTables();
  renderAgentDiffPreview();
}

function renderAgentMappingTables() {
  const analysis = state.agentAnalysis;
  if (!analysis) return;

  // 1. 7 Core Issues Table with Delegation Override Selectors
  const issuesTable = $('#agent-issues-table');
  issuesTable.innerHTML = `
    <thead>
      <tr>
        <th style="width:18%">Contested Issue</th>
        <th style="width:36%">Extracted Quote &amp; Citation</th>
        <th style="width:14%">Confidence &amp; Brackets</th>
        <th style="width:32%">Mapped Position (Delegation Override)</th>
      </tr>
    </thead>
    <tbody>
      ${ISSUES.map(iss => {
        const info = (analysis.issues && analysis.issues[iss.id]) || {};
        const curKey = state.mappedPkg.i[iss.id];
        const confClass =
          info.confidence === 'high' ? 'conf-high' : info.confidence === 'ambiguous' ? 'conf-ambiguous' : 'conf-medium';
        return `<tr>
          <td>
            <strong>${iss.n}. ${esc(iss.title)}</strong><br>
            <span class="mono-badge" style="display:inline-block;margin-top:4px">${esc(info.clauseRef || iss.ref)}</span>
          </td>
          <td>
            <div class="quote-snippet">“${qfmt(info.quote || '')}”</div>
            <div class="muted-copy" style="font-size:12px;margin-top:4px">${esc(info.rationale || '')}</div>
          </td>
          <td>
            <span class="conf-badge ${confClass}">${esc(info.confidence || 'high')}</span><br>
            <small class="muted-copy" style="display:block;margin-top:4px">${esc(info.bracketStatus || 'mapped')}</small>
          </td>
          <td>
            <select class="control-select agent-issue-override" data-issue="${iss.id}" aria-label="Override mapped position for ${esc(iss.title)}">
              ${iss.pos
                .map(
                  p => `<option value="${p.k}"${p.k === curKey ? ' selected' : ''}>(${p.k.toUpperCase()}) ${esc(p.lab)} [${esc(p.who)}]</option>`
                )
                .join('')}
            </select>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  `;

  issuesTable.querySelectorAll('.agent-issue-override').forEach(sel => {
    sel.onchange = () => {
      state.mappedPkg.i[sel.dataset.issue] = sel.value;
      renderAgentDiffPreview();
    };
  });

  // 2. 6 Secondary Levers Table
  const secTable = $('#agent-secondary-table');
  secTable.innerHTML = `
    <thead>
      <tr>
        <th>Provision</th>
        <th>Citation &amp; Quote</th>
        <th>Mapped Setting (Override)</th>
      </tr>
    </thead>
    <tbody>
      ${SECONDARY.map(id => {
        const L = LEVERS[id];
        const info = (analysis.secondary && analysis.secondary[id]) || {};
        const curOpt = state.mappedPkg.s[id];
        return `<tr>
          <td><strong>${esc(L.title)}</strong><br><span class="mono-badge">${esc(info.clauseRef || L.ref)}</span></td>
          <td><div class="quote-snippet">“${qfmt(info.quote || '')}”</div></td>
          <td>
            <select class="control-select agent-sec-override" data-sec="${id}">
              ${Object.entries(L.opts)
                .map(([k, o]) => `<option value="${k}"${k === curOpt ? ' selected' : ''}>${esc(o.lab)}</option>`)
                .join('')}
            </select>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  `;

  secTable.querySelectorAll('.agent-sec-override').forEach(sel => {
    sel.onchange = () => {
      state.mappedPkg.s[sel.dataset.sec] = sel.value;
      renderAgentDiffPreview();
    };
  });

  // 3. Outside Model Scope Register
  const oosBox = $('#agent-out-of-scope-list');
  const oos = analysis.outOfScope || [];
  oosBox.innerHTML = oos.length
    ? oos
        .map(
          (item, idx) => `<div class="oos-item">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <strong>${esc(item.category)}</strong>
              <span class="mono-badge">${esc(item.clauseRef)}</span>
            </div>
            <div class="quote-snippet">“${qfmt(item.quote)}”</div>
            <p class="muted-copy" style="font-size:12.5px;margin-top:5px"><strong>Why outside the 13 quantitative levers:</strong> ${esc(item.whyUnmodelled)}</p>
            <div class="inline-actions" style="margin-top:6px">
              <button type="button" class="mini-button attach-oos-btn" data-idx="${idx}">+ Attach to package notes</button>
            </div>
          </div>`
        )
        .join('')
    : `<p class="muted-copy">No additional unmodelled provisions detected.</p>`;

  oosBox.querySelectorAll('.attach-oos-btn').forEach(btn => {
    btn.onclick = () => {
      const item = oos[Number(btn.dataset.idx)];
      if (!item) return;
      state.mappedPkg.notes.abs = `${state.mappedPkg.notes.abs ? state.mappedPkg.notes.abs + '\n' : ''}[Out-of-Scope Flag · ${item.clauseRef}]: ${item.suggestedNote || item.whyUnmodelled}`;
      state.pkg.notes.abs = state.mappedPkg.notes.abs;
      btn.textContent = '✓ Attached to Issue 7 notes';
      setStatus(`Attached out-of-scope note (${item.clauseRef}) to package notes.`);
    };
  });
}

function renderAgentDiffPreview() {
  const box = $('#agent-diff-preview');
  if (!box) return;
  const sc = SCEN.find(s => s.k === state.scenarioKey) || SCEN[2];
  const mCur = model(state.pkg, sc, {}, state.assumptions);
  const mMap = model(state.mappedPkg, sc, {}, state.assumptions);
  const evCur = evalBlocs(state.pkg, state.weights, state.assumptions);
  const evMap = evalBlocs(state.mappedPkg, state.weights, state.assumptions);
  const vCur = verdictOf(evCur);
  const vMap = verdictOf(evMap);
  const c2Cur = covid2(state.pkg, state.countryCode, state.assumptions);
  const c2Map = covid2(state.mappedPkg, state.countryCode, state.assumptions);

  const summaryText = (state.agentAnalysis && state.agentAnalysis.summary) || '';

  box.innerHTML = `
    <p class="muted-copy" style="margin-bottom:10px">${esc(summaryText)}</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Metric (${esc(sc.n)})</th>
          <th>Current Workspace</th>
          <th>Mapped Draft Text</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Parties’ Verdict</strong></td>
          <td>${vCur.signable ? '<span class="gain-tag">Signable</span>' : '<span class="loss-tag">Not signable</span>'} (${vCur.minP}/100)</td>
          <td>${vMap.signable ? '<span class="gain-tag">Signable</span>' : '<span class="loss-tag">Not signable</span>'} (${vMap.minP}/100)</td>
        </tr>
        <tr>
          <td><strong>${esc(c2Map.country.name)} PABS Doses (24m)</strong></td>
          <td class="num">${fmtD(c2Cur.extraEnd / 1e6)}</td>
          <td class="num"><strong>${fmtD(c2Map.extraEnd / 1e6)}</strong> (6m cov: ${c2Map.gap6mWithPabs.toFixed(1)}%)</td>
        </tr>
        <tr>
          <td><strong>Global Doses to WHO</strong></td>
          <td class="num">${fmtD(mCur.doses)}</td>
          <td class="num"><strong>${fmtD(mMap.doses)}</strong></td>
        </tr>
        <tr>
          <td><strong>Manufacturers Signing</strong></td>
          <td class="num">${mCur.inPABS ? Math.round(mCur.p * 100) + '%' : 'PIP'}</td>
          <td class="num"><strong>${mMap.inPABS ? Math.round(mMap.p * 100) + '%' : 'PIP'}</strong></td>
        </tr>
        <tr>
          <td><strong>Bloc Scores (EQ · AF · EU · G6)</strong></td>
          <td class="num">${evCur.slice(0, 4).map(x => `${x.b.k}:${x.score}`).join(' · ')}</td>
          <td class="num"><strong>${evMap.slice(0, 4).map(x => `${x.b.k}:${x.score}`).join(' · ')}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
}

/* ==========================================================================
   VIEW 03: NEGOTIATING PACKAGE BUILDER & PARTICIPATION CURVE
   ========================================================================== */

function buildParticipationCurveSVG(sc, r) {
  const W = 350;
  const H = 148;
  const pl = 36;
  const pr = 10;
  const pt = 10;
  const pb = 26;
  const xs = [];
  for (let s = 0; s <= 0.4001; s += 0.01) xs.push(s);
  const ys = xs.map(s => model(state.pkg, sc, { s }, state.assumptions).doses);
  const ymax = Math.max(...ys, r.doses) * 1.12 || 1;
  const X = s => pl + (s / 0.4) * (W - pl - pr);
  const Y = v => pt + (1 - v / ymax) * (H - pt - pb);
  const path = xs.map((s, i) => `${i ? 'L' : 'M'}${X(s).toFixed(1)} ${Y(ys[i]).toFixed(1)}`).join(' ');
  const best = xs[ys.indexOf(Math.max(...ys))];
  const curS = r.d + r.a;

  let g = '';
  [0, 0.5, 1].forEach(t => {
    const v = (ymax * t) / 1.12;
    g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(22,32,30,.09)"/><text x="${pl - 5}" y="${Y(v) + 3}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" fill="#64706c">${fmtD(v)}</text>`;
  });
  [0, 0.1, 0.2, 0.3, 0.4].forEach(s => {
    g += `<text x="${X(s)}" y="${H - 10}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#64706c">${Math.round(s * 100)}%</text>`;
  });

  const curY = Y(model(state.pkg, sc, { s: curS }, state.assumptions).doses);
  return {
    best,
    html: `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Doses to WHO against total set-aside share">
      ${g}
      <path d="${path} L${X(0.4)} ${Y(0)} L${X(0)} ${Y(0)} Z" fill="rgba(14,91,117,.10)"/>
      <path d="${path}" fill="none" stroke="#0e5b75" stroke-width="2"/>
      <line x1="${X(best)}" x2="${X(best)}" y1="${pt}" y2="${Y(0)}" stroke="#25631c" stroke-dasharray="3 3"/>
      <circle cx="${X(Math.min(curS, 0.4))}" cy="${curY}" r="5" fill="#a1302a" stroke="#fff" stroke-width="1.5"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:4px">
      <span>● Your package (${Math.round(curS * 100)}%)</span>
      <span style="color:var(--good)">┆ Peak for this package (${Math.round(best * 100)}%)</span>
    </div>`
  };
}

function renderPackageView() {
  // 1. 7 Core Issues Ladder
  const issuesBox = $('#issues-builder-list');
  issuesBox.innerHTML = ISSUES.map(iss => {
    const cur = state.pkg.i[iss.id];
    const ladder = iss.pos
      .map(
        p => `<label class="pos-option${p.k === cur ? ' is-selected' : ''}" for="pkg-i-${iss.id}-${p.k}">
          <input type="radio" name="pkg-i-${iss.id}" id="pkg-i-${iss.id}-${p.k}" value="${p.k}"${p.k === cur ? ' checked' : ''}>
          <span>
            <span class="pos-lab">(${p.k.toUpperCase()}) ${esc(p.lab)}</span>
            <span class="pos-desc">${esc(p.d)}</span>
          </span>
          <span class="pos-who">${esc(p.who || '')}</span>
        </label>`
      )
      .join('');
    const set = posOf(iss, cur).set;
    const quotes = Object.keys(set)
      .map(id => `<div class="quote-snippet"><span class="mono-badge">${esc(LEVERS[id].ref)}</span> ${qfmt(LEVERS[id].opts[set[id]].q)}</div>`)
      .join('');
    const noteVal = (state.pkg.notes && state.pkg.notes[iss.id]) || '';

    return `<article class="issue-card">
      <div class="issue-card-head">
        <div><span class="issue-num-badge">ISSUE ${iss.n}</span><strong style="font-size:16px">${esc(iss.title)}</strong></div>
        <span class="mono-badge">${esc(iss.ref)}</span>
      </div>
      <div class="pos-ladder">${ladder}</div>
      <details class="issue-details">
        <summary>Verbatim A79/8 annex wording this position sets</summary>
        <div style="margin-top:6px">${quotes}</div>
      </details>
      <details class="issue-details"${noteVal ? ' open' : ''}>
        <summary>Delegation wording / room notes${noteVal ? ' · saved' : ''}</summary>
        <textarea class="note-textarea" data-note-issue="${iss.id}" rows="2" placeholder="Proposed compromise text, conditions, or bracket fallback for ${esc(iss.title)}…">${esc(noteVal)}</textarea>
      </details>
    </article>`;
  }).join('');

  issuesBox.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.onchange = () => {
      const issueId = radio.name.replace('pkg-i-', '');
      state.pkg.i[issueId] = radio.value;
      updateAll({ refreshBrief: false });
    };
  });

  issuesBox.querySelectorAll('.note-textarea').forEach(ta => {
    ta.oninput = () => {
      if (!state.pkg.notes) state.pkg.notes = {};
      state.pkg.notes[ta.dataset.noteIssue] = ta.value;
      renderShareBoxes();
    };
  });

  // 2. 6 Secondary Provisions
  const S = Object.assign({}, SECDEF, state.pkg.s);
  const secBox = $('#secondary-builder-list');
  secBox.innerHTML = SECONDARY.map(id => {
    const L = LEVERS[id];
    return `<div class="issue-card" style="margin-top:10px">
      <div class="issue-card-head">
        <strong>${esc(L.title)}</strong>
        <span class="mono-badge">${esc(L.ref)}</span>
      </div>
      <div class="pos-ladder">
        ${Object.entries(L.opts)
          .map(
            ([k, o]) => `<label class="pos-option${S[id] === k ? ' is-selected' : ''}" for="pkg-s-${id}-${k}">
              <input type="radio" name="pkg-s-${id}" id="pkg-s-${id}-${k}" value="${k}"${S[id] === k ? ' checked' : ''}>
              <span>
                <span class="pos-lab">${esc(o.lab)}</span>
                <span class="pos-desc">${qfmt(o.q)}</span>
              </span>
              <span></span>
            </label>`
          )
          .join('')}
      </div>
    </div>`;
  }).join('');

  secBox.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.onchange = () => {
      const secId = radio.name.replace('pkg-s-', '');
      state.pkg.s[secId] = radio.value;
      updateAll({ refreshBrief: false });
    };
  });

  // 3. Right Rail Consequences
  const sc = SCEN.find(s => s.k === state.scenarioKey) || SCEN[2];
  const r = model(state.pkg, sc, {}, state.assumptions);
  const lo = model(state.pkg, sc, { tol: state.assumptions.tol - 0.05 }, state.assumptions);
  const hi = model(state.pkg, sc, { tol: state.assumptions.tol + 0.05 }, state.assumptions);
  const ev = evalBlocs(state.pkg, state.weights, state.assumptions);
  const v = verdictOf(ev);
  const c2 = covid2(state.pkg, state.countryCode, state.assumptions);

  const vCard = $('#pkg-verdict-card');
  vCard.className = `panel-card verdict-card ${v.signable ? 'is-yes' : 'is-no'}`;
  vCard.innerHTML = `
    <span class="eyebrow">Parties’ verdict on the whole package</span>
    <div class="verdict-big">${v.signable ? 'Signable by all 4 Parties' : 'Not signable yet'}</div>
    <p style="font-size:13px">${
      v.signable
        ? `All four state blocs clear the ${state.assumptions.thr}/100 threshold (lowest: ${v.minP}).`
        : v.blocking
            .map(x => `<strong>${esc(x.b.n)}</strong> ${x.rls.length ? 'vetoes on ' + esc(x.rls.join('; ')) : 'is below threshold (' + x.score + ')'}`)
            .join('<br>')
    }</p>
    <p class="muted-copy" style="font-size:12px;margin-top:6px">Manufacturer uptake: ${r.inPABS ? Math.round(r.p * 100) + '% sign PABS contracts' : 'routed to PIP (influenza)'}</p>
  `;

  const scenBtns = $('#pkg-scenario-buttons');
  scenBtns.innerHTML = SCEN.map(
    s => `<button type="button" class="scen-btn" data-scen="${s.k}" aria-pressed="${s.k === state.scenarioKey}">
      <strong>${esc(s.n)}</strong><br><small style="opacity:0.8">${s.type === 'pheic' ? 'PHEIC' : 'Pandemic'}</small>
    </button>`
  ).join('');
  scenBtns.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      state.scenarioKey = btn.dataset.scen;
      $('#scenario-select').value = state.scenarioKey;
      updateAll({ refreshBrief: false });
    };
  });
  $('#pkg-scenario-desc').textContent = sc.d;

  $('#pkg-rail-kpis').innerHTML = `
    <div class="rail-kpi">
      <span class="eyebrow">Doses to WHO</span>
      <div class="v">${fmtD(r.doses)}</div>
      <div class="r">range ${fmtD(lo.doses)}–${fmtD(hi.doses)}</div>
    </div>
    <div class="rail-kpi">
      <span class="eyebrow">${esc(c2.country.name)} (COVID-2)</span>
      <div class="v">${fmtD(c2.extraEnd / 1e6)}</div>
      <div class="r">+${c2.gain6mPoints} pts cov at 6m</div>
    </div>
    <div class="rail-kpi">
      <span class="eyebrow">Manufacturers signing</span>
      <div class="v">${r.inPABS ? Math.round(r.p * 100) + '%' : '—'}</div>
      <div class="r">lev ${r.E.toFixed(2)} · burd ${r.B.toFixed(2)}</div>
    </div>
    <div class="rail-kpi">
      <span class="eyebrow">PABS System Fund</span>
      <div class="v">${fmt$(r.fundB)}</div>
      <div class="r">mfr cost ${fmt$(r.cost)} (${(r.c * 100).toFixed(1)}%)</div>
    </div>
  `;

  $('#pkg-thr-label').textContent = `line = ${state.assumptions.thr}/100`;
  $('#pkg-bloc-meters').innerHTML = renderBlocMetersHTML(ev);
  const rls = ev.filter(x => x.rls.length);
  $('#pkg-redlines').innerHTML = rls.length
    ? rls.map(x => `<span>⚑ <strong>${esc(x.b.n)}</strong>: ${esc(x.rls.join('; '))}</span>`).join('')
    : `<span style="color:var(--good)">✓ No coded red lines tripped.</span>`;

  const cv = buildParticipationCurveSVG(sc, r);
  $('#pkg-participation-curve').innerHTML = cv.html;
  const curS = r.d + r.a;
  $('#pkg-curve-msg').textContent = !r.inPABS
    ? 'Influenza is excluded, so the PABS set-aside does not apply in this scenario.'
    : Math.abs(curS - cv.best) < 0.03
      ? 'The set-aside sits near the dose-maximising peak for the rest of this package.'
      : curS > cv.best
        ? `Above ${Math.round(cv.best * 100)}%, asking for a larger set-aside loses total doses because fewer manufacturers sign.`
        : `Room to ask for more: up to ~${Math.round(cv.best * 100)}% still raises total doses to WHO.`;
}

function initSavePackageBar() {
  $('#save-pkg-btn').onclick = () => {
    const name = ($('#save-pkg-name').value || '').trim() || `Saved draft (${new Date().toLocaleTimeString()})`;
    state.savedPackages = state.savedPackages.filter(x => x.n !== name);
    state.savedPackages.push({ n: name, p: clone(state.pkg) });
    try {
      localStorage.setItem('pal-pkgs', JSON.stringify(state.savedPackages));
    } catch {
      // ignore
    }
    $('#save-pkg-msg').textContent = `Saved "${name}". Available in Compare (View 04).`;
    populateCompareDropdowns();
  };
}

/* ==========================================================================
   VIEW 04: COMPARE & TRADE FINDER (+ BRIDGING CLAUSE DRAFTER COPILOT)
   ========================================================================== */

function getAllComparablePackages() {
  return [
    { key: 'current', name: 'Active workspace package', pkg: state.pkg },
    ...CLAUSE_PRESETS.map(p => ({ key: `preset:${p.k}`, name: `Preset: ${p.n}`, pkg: p.p })),
    ...state.savedPackages.map((s, i) => ({ key: `saved:${i}`, name: `Saved: ${s.n}`, pkg: s.p }))
  ];
}

function populateCompareDropdowns() {
  const list = getAllComparablePackages();
  const selA = $('#cmp-select-a');
  const selB = $('#cmp-select-b');
  if (!selA || !selB) return;
  const prevA = selA.value || 'current';
  const prevB = selB.value || 'preset:bridge';
  const html = list.map(item => `<option value="${esc(item.key)}">${esc(item.name)}</option>`).join('');
  selA.innerHTML = html;
  selB.innerHTML = html;
  selA.value = list.some(x => x.key === prevA) ? prevA : 'current';
  selB.value = list.some(x => x.key === prevB) ? prevB : 'preset:bridge';
}

function renderCompareAndTradesView() {
  const list = getAllComparablePackages();
  const selA = $('#cmp-select-a');
  const selB = $('#cmp-select-b');
  if (!selA.options.length) populateCompareDropdowns();

  const itemA = list.find(x => x.key === selA.value) || list[0];
  const itemB = list.find(x => x.key === selB.value) || list[2] || list[0];
  const cmp = comparePackages(itemA.pkg, itemB.pkg, state.scenarioKey, state.weights, state.assumptions);
  const c2A = covid2(itemA.pkg, state.countryCode, state.assumptions);
  const c2B = covid2(itemB.pkg, state.countryCode, state.assumptions);

  $('#cmp-positions-table').innerHTML = `
    <thead><tr><th>Issue</th><th>A: ${esc(itemA.name)}</th><th>B: ${esc(itemB.name)}</th></tr></thead>
    <tbody>
      ${ISSUES.map(iss => {
        const a = posOf(iss, itemA.pkg.i[iss.id]);
        const b = posOf(iss, itemB.pkg.i[iss.id]);
        const diff = a.k !== b.k;
        return `<tr style="${diff ? 'background:var(--warn-soft)' : ''}">
          <td><strong>${iss.n}. ${esc(iss.title)}</strong></td>
          <td>(${a.k.toUpperCase()}) ${esc(a.lab)}</td>
          <td>(${b.k.toUpperCase()}) ${esc(b.lab)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  `;

  $('#cmp-results-table').innerHTML = `
    <thead><tr><th>Outcome (${esc(cmp.sc.n)})</th><th>Package A</th><th>Package B</th></tr></thead>
    <tbody>
      <tr><td><strong>Signable by all 4 Parties</strong></td><td class="num">${cmp.va.signable ? 'Yes' : 'No'} (${cmp.va.minP})</td><td class="num"><strong>${cmp.vb.signable ? 'Yes' : 'No'} (${cmp.vb.minP})</strong></td></tr>
      <tr><td><strong>${esc(c2A.country.name)} COVID-2 Doses</strong></td><td class="num">${fmtD(c2A.extraEnd / 1e6)}</td><td class="num"><strong>${fmtD(c2B.extraEnd / 1e6)}</strong></td></tr>
      <tr><td><strong>Global Doses to WHO</strong></td><td class="num">${fmtD(cmp.ma.doses)}</td><td class="num"><strong>${fmtD(cmp.mb.doses)}</strong></td></tr>
      <tr><td><strong>Manufacturers Signing</strong></td><td class="num">${cmp.ma.inPABS ? Math.round(cmp.ma.p * 100) + '%' : '—'}</td><td class="num"><strong>${cmp.mb.inPABS ? Math.round(cmp.mb.p * 100) + '%' : '—'}</strong></td></tr>
      <tr><td><strong>Money to PABS System</strong></td><td class="num">${fmt$(cmp.ma.fundB)}</td><td class="num"><strong>${fmt$(cmp.mb.fundB)}</strong></td></tr>
      ${cmp.ea
        .map(
          (x, i) => `<tr>
            <td>${esc(x.b.n)}</td>
            <td class="num">${x.score}${x.rls.length ? ' ⚑' : ''}</td>
            <td class="num"><strong>${cmp.eb[i].score}${cmp.eb[i].rls.length ? ' ⚑' : ''}</strong></td>
          </tr>`
        )
        .join('')}
    </tbody>
  `;

  $('#cmp-waterfall').innerHTML = cmp.waterfall.length
    ? cmp.waterfall
        .map(
          w => `<div class="wf-row">
            <span><strong>${esc(w.title)}</strong><br><small class="muted-copy">${esc(w.fromLabel)} → ${esc(w.toLabel)}</small></span>
            <span class="num ${w.doseDelta >= 0 ? 'gain-tag' : 'loss-tag'}">WHO doses: ${w.doseDelta >= 0 ? '+' : '−'}${fmtD(Math.abs(w.doseDelta))}</span>
            <span class="num ${w.minPartyDelta >= 0 ? 'gain-tag' : 'loss-tag'}">Min Party: ${w.minPartyDelta >= 0 ? '+' : ''}${w.minPartyDelta} pts</span>
          </div>`
        )
        .join('')
    : `<p class="muted-copy">Packages A and B are identical across all 13 levers.</p>`;
}

function executeTradeFinder() {
  const floorPct = Number($('#trade-floor-input').value) || 80;
  const res = findTrades(state.pkg, state.scenarioKey, floorPct, state.weights, state.assumptions);
  state.lastTradeResult = res;

  const c2Start = covid2(res.startPkg, state.countryCode, state.assumptions);
  const c2Best = covid2(res.bestPkg, state.countryCode, state.assumptions);

  $('#trade-summary-box').innerHTML = `
    <div class="hardline-callout" style="background:var(--accent-soft);border-left-color:var(--accent)">
      From <strong>${res.startVerdict.signable ? 'Signable' : 'Not signable'}</strong> (lowest Party ${res.startVerdict.minP}/100, ${fmtD(res.startModel.doses)} WHO doses, ${fmtD(c2Start.extraEnd / 1e6)} for ${esc(c2Start.country.name)})
      → <strong>${res.bestVerdict.signable ? 'Signable by all 4 Parties' : 'Closest bridge'}</strong> (lowest Party <strong>${res.bestVerdict.minP}/100</strong>, <strong>${fmtD(res.bestModel.doses)} WHO doses</strong>, <strong>${fmtD(c2Best.extraEnd / 1e6)} for ${esc(c2Best.country.name)}</strong>).
      <div class="inline-actions" style="margin-top:8px">
        <button type="button" class="action-button primary-action" id="apply-bridging-pkg">Load bridging package into workspace</button>
      </div>
    </div>
  `;

  const applyBtn = $('#apply-bridging-pkg');
  if (applyBtn) {
    applyBtn.onclick = () => {
      state.pkg = Object.assign(clone(res.bestPkg), { notes: state.pkg.notes || {} });
      updateAll({ refreshBrief: true });
      setStatus('Loaded Trade Finder bridging package into active workspace.');
    };
  }

  const movesBox = $('#trade-moves-list');
  if (!res.moves.length) {
    movesBox.innerHTML = `<div class="trade-card">Your current package already sits at the Pareto frontier for these weights and dose floor.</div>`;
    $('#bridging-clause-output').innerHTML = `<p class="muted-copy">Select a preset with polarized positions (such as <em>30 Apr text</em>, <em>Equity maximal</em>, or <em>EU hybrid</em>) and press <strong>Find bridging trades</strong> to draft compromise clauses.</p>`;
    return;
  }

  movesBox.innerHTML = res.moves
    .map(
      (mv, idx) => `<div class="trade-card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <strong>${esc(mv.title)}</strong>
          <span class="mono-badge">${esc(mv.ref)}</span>
        </div>
        <div style="margin:4px 0"><span class="muted-copy">${esc(mv.fromLabel)}</span> → <strong>${esc(mv.toLabel)}</strong></div>
        ${mv.lifted.length ? `<div class="gain-tag">✓ Lifts red line for: ${esc(mv.lifted.join(', '))}</div>` : ''}
        ${mv.tripped.length ? `<div class="loss-tag">⚑ Trips red line for: ${esc(mv.tripped.join(', '))}</div>` : ''}
        <div style="font-size:12px;margin-top:3px">
          <span class="gain-tag">Gains: ${mv.gains.length ? mv.gains.map(g => `${esc(g.n)} +${g.dd}`).join(', ') : 'none'}</span> ·
          <span class="loss-tag">Concessions: ${mv.losses.length ? mv.losses.map(l => `${esc(l.n)} ${l.dd}`).join(', ') : 'none'}</span>
        </div>
        <div class="inline-actions" style="margin-top:8px">
          <button type="button" class="mini-button draft-clause-btn" data-move-idx="${idx}">✦ Draft treaty clause (Gemini Copilot)</button>
        </div>
      </div>`
    )
    .join('');

  movesBox.querySelectorAll('.draft-clause-btn').forEach(btn => {
    btn.onclick = () => triggerClauseDrafter(res.moves[Number(btn.dataset.moveIdx)]);
  });

  // Auto-draft clause for the first move
  triggerClauseDrafter(res.moves[0]);
}

async function triggerClauseDrafter(move) {
  if (!move) return;
  state.activeClauseMove = move;
  $('#clause-drafter-source').textContent = 'Drafting clause…';
  const drafted = await draftBridgingClause(move, state.pkg, state.scenarioKey, { countryCode: state.countryCode });
  state.activeClauseDraft = drafted;
  $('#clause-drafter-source').textContent = drafted.engineSource || 'A79/8 Drafter';

  const box = $('#bridging-clause-output');
  box.innerHTML = `
    <div class="brief-box">
      <span class="eyebrow">${esc(move.title)} · ${esc(move.fromLabel)} → ${esc(move.toLabel)}</span>
      <h4 style="margin-top:3px">${esc(drafted.articleHeading)}</h4>
      <div class="quote-snippet" style="font-style:normal;font-family:var(--serif);font-size:14px;margin-top:8px">
        ${esc(drafted.cleanTreatyText)}
      </div>
      <div style="margin-top:10px">
        <span class="eyebrow">Tactical bracketed fallback for room text</span>
        <div class="quote-snippet" style="margin-top:4px">${qfmt(drafted.bracketedFallback)}</div>
      </div>
      <p class="muted-copy" style="font-size:12.5px;margin-top:10px"><strong>Deterministic Red-Line &amp; Dose Impact:</strong> ${esc(drafted.redLineAnalysis)}</p>
      <div class="field-row-2" style="margin-top:10px">
        <div class="oos-item" style="border-left-color:var(--good)">
          <span class="eyebrow">Pitch to Group for Equity / Africa Plus</span>
          <p style="font-size:12.5px;margin-top:3px">${esc(drafted.equityPitch)}</p>
        </div>
        <div class="oos-item" style="border-left-color:var(--accent)">
          <span class="eyebrow">Pitch to EU / G6 / IFPMA</span>
          <p style="font-size:12.5px;margin-top:3px">${esc(drafted.industryEuPitch)}</p>
        </div>
      </div>
      <div class="inline-actions">
        <button type="button" class="action-button primary-action" id="insert-clause-to-notes">Insert clean clause into package notes &amp; apply move</button>
        <button type="button" class="action-button" id="copy-drafted-clause">Copy clause text</button>
      </div>
    </div>
  `;

  $('#insert-clause-to-notes').onclick = () => {
    if (move.type === 'i') {
      state.pkg.i[move.id] = move.toKey;
      if (!state.pkg.notes) state.pkg.notes = {};
      state.pkg.notes[move.id] = `${drafted.articleHeading}: ${drafted.cleanTreatyText}`;
    } else {
      state.pkg.s[move.id] = move.toKey;
    }
    updateAll({ refreshBrief: true });
    setStatus(`Applied move on ${move.title} and saved drafted annex clause to package notes.`);
  };

  $('#copy-drafted-clause').onclick = () => {
    navigator.clipboard?.writeText(`${drafted.articleHeading}\n\n${drafted.cleanTreatyText}\n\nBracketed option:\n${drafted.bracketedFallback}`);
    setStatus('Copied drafted bridging clause to clipboard.');
  };
}

function initCompareAndTradeEvents() {
  $('#cmp-select-a').onchange = renderCompareAndTradesView;
  $('#cmp-select-b').onchange = renderCompareAndTradesView;
  $('#run-trade-finder').onclick = () => {
    executeTradeFinder();
    setStatus('Completed deterministic Trade Finder search across all 13 levers.');
  };
}

/* ==========================================================================
   VIEW 05: BLOCS, WEIGHTS, HARDLINE TEST, PARAMETERS & SHARE
   ========================================================================== */

function renderBlocsAndEvidenceView() {
  // 1. Editable Weights Matrix (6 blocs x 7 issues)
  const wTable = $('#weights-matrix-table');
  wTable.innerHTML = `
    <thead>
      <tr>
        <th>Bloc</th>
        ${ISSUES.map(i => `<th title="${esc(i.title)}">${i.n}. ${esc(i.title.split(' ').slice(0, 2).join(' '))}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${BLOCS.map(
        b => `<tr>
          <td><strong>${esc(b.n)}</strong> <span class="bloc-party-tag">(${b.party ? 'Party' : 'non-Party'})</span></td>
          ${ISSUES.map(
            (iss, ii) => `<td>
              <select class="control-select weight-cell-select" data-bloc="${b.k}" data-idx="${ii}" aria-label="${esc(b.n)} priority weight for ${esc(iss.title)}">
                ${[1, 2, 3].map(v => `<option value="${v}"${state.weights[b.k][ii] === v ? ' selected' : ''}>${v}</option>`).join('')}
              </select>
            </td>`
          ).join('')}
        </tr>`
      ).join('')}
    </tbody>
  `;

  wTable.querySelectorAll('.weight-cell-select').forEach(sel => {
    sel.onchange = () => {
      state.weights[sel.dataset.bloc][Number(sel.dataset.idx)] = Number(sel.value);
      try {
        localStorage.setItem('pal-w', JSON.stringify(state.weights));
      } catch {
        // ignore
      }
      updateAll({ refreshBrief: false });
      setStatus(`Updated ${sel.dataset.bloc} priority weight.`);
    };
  });

  // 2. Hardline Test
  const hbSelect = $('#hardline-bloc-select');
  if (!hbSelect.options.length) {
    hbSelect.innerHTML = BLOCS.map((b, i) => `<option value="${i}">${esc(b.n)}</option>`).join('');
    hbSelect.onchange = renderHardlineSection;
  }
  renderHardlineSection();

  // 3. Share boxes
  renderShareBoxes();

  // 4. Static Reference Tables
  $('#coded-blocs-table').innerHTML = `
    <thead><tr><th>Bloc</th><th>Coded Public Position</th></tr></thead>
    <tbody>
      ${BLOCS.map(
        b => `<tr>
          <td style="white-space:nowrap"><strong>${esc(b.n)}</strong><br><span class="bloc-party-tag">${b.party ? 'Party (veto power)' : 'Non-Party'}</span></td>
          <td>${esc(b.d)}</td>
        </tr>`
      ).join('')}
    </tbody>
  `;

  $('#scenarios-ref-table').innerHTML = `
    <thead><tr><th>Scenario</th><th>Type</th><th>Global Doses</th><th>Window Revenue</th><th>Empirical / Illustrative Basis</th></tr></thead>
    <tbody>
      ${SCEN.map(
        s => `<tr>
          <td><strong>${esc(s.n)}</strong></td>
          <td>${s.type === 'pheic' ? 'PHEIC' : 'Pandemic'}</td>
          <td class="num">${fmtD(s.P)}</td>
          <td class="num">${fmt$(s.R)}</td>
          <td>${esc(s.src)}</td>
        </tr>`
      ).join('')}
    </tbody>
  `;

  $('#sources-ref-list').innerHTML = SOURCES.map(
    ([title, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a></li>`
  ).join('');
}

function renderHardlineSection() {
  const hbSelect = $('#hardline-bloc-select');
  const bi = Number(hbSelect.value) || 0;
  const sc = SCEN.find(s => s.k === state.scenarioKey) || SCEN[2];
  const idealPkg = idealFor(bi);
  const bridgePkg = CLAUSE_PRESETS.find(p => p.k === 'bridge').p;

  const rows = [
    ['Active workspace package', state.pkg],
    [`${BLOCS[bi].n} gets everything (hardline)`, idealPkg],
    ['Term sheet bridge', bridgePkg]
  ].map(([label, p]) => {
    const m = model(p, sc, {}, state.assumptions);
    const ev = evalBlocs(p, state.weights, state.assumptions);
    const v = verdictOf(ev);
    const c2 = covid2(p, state.countryCode, state.assumptions);
    return {
      label,
      m,
      v,
      c2,
      partiesOk: ev.filter(x => x.b.party && x.ok).length
    };
  });

  $('#hardline-table').innerHTML = `
    <thead>
      <tr>
        <th>Package</th>
        <th>WHO Doses (${esc(sc.n)})</th>
        <th>${esc(COUNTRY[state.countryCode].name)} Doses</th>
        <th>Mfr Uptake</th>
        <th>Parties OK</th>
        <th>Signable</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          r => `<tr>
            <td><strong>${esc(r.label)}</strong></td>
            <td class="num">${fmtD(r.m.doses)}</td>
            <td class="num">${fmtD(r.c2.extraEnd / 1e6)}</td>
            <td class="num">${r.m.inPABS ? Math.round(r.m.p * 100) + '%' : 'PIP'}</td>
            <td class="num">${r.partiesOk} / 4</td>
            <td>${r.v.signable ? '<span class="gain-tag">Yes</span>' : '<span class="loss-tag">No</span>'}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  `;

  const hard = rows[1];
  const br = rows[2];
  $('#hardline-callout').innerHTML = `If <strong>${esc(BLOCS[bi].n)}</strong> wins every single issue, only <strong>${hard.partiesOk} of 4 Parties</strong> can accept the package${hard.v.blocking.length ? ` (blocked by ${esc(hard.v.blocking.map(x => x.b.n).join(', '))})` : ''}, and WHO receives <strong>${fmtD(hard.m.doses)} doses</strong> in a ${esc(sc.n)} outbreak vs <strong>${fmtD(br.m.doses)} doses</strong> under the Term sheet bridge. A package the Parties cannot sign delivers nothing.`;
}

function renderShareBoxes() {
  const plain = $('#plain-brief-box');
  const code = $('#pkg-share-code-box');
  if (plain) plain.textContent = formatBriefText(state.pkg, state.scenarioKey, state.countryCode, state.weights, state.assumptions);
  if (code) code.textContent = encodePackageCode(state.pkg);
}

function syncSlidersFromAssumptions() {
  $('#slider-tol').value = state.assumptions.tol;
  $('#val-tol').textContent = state.assumptions.tol.toFixed(2);
  $('#slider-m').value = state.assumptions.m;
  $('#val-m').textContent = Math.round(state.assumptions.m * 100) + '%';
  $('#slider-bench').value = state.assumptions.bench;
  $('#val-bench').textContent = state.assumptions.bench.toFixed(1);
  $('#slider-thr').value = state.assumptions.thr;
  $('#val-thr').textContent = String(Math.round(state.assumptions.thr));
}

function initBlocsAndMethodEvents() {
  $('#reset-weights-btn').onclick = () => {
    state.weights = clone(W0);
    try {
      localStorage.removeItem('pal-w');
    } catch {
      // ignore
    }
    updateAll({ refreshBrief: false });
    setStatus('Reset bloc priority weights to public-statement baseline.');
  };

  const bindSlider = (sliderSel, valSel, key, fmt) => {
    const el = $(sliderSel);
    el.oninput = () => {
      state.assumptions[key] = Number(el.value);
      $(valSel).textContent = fmt(state.assumptions[key]);
      updateAll({ refreshBrief: false });
    };
  };
  bindSlider('#slider-tol', '#val-tol', 'tol', x => x.toFixed(2));
  bindSlider('#slider-m', '#val-m', 'm', x => Math.round(x * 100) + '%');
  bindSlider('#slider-bench', '#val-bench', 'bench', x => x.toFixed(1));
  bindSlider('#slider-thr', '#val-thr', 'thr', x => String(Math.round(x)));

  $('#reset-assumptions-btn').onclick = () => {
    state.assumptions = clone(DEFAULT_ASSUMPTIONS);
    syncSlidersFromAssumptions();
    updateAll({ refreshBrief: false });
    setStatus('Reset model sensitivity parameters to default values.');
  };

  $('#copy-plain-brief').onclick = () => {
    navigator.clipboard?.writeText($('#plain-brief-box').textContent);
    setStatus('Copied plain-text delegation brief to clipboard.');
  };

  $('#copy-pkg-code').onclick = () => {
    navigator.clipboard?.writeText($('#pkg-share-code-box').textContent);
    setStatus('Copied anonymous base64 package share code to clipboard.');
  };

  $('#import-pkg-code-btn').onclick = () => {
    const raw = $('#import-pkg-code-input').value;
    try {
      state.pkg = decodePackageCode(raw);
      updateAll({ refreshBrief: true });
      $('#import-pkg-code-msg').textContent = 'Loaded package code into workspace.';
      setStatus('Imported colleague’s package share code.');
    } catch {
      $('#import-pkg-code-msg').textContent = 'Invalid share code. Copy the full base64 string and try again.';
    }
  };
}

/* ==========================================================================
   MASTER UPDATE LOOP
   ========================================================================== */

function updateAll({ refreshBrief = false } = {}) {
  renderPresetBars();
  renderSummaryStrip();
  renderBriefingView();
  renderAgentDiffPreview();
  renderPackageView();
  populateCompareDropdowns();
  renderCompareAndTradesView();
  renderBlocsAndEvidenceView();
  if (refreshBrief) {
    refreshMinisterialBrief();
  }
}

async function boot() {
  loadLocalSavedPackages();
  initSidebarControls();
  initBriefingEvents();
  initAgentView();
  initSavePackageBar();
  initCompareAndTradeEvents();
  initBlocsAndMethodEvents();
  syncSlidersFromAssumptions();
  updateAll({ refreshBrief: true });
  executeTradeFinder();
  await refreshAgentStatusBanner();

  // Expose debugging & verification handle on window
  window.__pabsWorkspace = {
    state,
    model,
    evalBlocs,
    verdictOf,
    covid2,
    findTrades,
    CLAUSE_PRESETS,
    SCEN,
    COUNTRY
  };
}

boot();
