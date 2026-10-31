import assert from 'node:assert/strict';
import {
  MODEL_VERSION,
  CONTEXT,
  TERMS,
  PRESETS,
  evaluate,
  validateTerms,
  createSnapshot,
  serializeSnapshot,
  parseSnapshot,
  BLOCS,
  PARTY,
  LEVERS,
  SECONDARY,
  ISSUES,
  W0,
  SECW,
  SECDEF,
  CLAUSE_PRESETS,
  SCEN,
  DEFAULT_ASSUMPTIONS,
  COUNTRY,
  PK_CONTEXT,
  clone,
  model,
  evalBlocs,
  verdictOf,
  covid2,
  findTrades,
  comparePackages,
  encodePackageCode,
  decodePackageCode,
  formatBriefText,
  serializeWorkspaceSnapshot,
  parseWorkspaceSnapshot,
} from './model.mjs';
import {
  SAMPLE_TEXTS,
  analyzeDraftText,
  heuristicAnalyzeDraftText,
  draftBridgingClause,
  synthesizeMinisterialBrief,
} from './agent.mjs';

const presets = Object.fromEntries(PRESETS.map(p => [p.id, p]));
assert.equal(TERMS.length, 7);
assert.equal(new Set(TERMS.map(t => t.id)).size, 7);
for (const term of TERMS) assert.deepEqual(term.options.map(o => o.value), [0, 1, 2]);

// 1. Original demo-v2 full input space checks (2,187 packages x 3 horizons = 6,561 checks)
let packagesChecked = 0;
for (let code = 0; code < 3 ** TERMS.length; code++) {
  let n = code;
  const terms = Object.fromEntries(TERMS.map(term => { const value = n % 3; n = Math.floor(n / 3); return [term.id, value]; }));
  const outcomes = [3, 6, 12].map(h => evaluate(terms, h));
  assert.ok(outcomes[0].coverage <= outcomes[1].coverage && outcomes[1].coverage <= outcomes[2].coverage, 'Coverage must not fall as the horizon extends.');
  for (const [index, outcome] of outcomes.entries()) {
    const horizon = [3, 6, 12][index];
    assert.ok(outcome.arrivalDay >= 60 && outcome.arrivalDay <= 155);
    assert.ok(outcome.coverage >= 0 && outcome.coverage <= 95);
    assert.ok(outcome.costPerRegimen > 0 && Number.isFinite(outcome.costPerRegimen));
    assert.ok(outcome.coveredMillions >= 0 && outcome.coveredMillions <= CONTEXT.priorityPopulationMillions);
    assert.ok(Math.abs(outcome.coveredMillions * outcome.costPerRegimen - outcome.totalCostMillions) <= 0.011);
    assert.equal(outcome.series.length, horizon + 1);
    assert.equal(outcome.series[0].value, 0);
    assert.equal(outcome.series.at(-1).value, outcome.coverage);
    assert.ok(outcome.series.every((point, i, series) => point.month === i && (i === 0 || point.value >= series[i - 1].value)));
    assert.ok(outcome.series.every(point => point.month * 30 > outcome.arrivalDay || point.value === 0), 'Coverage cannot precede first usable delivery.');
    assert.ok(outcome.conditions.length > 0);
  }
  const poorAllocation = evaluate({ ...terms, allocation: 0 });
  const readyAllocation = evaluate({ ...terms, allocation: 2 });
  assert.ok(readyAllocation.coverage >= poorAllocation.coverage);
  assert.ok(readyAllocation.arrivalDay <= poorAllocation.arrivalDay);
  packagesChecked++;
}

const baseline = evaluate(presets.baseline.terms);
const bridge = evaluate(presets.bridge.terms);
const rapid = evaluate(presets.rapid.terms);
assert.ok(bridge.arrivalDay < baseline.arrivalDay);
assert.ok(bridge.coverage > baseline.coverage);
assert.ok(bridge.costPerRegimen < baseline.costPerRegimen);
assert.ok(rapid.arrivalDay < bridge.arrivalDay);
assert.ok(rapid.coverage >= bridge.coverage);
assert.deepEqual(evaluate(presets.baseline.terms), baseline, 'The baseline uses the same evaluator without hidden overrides.');

for (const preset of PRESETS) {
  for (const horizon of [3, 6, 12]) {
    const state = { terms: preset.terms, horizon, packageId: preset.id, compareId: 'baseline' };
    const restored = parseSnapshot(serializeSnapshot(state));
    assert.deepEqual(restored, state);
    assert.deepEqual(evaluate(restored.terms, restored.horizon), evaluate(state.terms, state.horizon));
  }
}

