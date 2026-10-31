// An intentionally fictional, deterministic demonstration model.
// No coefficient represents an actual offer, forecast, national entitlement or treaty rule.
export const MODEL_VERSION = 'demo-2.0.0';
export const CONTEXT = Object.freeze({
  id: 'pakistan-fictional-v1',
  country: 'Pakistan',
  scenario: 'Illustrative COVID-type pandemic',
  product: 'Illustrative vaccine',
  priorityPopulationMillions: 10,
  dosesPerRegimen: 2,
  trigger: 'Day 0: common first product authorization',
  baseline: 'Illustrative current arrangements',
  currency: 'USD',
  daysPerMonth: 30,
  status: 'All figures, populations and coefficients are fictional demo assumptions.'
});

const option = (value, label, detail) => ({ value, label, detail });
export const TERMS = [
  {
    id: 'donation', title: 'Donated supply',
    description: 'An illustrative additional donation tranche; this is not a real treaty threshold.',
    options: [
      option(0, 'No additional tranche', 'No additional donation is assumed beyond the baseline supply.'),
      option(1, '10% illustrative tranche', 'Adds 8 percentage points to the potential coverage ceiling; reduces procurement cost by US$2 per regimen.'),
      option(2, '20% illustrative tranche', 'Adds 16 percentage points to the potential coverage ceiling; reduces procurement cost by US$4 per regimen.')
    ]
  },
  {
    id: 'affordable', title: 'Affordable supply',
    description: 'A separate, non-overlapping sample tranche of affordable products.',
    options: [
      option(0, 'No additional tranche', 'No additional affordable tranche is assumed.'),
      option(1, '10% illustrative tranche', 'Adds 6 percentage points to the potential coverage ceiling; reduces procurement cost by US$1 per regimen.'),
      option(2, '20% illustrative tranche', 'Adds 12 percentage points to the potential coverage ceiling; reduces procurement cost by US$2 per regimen.')
    ]
  },
  {
    id: 'delivery', title: 'Delivery target',
    description: 'Sample timing from the common product-authorization trigger, before coordination adjustments.',
    options: [
      option(0, '120-day delivery target', 'No expedited-delivery premium is included.'),
      option(1, '90-day delivery target', 'Includes a US$0.50 delivery premium per complete regimen.'),
      option(2, '60-day delivery target', 'Includes a US$1 delivery premium per complete regimen.')
    ]
  },
  {
    id: 'sharing', title: 'Sharing readiness',
    description: 'Illustrative operational coordination after authorization; this is not a pathogen-development model.',
    options: [
      option(0, 'Ad hoc procedures', 'Adds 14 days of operational coordination.'),
      option(1, 'Standard procedures', 'Adds 7 days of operational coordination.'),
      option(2, 'Pre-agreed procedures', 'No additional coordination delay is assumed.')
    ]
  },
  {
    id: 'allocation', title: 'Country allocation',
    description: 'A toy allocation-readiness assumption, not a country entitlement or WHO allocation rule.',
    options: [
      option(0, 'Allocation unresolved', 'Uses 70% of the sample supply ceiling and adds 21 days.'),
      option(1, 'Allocation framework', 'Uses 85% of the sample supply ceiling and adds 7 days.'),
      option(2, 'Allocation specified in sample', 'Uses the full sample supply ceiling with no additional allocation delay.')
    ]
  },
  {
    id: 'licensing', title: 'Licensed supply readiness',
    description: 'A fictional incremental supply assumption; no real factory, license or ramp-up is modeled.',
    options: [
      option(0, 'No additional licensed supply', 'No additional supply or readiness cost is assumed.'),
      option(1, 'Standby readiness', 'Adds 6 percentage points to the coverage ceiling and US$0.35 per regimen.'),
      option(2, 'Advance readiness', 'Adds 12 percentage points to the coverage ceiling and US$0.70 per regimen.')
    ]
  },
  {
    id: 'contribution', title: 'Implementation cost allowance',
    description: 'A national cost assumption used to explore fiscal exposure, not a real financial obligation.',
    options: [
      option(0, 'US$2 per regimen', 'Adds US$2 of domestic implementation costs per complete regimen.'),
      option(1, 'US$1 per regimen', 'Adds US$1 of domestic implementation costs per complete regimen.'),
      option(2, 'US$0.50 per regimen', 'Adds US$0.50 of domestic implementation costs per complete regimen.')
    ]
  }
];
for (const term of TERMS) {
  term.options.forEach(Object.freeze);
  Object.freeze(term.options);
  Object.freeze(term);
}
Object.freeze(TERMS);

