import assert from 'node:assert/strict';
import { MODEL_VERSION, CONTEXT, TERMS, PRESETS, evaluate, validateTerms, createSnapshot, serializeSnapshot, parseSnapshot } from './model.mjs';

const presets = Object.fromEntries(PRESETS.map(p => [p.id, p]));
assert.equal(TERMS.length, 7);
assert.equal(new Set(TERMS.map(t => t.id)).size, 7);
for (const term of TERMS) assert.deepEqual(term.options.map(o => o.value), [0, 1, 2]);

// Exercise the full allowed input space rather than mirroring the arithmetic.
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
  // Better allocation cannot lower access under otherwise identical inputs.
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

console.log(JSON.stringify({ status: 'passed', packagesChecked, horizonChecks: packagesChecked * 3, baseline, bridge, rapid }, null, 2));