const original = { ...presets.bridge.terms };
const normalized = validateTerms(original);
normalized.donation = 0;
assert.equal(original.donation, 1, 'Validation must return an independent object.');
const state = { terms: original, horizon: 6, packageId: 'custom', compareId: 'flexible' };
const validSnapshot = createSnapshot(state);
const malformed = [
  null, [], {}, { ...original, donation: '1' }, { ...original, donation: 3 },
  { ...original, donation: -1 }, { ...original, donation: NaN }, { ...original, donation: 0.5 },
  { ...original, unknown: 1 }, { ...original, allocation: null }, { ...original, donation: undefined }
];
for (const terms of malformed) assert.throws(() => evaluate(terms));
for (const horizon of [0, 4, 24, '6', NaN, null]) assert.throws(() => evaluate(original, horizon));
for (const content of ['not JSON', 'null', '[]', '{}', 'x'.repeat(20001)]) assert.throws(() => parseSnapshot(content));
for (const patch of [
  { version: 'future' }, { schema: 'another-app' }, { contextId: 'another-country' },
  { horizon: '6' }, { packageId: 'unknown' }, { compareId: 'custom' },
  { terms: { ...original, unknown: 0 } }, { extra: 1 }, { packageId: 'baseline' }
]) assert.throws(() => parseSnapshot(JSON.stringify({ ...validSnapshot, ...patch })));
assert.throws(() => parseSnapshot(JSON.stringify({ ...validSnapshot, terms: JSON.parse('{"__proto__":{},"donation":1}') })));
assert.equal(validSnapshot.version, MODEL_VERSION);

// 2. Clause-level PABS simulation engine checks (7 core issues + 6 secondary levers + 6 blocs + 4 scenarios)
assert.equal(ISSUES.length, 7);
assert.equal(Object.keys(LEVERS).length, 17);
assert.equal(SECONDARY.length, 6);
assert.equal(BLOCS.length, 6);
assert.equal(PARTY.length, 4);
assert.equal(SCEN.length, 4);
assert.equal(CLAUSE_PRESETS.length, 6);

const unbPkg = clone(CLAUSE_PRESETS.find(p => p.k === 'unb').p);
const bridgePkg = clone(CLAUSE_PRESETS.find(p => p.k === 'bridge').p);

const unbOut = model(unbPkg, 'covid', {}, DEFAULT_ASSUMPTIONS);
const unbBlocs = evalBlocs(unbPkg, W0, DEFAULT_ASSUMPTIONS);
const unbVerdict = verdictOf(unbBlocs);
assert.equal(unbVerdict.signable, false, '30 April unbracketed text must be blocked by red lines.');
assert.ok(unbBlocs.find(x => x.b.k === 'EQ').rls.length > 0, 'Group for Equity has a red line on link:a in unbracketed text.');
assert.ok(unbBlocs.find(x => x.b.k === 'AF').rls.length > 0, 'Africa Group has a red line on link:a in unbracketed text.');

const bridgeOut = model(bridgePkg, 'covid', {}, DEFAULT_ASSUMPTIONS);
const bridgeBlocs = evalBlocs(bridgePkg, W0, DEFAULT_ASSUMPTIONS);
const bridgeVerdict = verdictOf(bridgeBlocs);
assert.equal(bridgeVerdict.signable, true, 'Term sheet bridge must be signable by all 4 state blocs.');
assert.equal(bridgeVerdict.blocking.length, 0);
for (const blocEval of bridgeBlocs.filter(x => x.b.party)) {
  assert.ok(blocEval.score >= 50, `State bloc ${blocEval.b.k} must score >= 50 on bridge.`);
  assert.equal(blocEval.rls.length, 0, `State bloc ${blocEval.b.k} must have zero red lines on bridge.`);
}
assert.ok(bridgeOut.doses > unbOut.doses, 'Bridge package must deliver more WHO doses than unbracketed baseline.');

// Check package code & workspace snapshot roundtrips
const codeStr = encodePackageCode(bridgePkg);
const decodedPkg = decodePackageCode(codeStr);
for (const iss of ISSUES) assert.equal(decodedPkg.i[iss.id], bridgePkg.i[iss.id]);
for (const sId of SECONDARY) assert.equal(decodedPkg.s[sId], bridgePkg.s[sId]);

const wsSnapJson = serializeWorkspaceSnapshot({
  countryCode: 'PAK',
  blocKey: 'EQ',
  scenarioKey: 'covid',
  activePreset: 'bridge',
  comparePresetA: 'current',
  comparePresetB: 'unb',
  pkg: bridgePkg,
});
const wsSnap = parseWorkspaceSnapshot(wsSnapJson);
assert.equal(wsSnap.countryCode, 'PAK');
assert.equal(wsSnap.activePreset, 'bridge');
assert.equal(wsSnap.pkg.i.link, 'c');

// 3. Empirical 217-country COVID-2 trajectory checks
const countryIsos = Object.keys(COUNTRY);
assert.ok(countryIsos.length >= 215, 'Should load all 217 OWID countries.');
assert.ok(COUNTRY.PAK, 'Pakistan record must be present.');
assert.ok(PK_CONTEXT.includes('Group for Equity'), 'Pakistan negotiation context must be present.');