export const PRESETS = [
  {
    id: 'baseline', name: 'Current arrangements',
    description: 'Fictional comparison baseline with no additional pooled tranches.',
    terms: { donation: 0, affordable: 0, delivery: 0, sharing: 1, allocation: 1, licensing: 0, contribution: 0 }
  },
  {
    id: 'bridge', name: 'Balanced access',
    description: 'Earlier delivery, two additional supply tranches and a specified sample allocation.',
    terms: { donation: 1, affordable: 1, delivery: 1, sharing: 1, allocation: 2, licensing: 1, contribution: 1 }
  },
  {
    id: 'rapid', name: 'Rapid access',
    description: 'The fastest sample delivery and greatest supply readiness, with a higher implementation allowance.',
    terms: { donation: 2, affordable: 2, delivery: 2, sharing: 2, allocation: 2, licensing: 2, contribution: 0 }
  },
  {
    id: 'flexible', name: 'Flexible participation',
    description: 'Affordable supply with fewer readiness assumptions; eligibility and delivery remain conditional.',
    terms: { donation: 0, affordable: 2, delivery: 1, sharing: 1, allocation: 1, licensing: 0, contribution: 2 }
  }
];
for (const preset of PRESETS) {
  Object.freeze(preset.terms);
  Object.freeze(preset);
}
Object.freeze(PRESETS);

export const ASSUMPTIONS = [
  {
    title: 'Fictional country and scenario inputs', status: 'Fictional demo assumption',
    text: 'Pakistan is a display context. The priority population of 10 million, two-dose regimen, every price and every coefficient are invented for this demo. No values come from the existing simulator or constitute an offer, forecast or claim about Pakistan.'
  },
  {
    title: 'First usable delivery', status: 'Transparent toy formula',
    text: 'Arrival day = delivery target (120, 90 or 60 days) + sharing coordination delay (14, 7 or 0 days) + allocation delay (21, 7 or 0 days). Day 0 is a common first product authorization. Earlier pathogen sharing does not model faster vaccine development here.'
  },
  {
    title: 'Coverage and rollout', status: 'Transparent toy formula',
    text: 'Potential coverage = (62% + 8 percentage points per donation step + 6 points per affordable step + 6 points per licensing step) × allocation factor (70%, 85% or 100%), capped at 95%. At month m, coverage = potential coverage × min(1, max(0, (30m − arrival day) / 120)). All supply and rollout quantities are expressed in complete two-dose regimens; this simplified linear path is not a clinical or delivery forecast.'
  },
  {
    title: 'Cost per complete regimen', status: 'Transparent toy formula',
    text: 'Procurement cost = max(US$2, US$9 − US$2 per donation step − US$1 per affordable step). Add US$2 routine delivery, US$0/0.50/1 expedited delivery, US$0/0.35/0.70 licensing readiness, and US$2/1/0.50 implementation allowance. Costs compare the same complete regimen. A lower unit cost does not necessarily imply a lower total expenditure when more people are covered.'
  },
  {
    title: 'National totals and comparison', status: 'Arithmetic from fictional inputs',
    text: 'People covered = 10 million × coverage. Total cost = people covered × cost per complete regimen; this is the cost of modeled coverage, not a national budget. Current arrangements use the same scenario, population, horizon, regimen and formulas. Fixed infrastructure, financing sources, funding gaps, wastage and real fiscal obligations are not modeled.'
  },
  {
    title: 'Access conditions', status: 'Qualitative sample conditions',
    text: 'Labels summarize selected sample assumptions. Even a specified sample allocation does not establish a legal entitlement, enforceable delivery, actual eligibility or assured supply. No probability of agreement, political score, health impact or independently validated result is calculated.'
  },
  {
    title: 'Saving and portability', status: 'Demo behavior',
    text: 'A complete snapshot includes the schema, model version, fixed context identifier, seven term selections, horizon, selected package and comparison package. The JSON is readable and contains no notes. It is not encrypted. This calculation module has no network or account connection.'
  }
];
ASSUMPTIONS.forEach(Object.freeze);
Object.freeze(ASSUMPTIONS);

const TERM_IDS = TERMS.map(t => t.id);
const VALID_HORIZONS = [3, 6, 12];
const PRESET_IDS = PRESETS.map(p => p.id);
const SNAPSHOT_KEYS = ['schema', 'version', 'contextId', 'horizon', 'packageId', 'compareId', 'terms'];
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const sameKeys = (object, keys) => Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key));
const round = (n, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
const assertHorizon = horizon => {
  if (!VALID_HORIZONS.includes(horizon)) throw new TypeError('Choose a horizon of 3, 6 or 12 months.');
  return horizon;
};

export function validateTerms(terms) {
  if (!plainObject(terms) || !sameKeys(terms, TERM_IDS)) throw new TypeError('A package must contain exactly the seven demo term selections.');
  const normalized = {};
  for (const id of TERM_IDS) {
    if (!Number.isInteger(terms[id]) || terms[id] < 0 || terms[id] > 2) throw new TypeError('Each demo term must be an integer selection from 0 to 2.');
    normalized[id] = terms[id];
  }
  return normalized;
}

export function evaluate(terms, horizon = 6) {
  const t = validateTerms(terms);
  assertHorizon(horizon);
  const arrivalDay = [120, 90, 60][t.delivery] + [14, 7, 0][t.sharing] + [21, 7, 0][t.allocation];
  const potential = Math.min(0.95, (0.62 + 0.08 * t.donation + 0.06 * t.affordable + 0.06 * t.licensing) * [0.70, 0.85, 1][t.allocation]);
  const atMonth = month => round(100 * potential * Math.min(1, Math.max(0, (month * 30 - arrivalDay) / 120)), 1);
  const series = Array.from({ length: horizon + 1 }, (_, month) => ({ month, value: atMonth(month) }));
  const coverage = atMonth(horizon);
  const costPerRegimen = round(Math.max(2, 9 - 2 * t.donation - t.affordable) + 2 + [0, 0.5, 1][t.delivery] + [0, 0.35, 0.70][t.licensing] + [2, 1, 0.5][t.contribution]);
  const coveredMillions = round(CONTEXT.priorityPopulationMillions * coverage / 100, 3);
  const totalCostMillions = round(coveredMillions * costPerRegimen, 2);
  const conditions = [];
  if (t.allocation === 0) conditions.push('Country eligibility and allocation remain unresolved in this sample.');
  if (t.allocation === 1) conditions.push('The country allocation framework still requires confirmation.');
  if (t.delivery < 2) conditions.push('The delivery target and remedy for non-delivery require agreement.');
  if (t.sharing === 0) conditions.push('Operational sharing procedures require preparation.');
  if (t.licensing === 0) conditions.push('No additional licensed supply is assumed.');
  conditions.push('Real eligibility, available supply and domestic rollout require independent review.');
  const accessLabel = t.allocation === 0 ? 'Unresolved' : t.allocation === 2 && t.delivery === 2 && t.sharing === 2 ? 'Specified in sample' : 'Conditional';
  return { arrivalDay, coverage, costPerRegimen, totalCostMillions, coveredMillions, accessLabel, conditions, series };
}

export function createSnapshot({ terms, horizon = 6, packageId = 'custom', compareId = 'baseline' } = {}) {
  const normalizedTerms = validateTerms(terms);
  assertHorizon(horizon);
  if (![...PRESET_IDS, 'custom'].includes(packageId)) throw new TypeError('Unknown demo package selection.');
  if (!PRESET_IDS.includes(compareId)) throw new TypeError('Unknown comparison package.');
  if (packageId !== 'custom') {
    const preset = PRESETS.find(p => p.id === packageId);
    if (!TERM_IDS.every(id => preset.terms[id] === normalizedTerms[id])) throw new TypeError('The selected preset does not match its terms. Use custom for edited terms.');
  }
  return { schema: 'pabs-ministerial-demo', version: MODEL_VERSION, contextId: CONTEXT.id, horizon, packageId, compareId, terms: normalizedTerms };
}

export function serializeSnapshot(state) {
  return JSON.stringify(createSnapshot(state), null, 2);
}

export function parseSnapshot(json) {
  if (typeof json !== 'string' || json.length > 20000) throw new TypeError('Load a demo snapshot smaller than 20,000 characters.');
  let snapshot;
  try { snapshot = JSON.parse(json); } catch { throw new TypeError('This file is not valid demo JSON.'); }
  if (!plainObject(snapshot) || !sameKeys(snapshot, SNAPSHOT_KEYS)) throw new TypeError('This file does not contain a complete demo snapshot.');
  if (snapshot.schema !== 'pabs-ministerial-demo' || snapshot.version !== MODEL_VERSION || snapshot.contextId !== CONTEXT.id) throw new TypeError('This snapshot belongs to a different demo schema, version or context.');
  const checked = createSnapshot(snapshot);
  return { terms: checked.terms, horizon: checked.horizon, packageId: checked.packageId, compareId: checked.compareId };
}