let countriesChecked = 0;
for (const iso of countryIsos) {
  const c2 = covid2(bridgePkg, iso, DEFAULT_ASSUMPTIONS);
  assert.ok(c2, `covid2 should return trajectory for ${iso}`);
  assert.equal(c2.cov2.length, 25);
  assert.ok(c2.extraEnd >= 0);
  for (let i = 1; i < c2.cov2.length; i++) {
    assert.ok(c2.extra(i) >= c2.extra(i - 1), `Cumulative WHO PABS extra doses must be monotonic for ${iso}`);
    assert.ok(c2.cov2[i] + 1e-6 >= Math.min(90, Number(c2.cov1[i]) || 0), `COVID-2 coverage must be at least historical coverage (capped at 90%) for ${iso}`);
  }
  countriesChecked++;
}
const pakBridge = covid2(bridgePkg, 'PAK', DEFAULT_ASSUMPTIONS);
const pakUnb = covid2(unbPkg, 'PAK', DEFAULT_ASSUMPTIONS);
const pakBridgeM = pakBridge.extraEnd / 1e6;
assert.ok(pakBridge.extraEnd > pakUnb.extraEnd, 'Pakistan receives significantly more WHO doses under Term sheet bridge than unbracketed baseline.');
assert.ok(pakBridgeM >= 50 && pakBridgeM <= 120, `Pakistan receives substantial WHO doses under Term sheet bridge (${pakBridgeM.toFixed(1)}M).`);

// 4. Trade Finder checks
const tradeResult = findTrades(unbPkg, 'covid', 80, W0, DEFAULT_ASSUMPTIONS);
assert.ok(tradeResult.moves.length > 0, 'Trade Finder must discover bridging moves from unbracketed text.');
assert.equal(tradeResult.bestVerdict.signable, true, 'Trade Finder best package from unbracketed text must be signable.');

// 5. Compare & Brief generator checks
const cmp = comparePackages(unbPkg, bridgePkg, 'covid', W0, DEFAULT_ASSUMPTIONS);
assert.equal(cmp.va.signable, false);
assert.equal(cmp.vb.signable, true);
assert.ok(cmp.waterfall.length >= 5);
const briefText = formatBriefText(bridgePkg, 'covid', 'PAK', W0, DEFAULT_ASSUMPTIONS);
assert.ok(briefText.includes('PAKISTAN'));

// 6. Gemini 2.5 Flash Agentic Suite (deterministic / pre-computed verification)
assert.ok(SAMPLE_TEXTS.length >= 4);
const sampleDraft = SAMPLE_TEXTS[0];
const analysis = await analyzeDraftText(sampleDraft.text, { sampleId: sampleDraft.id, preferLive: false });
assert.equal(Object.keys(analysis.issues).length, 7, 'Draft reader must map all 7 core issues.');
assert.equal(Object.keys(analysis.secondary).length, 6, 'Draft reader must map all 6 secondary levers.');
assert.ok(analysis.outOfScope.length > 0, 'Draft reader must flag provisions outside model scope.');
for (const iss of ISSUES) {
  const item = analysis.issues[iss.id];
  assert.ok(item && iss.pos.some(p => p.k === item.pos), `Valid mapped position for ${iss.id}`);
  assert.ok(item.quote && item.quote.length > 5, `Verbatim quote present for ${iss.id}`);
}

const heuristicAnalysis = heuristicAnalyzeDraftText(SAMPLE_TEXTS[1].text);
assert.equal(Object.keys(heuristicAnalysis.issues).length, 7);
assert.equal(Object.keys(heuristicAnalysis.secondary).length, 6);

const draftedClause = await draftBridgingClause(tradeResult.moves[0], unbPkg, 'covid', { countryCode: 'PAK' });
assert.ok(draftedClause.cleanTreatyText.length > 30);
assert.ok(draftedClause.bracketedFallback.includes('['));
assert.ok(draftedClause.equityPitch.length > 10);
assert.ok(draftedClause.industryEuPitch.length > 10);

const synthBrief = await synthesizeMinisterialBrief('PAK', 'EQ', bridgePkg, 'covid');
assert.ok(synthBrief.plenaryIntervention.length > 50);
assert.equal(synthBrief.defensiveQA.length, 3);

console.log(JSON.stringify({
  status: 'passed',
  packagesChecked,
  horizonChecks: packagesChecked * 3,
  countriesChecked,
  bridgeSignable: bridgeVerdict.signable,
  bridgeMinPartyScore: bridgeVerdict.minP,
  pakBridgeWhoDosesM: Math.round(pakBridgeM),
  tradesFoundFromUnbracketed: tradeResult.moves.length,
  agentSampleDraftsVerified: SAMPLE_TEXTS.length,
}, null, 2));
