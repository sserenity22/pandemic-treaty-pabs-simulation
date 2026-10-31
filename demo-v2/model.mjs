// Unified deterministic PABS Annex & Ministerial Country Engine (demo-v2)
// Combines the clause-level PABS negotiation simulator (A79/8 on-screen text, 6 blocs, 7 core issues,
// 6 secondary provisions, 4 outbreak scenarios, trade finder) with the 217-country OWID COVID-19 trajectory
// engine from minister/index.html and backwards-compatible demo-v2 exports.
// Strictly deterministic: no LLM or network dependency exists inside this module.

import { MONTHS, WORLD_CUM, POOL, COUNTRY, PK_CONTEXT } from './country-data.mjs';

export { MONTHS, WORLD_CUM, POOL, COUNTRY, PK_CONTEXT };

export const MODEL_VERSION = 'demo-2.0.0';
export const ENGINE_VERSION = 'pabs-unified-2.1.0';

/* ==========================================================================
   1. CLAUSE-LEVEL PABS ENGINE (A79/8 On-Screen Text · IGWG-9 / WHA80)
   ========================================================================== */

export const BLOCS = [
  {
    k: 'EQ',
    n: 'Group for Equity',
    party: true,
    d: 'About 33 states, with Pakistan speaking for EMRO in close alignment. No delinking of access from benefits "under any configuration"; no anonymous access; mandatory, revenue-linked contributions; standard contracts annexed now.'
  },
  {
    k: 'AF',
    n: 'Africa Group +',
    party: true,
    d: 'Algeria for Africa Plus. Federated databases with binding commitments at the point of use; mandatory non-exclusive licensing; national ABS laws must not be overridden (Namibia).'
  },
  {
    k: 'EU',
    n: 'EU',
    party: true,
    d: 'Hybrid traffic-light model; calls point-of-access quid pro quo "transactional"; contributions only "on mutually agreed terms"; accepts structured PHEIC benefits for in-scope pathogens; wants PABS recognised as a Nagoya specialised instrument.'
  },
  {
    k: 'G6',
    n: 'CH · NO · JP · UK · CA',
    party: true,
    d: 'No percentage in the text for PHEICs (UK, Switzerland, Japan); Switzerland and Norway reported red line on a set-aside before a pandemic is declared (unnamed sources); resist contracts as a condition of access.'
  },
  {
    k: 'IF',
    n: 'Pharma (IFPMA)',
    party: false,
    d: 'Not a Party; decides whether to sign contracts. Opposes linking access to financial obligations, mandatory monetary contributions and IP limits; defends open databases; protects the pandemic set-aside balance.'
  },
  {
    k: 'CS',
    n: 'Civil society',
    party: false,
    d: 'Coded on the equity pole (MSF, South Centre, TWN). KEI dissents on linkage and proposes a registration-and-sale trigger instead.'
  }
];

export const PARTY = [0, 1, 2, 3];

export const LEVERS = {
  contracts: {
    ref: 'II.A.6(c)',
    opts: {
      tc: {
        lab: 'Binding terms; contract only for those who opt in',
        q: '… entities utilizing PABS Materials and Sequence Information for commercial purposes that have entered into legally binding WHO PABS Contracts',
        fx: {},
        b: [-2, -2, 1, 1, 1, -1]
      },
      prov: {
        lab: 'Provider chooses whether a contract comes first',
        q: 'Hybrid deck, 15 July 2026: “Providers can require a contract or commitment to sign contracts before access.” Not in the 30 April text.',
        fx: { E: 0.12, comp: 0.01 },
        b: [0, -1, 2, 1, 1, 0]
      },
      pre: {
        lab: 'Contract signed before commercial access',
        q: '… sign WHO PABS Contracts [prior to access] setting out[, inter alia,] their obligations [for benefit-sharing]',
        fx: { E: 0.25, comp: 0.02 },
        b: [2, 2, -2, -2, -1, 2]
      }
    }
  },
  hook: {
    ref: 'Outside the text',
    opts: {
      none: {
        lab: 'No further hook',
        q: 'No hook beyond the WHO PABS Contract.',
        fx: {},
        b: [0, 0, 0, 0, 0, 0]
      },
      eul: {
        lab: 'Enforced at WHO EUL / prequalification',
        q: 'Obligation attaches when a manufacturer submits for Emergency Use Listing or prequalification.',
        fx: { E: 0.3, comp: 0.01 },
        b: [1, 1, 0, 0, -1, 1]
      },
      reg: {
        lab: 'Triggered by registration and sale',
        q: 'KEI proposal, IGWG-7: a WHO contract as a condition of product registration and sale, whether or not PABS materials were used.',
        fx: { E: 0.4, comp: 0.02 },
        b: [1, 1, -2, -2, -2, 1]
      }
    }
  },
  db: {
    ref: 'II.B.3(c) / 3alt',
    opts: {
      inform: {
        lab: 'Databases inform users',
        q: '[inform users] … about the WHO Pandemic Agreement and the PABS System',
        fx: {},
        b: [-2, -2, 1, 1, 2, -2],
        rl: ['EQ', 'AF']
      },
      terms: {
        lab: 'Users accept binding terms; access immediate',
        q: '[require users, as a condition of access, to agree to legally binding terms]',
        fx: { E: 0.1, comp: 0.01, delay: 0.5 },
        b: [1, 1, 0, 0, -1, 0]
      },
      daa: {
        lab: 'Registered, verified users with a data access agreement',
        q: '(c) ALT Provide access … without discrimination, to registered and verified users that have accepted the data access agreement',
        fx: { E: 0.2, comp: 0.02, delay: 1 },
        b: [2, 2, -1, -1, -2, 1]
      },
      alt3: {
        lab: 'Binding WHO agreement; suspension; liability',
        q: '[3alt. … binding agreement with WHO … immediately suspend access for violators … potential liability for damages to provider countries]',
        fx: { E: 0.25, comp: 0.04, delay: 2 },
        b: [2, 2, -2, -2, -2, 2]
      }
    }
  },
  arch: {
    ref: 'Outside the text',
    opts: {
      open: {
        lab: 'Existing databases',
        q: 'WHO-recognised databases under II.B.2ter, no new architecture.',
        fx: {},
        b: [-1, -2, 1, 1, 2, -1]
      },
      hybrid: {
        lab: 'Hybrid traffic light',
        q: 'Provider picks green, orange or red access; national routes stay open (15 July 2026 deck).',
        fx: { E: 0.05, comp: 0.01 },
        b: [0, -1, 2, 1, 1, 0]
      },
      fed: {
        lab: 'Federated, no download',
        q: 'Queries run where the data sits; only results leave (Africa Plus paper, 15 July 2026).',
        fx: { E: 0.1, comp: 0.03, delay: 0.5 },
        b: [1, 2, -2, -1, -2, 1]
      }
    }
  },
  trace: {
    ref: 'II.B.1(a)(iii)',
    opts: {
      upi: {
        lab: 'Identifier on each sample',
        q: '(iiialt) ensure that a unique persistent identifier is assigned and attached to each PABS Material and Sequence Information',
        fx: { E: 0.05 },
        b: [0, 0, 1, 1, 1, 0]
      },
      full: {
        lab: 'Track all downstream uses; auto-trigger',
        q: '… enables provider countries to track all downstream uses … automatically triggers benefit-sharing obligations when commercial value is generated',
        fx: { E: 0.15, comp: 0.04 },
        b: [2, 2, -2, -1, -2, 1]
      }
    }
  },
  tier: {
    ref: 'II.A.5alt / II.A.6 · WHA79 decision',
    opts: {
      mfr: {
        lab: 'Willing manufacturers only; model clauses to the COP',
        q: 'II.A.6(c): entities … that have entered into legally binding WHO PABS Contracts. Contract terms left to the Conference of the Parties.',
        fx: {},
        b: [-2, -2, 1, 1, 1, -1]
      },
      tiered: {
        lab: 'Standard contracts annexed now for commercial users; lighter terms for non-commercial',
        q: '[ALT to replace both (c) and (d) above: Entities concluding contracts or entering into cooperation agreements with WHO, pursuant to section C. 1, C. 2 and/or C. 3.]',
        fx: { E: 0.1, comp: 0.01 },
        b: [1, 1, 0, 0, -1, 1]
      },
      all: {
        lab: 'All participants under standardized binding contracts',
        q: '[5alt. All participants of the PABS System shall as a condition of participation, be subject to respective standardized legally binding contractual instruments.]',
        fx: { E: 0.15, comp: 0.02 },
        b: [2, 2, -2, -2, -2, 2]
      }
    }
  },
  contrib: {
    ref: 'II.C.1(a)(i)',
    opts: {
      cost: {
        lab: 'Operating costs only',
        q: 'annual monetary contributions … [related to the operational costs associated with the functioning of the PABS system]',
        fx: { pct: 0, fix: 0.002, fund: 0.03 },
        b: [-2, -2, 1, 1, -1, -2]
      },
      sub: {
        lab: 'Flat subscription by size + revenue % above a sales threshold',
        q: 'Bridge, not in the text: combines (i) operational-cost contributions with the (i)alt revenue percentage, applied only above a COP-set sales threshold for PABS-derived products.',
        fx: { pct: 0.0005, fix: 0.003, fund: 0.05 },
        b: [1, 1, 0, 0, -1, 0]
      },
      p01: {
        lab: 'At least 0.1% of net sales',
        q: '[(i)alt … calculated as a percentage of annual net sales revenue … not less than [0.1%] of such revenue]',
        fx: { pct: 0.001 },
        b: [1, 1, -1, -1, -2, 0],
        rl: ['IF']
      },
      mile: {
        lab: 'Milestone payments',
        q: '[(i)bis … milestone payments … upon: (i) filing patent applications … (ii) initiating Phase III … (iii) regulatory approval … (iv) sales thresholds]',
        fx: { fix: 0.01, fund: 0.1 },
        b: [1, 1, -1, -1, -2, 1],
        rl: ['IF']
      },
      roy: {
        lab: 'Royalties on net sales (modelled at 2%)',
        q: '[(i)ter. Manufacturers shall pay royalties of [X]% of net sales from PABS-derived products]',
        fx: { pct: 0.02 },
        b: [2, 2, -2, -2, -2, 2],
        rl: ['IF']
      }
    }
  },
  pheic: {
    ref: 'II.C.1(b)',
    opts: {
      opt: {
        lab: 'Supply on request, no floor',
        q: '(i) agreeing to provide, where available, promptly and on a priority basis to WHO on its request, such products [as a donation or] at affordable prices',
        fx: { d: 0, a: 0.03 },
        b: [-2, -2, 2, 2, 2, -2]
      },
      floor: {
        lab: 'A minimum floor per contract, no fixed %; in-scope pathogens only',
        q: 'Bridge from the July informals: “a minimum floor … little support for a single fixed quantity or percentage.” Limited to PHEICs caused by pathogens in PABS scope (EU position).',
        fx: { d: 0.04, a: 0.04 },
        b: [0, 0, 1, 0, 0, -1]
      },
      alt3: {
        lab: 'At least 10% as a donation',
        q: '[(b alt. 3) … make available to WHO as a donation … no less than 10 per cent of its real time production …]',
        fx: { d: 0.10, a: 0 },
        b: [1, 1, -1, -2, -1, 0],
        rl: ['G6']
      },
      r8: {
        lab: 'Reserve 20%: 8% free, 12% not-for-profit',
        q: '[(ii) … Reserve for WHO at least 20% of real-time production … at least 8% … free of charge and the remaining 12% at not-for-profit prices]',
        fx: { d: 0.08, a: 0.12 },
        b: [2, 2, -2, -2, -2, 1],
        rl: ['G6']
      },
      r10: {
        lab: 'Reserve 20%: 10% free, 10% not-for-profit',
        q: '[(ii) … at least [10%] of real-time production free of charge and the remaining [10%] at not-for-profit prices]',
        fx: { d: 0.10, a: 0.10 },
        b: [2, 2, -2, -2, -2, 2],
        rl: ['G6']
      }
    }
  },
  menu: {
    ref: 'II.C.1(a)(ii)',
    opts: {
      two: {
        lab: 'At least two from the menu',
        q: 'commit to at least [x] / [two] / [three] of the following options',
        fx: { menu: 0.005 },
        b: [-1, -1, 1, 1, 1, -1]
      },
      three: {
        lab: 'At least three',
        q: '… at least [three] of the following options',
        fx: { menu: 0.01 },
        b: [0, 0, 0, 0, 0, 0]
      },
      all: {
        lab: 'All, mandatory',
        q: '[commit to all of the following mandatory obligations, adapted to their nature and capacity] (C.2(b))',
        fx: { menu: 0.02 },
        b: [2, 2, -2, -2, -2, 2]
      }
    }
  },
  licence: {
    ref: 'II.C.1(b) alt. 1(ii)',
    opts: {
      none: {
        lab: 'Voluntary licensing only',
        q: '(4) … the granting of non-exclusive licenses … [under mutually agreed terms] — one option on the menu.',
        fx: {},
        b: [-1, -1, 1, 1, 1, -1]
      },
      standby: {
        lab: 'Standby licences, triggered if WHO need is unmet',
        q: 'Bridge using alt. 1’s own trigger: “Sub-licensing shall be triggered where the Participating Manufacturer is unable to meet all the needs of WHO and affected countries in a timely manner.” Run through the Medicines Patent Pool.',
        fx: { lic: 0.02 },
        b: [1, 1, 0, 0, -1, 1]
      },
      rf: {
        lab: 'Royalty-free, sublicensable licences to WHO at signature',
        q: '[Grant to WHO, upon signing the WHO PABS Contract, non-exclusive, royalty-free, worldwide licenses that can be sublicensed …]',
        fx: { lic: 0.05 },
        b: [2, 2, -2, -2, -2, 2],
        rl: ['EU', 'IF']
      }
    }
  },
  abs: {
    ref: 'I.A.1bis / II.A.7',
    opts: {
      spec: {
        lab: 'PABS displaces national ABS for compliant signers',
        q: '7. … Participating Manufacturers and other entities that comply with WHO PABS Contracts shall not be subject to additional benefit-sharing measures with respect to matters covered by such contracts.',
        fx: {},
        b: [-1, -2, 2, 2, 2, -1],
        rl: ['AF']
      },
      cond: {
        lab: 'Displacement, with fallback after a COP finding of non-delivery',
        q: 'Bridge, not in the text: paragraph 7 applies, and the 1bis fallback switches on only after a Conference of the Parties finding that benefits were not delivered.',
        fx: { comp: 0.01 },
        b: [1, 1, 1, 0, -1, 0]
      },
      fb: {
        lab: 'National ABS fallback if PABS fails to deliver',
        q: '[1bis. In the event that the PABS System does not deliver equitable benefit-sharing … Parties retain their full sovereign rights to apply national access and benefit-sharing Laws]',
        fx: { comp: 0.02, E: 0.05 },
        b: [2, 2, -2, -1, -2, 1],
        rl: ['IF']
      }
    }
  },
  scope: {
    ref: 'I.B(a) and note',
    title: 'Is influenza in scope?',
    opts: {
      in: {
        lab: 'Influenza covered by PABS',
        q: '“Pathogen with pandemic potential” means any pathogen that has the potential for sustained transmission in humans …',
        fx: { flu: true },
        b: [0, 0, 0, 0, -1, 1]
      },
      out: {
        lab: 'Exclude influenza; PIP Framework applies',
        q: '[NOTE: … exclusion of influenza viruses for the purpose of the PABS Annex]',
        fx: { flu: false },
        b: [0, 0, 0, 0, 1, -1]
      }
    }
  },
  share: {
    ref: 'II.B.1(a)',
    title: 'How fast must a Party share?',
    opts: {
      asap: {
        lab: 'As soon as possible, after national risk assessment',
        q: '[shall] / [may] … as [soon as] [available]/[possible] … [after] initial national risk assessment',
        fx: { delay: 10 },
        b: [1, 1, -2, -1, -2, 0]
      },
      xdays: {
        lab: 'Within a fixed number of days (modelled as 7)',
        q: '… within [X] days of identification of such pathogen',
        fx: { delay: 5 },
        b: [0, 0, 0, 0, 0, 0]
      },
      h24: {
        lab: 'Within 24 hours (reported developed-country proposal, IGWG-8)',
        q: 'Not in the 30 April text; EU Oct 2025 input proposed “[48] hours”.',
        fx: { delay: 0 },
        b: [-1, -1, 2, 1, 2, 0]
      }
    }
  },
  ip: {
    ref: 'II.A.5(d)',
    title: 'How wide is the IP waiver?',
    opts: {
      narrow: {
        lab: 'No IP over materials “in the form received”',
        q: 'not claim any intellectual property rights over PABS Materials and Sequence Information … in the form received from the PABS System',
        fx: {},
        b: [-1, -1, 1, 1, 1, -1]
      },
      broad: {
        lab: 'No IP or other rights that limit access or use',
        q: '[not claim any intellectual property or other rights that limit the facilitated access to or use of PABS Materials and Sequence Information …]',
        fx: { comp: 0.04 },
        b: [1, 1, -1, -1, -2, 2]
      }
    }
  },
  pandemic: {
    ref: 'II.C.1(c) = Art. 12.6(a)',
    title: 'Pandemic emergency: the affordable remainder',
    opts: {
      floor: {
        lab: '10% donated; flexibility used in full',
        q: '… a minimum threshold of ten per cent (10%) of its real-time production is made available to WHO as a donation',
        fx: { a: 0 },
        b: [-2, -2, 1, 1, 2, -2]
      },
      mid: {
        lab: '10% donated + 5% at affordable prices',
        q: '… the remaining percentage, with flexibility based on the nature and capacity of each Participating Manufacturer, is reserved at affordable prices',
        fx: { a: 0.05 },
        b: [0, 0, 0, 0, 0, 0]
      },
      full: {
        lab: 'The full target: 10% donated + 10% affordable',
        q: '… rapid access targeting twenty per cent (20%) of its real-time production …',
        fx: { a: 0.10 },
        b: [1, 1, -1, -1, -1, 1]
      }
    }
  },
  export: {
    ref: 'II.C.1(b)bis',
    title: 'Shield WHO quantities from export bans?',
    opts: {
      yes: {
        lab: 'Yes, committed quantities exempt',
        q: '[Parties shall ensure that pandemic-related health products committed under WHO PABS Contracts … are not subject to export prohibitions …]',
        fx: { deliv: 1 },
        b: [2, 2, -1, -1, 1, 1]
      },
      no: {
        lab: 'No, paragraph deleted',
        q: 'National export controls apply to WHO quantities.',
        fx: { deliv: 0.8 },
        b: [-1, -1, 1, 1, 0, -1]
      }
    }
  },
  gov: {
    ref: 'III.A · IGWG-8',
    title: 'Who appoints the PABS Advisory Group?',
    opts: {
      dg: {
        lab: 'The Director-General, Parties nominate',
        q: 'Reported developed-country position at IGWG-8; the group reports first to the DG.',
        fx: {},
        b: [-1, -1, 1, 1, 1, 0]
      },
      cop: {
        lab: 'Parties nominate, the COP elects',
        q: 'EU input of 17 October 2025, ¶34; close to the developing-country position that the COP appoints.',
        fx: {},
        b: [1, 1, 0, -1, 0, 0]
      },
      reg: {
        lab: 'Regions nominate, the COP appoints',
        q: 'Africa Group proposal at IGWG-8; Western Pacific and Americas regions called it not acceptable.',
        fx: {},
        b: [1, 2, -1, -1, -1, 0]
      }
    }
  }
};

export const SECONDARY = ['scope', 'share', 'ip', 'pandemic', 'export', 'gov'];

export const ISSUES = [
  {
    id: 'link',
    n: 1,
    title: 'Access–benefit link',
    ref: 'I.A.1 “equal footing” · II.A.6(c)',
    pos: [
      { k: 'a', lab: 'No link at access; contract optional', d: 'Benefits arise only if a manufacturer chooses to sign.', set: { contracts: 'tc', hook: 'none' }, rl: ['EQ', 'AF'], who: 'IFPMA' },
      { k: 'b', lab: 'Provider chooses (hybrid traffic light)', d: 'Green: no conditions. Orange: commit to sign. Red: contract first.', set: { contracts: 'prov', hook: 'none' }, rl: ['EQ', 'AF'], who: 'EU' },
      { k: 'c', lab: 'Contract before commercial use, enforced at EUL', d: 'Open sharing; no product reaches WHO-listed markets without a signed contract.', set: { contracts: 'tc', hook: 'eul' }, who: 'Bridge' },
      { k: 'd', lab: 'Obligation at registration and sale', d: 'Any product registered and sold triggers the WHO contract (KEI).', set: { contracts: 'tc', hook: 'reg' }, who: 'KEI' },
      { k: 'e', lab: 'Contract before any commercial access', d: 'Point-of-access linkage: no commercial access without a signed contract.', set: { contracts: 'pre', hook: 'none' }, who: 'Equity, Africa' },
      { k: 'f', lab: 'Contract before access, enforced at EUL', d: 'Point-of-access linkage plus a market chokepoint.', set: { contracts: 'pre', hook: 'eul' }, who: '—' }
    ]
  },
  {
    id: 'access',
    n: 2,
    title: 'Open vs registered access to sequences',
    ref: 'II.B.3 · II.B.1(a)(iii)',
    pos: [
      { k: 'a', lab: 'Open, anonymous databases', d: 'Status quo; users need not identify themselves.', set: { db: 'inform', arch: 'open', trace: 'upi' }, who: 'IFPMA' },
      { k: 'b', lab: 'Hybrid: open and gated both allowed', d: 'Registration optional, at the Party’s choice.', set: { db: 'terms', arch: 'hybrid', trace: 'upi' }, who: 'EU' },
      { k: 'c', lab: 'Registration without gating', d: 'Users identify and accept terms; access is free and immediate.', set: { db: 'terms', arch: 'open', trace: 'upi' }, who: 'Bridge' },
      { k: 'd', lab: 'Registered users with a data access agreement', d: 'Verified users only, bound before access.', set: { db: 'daa', arch: 'open', trace: 'upi' }, who: 'Equity, Pakistan' },
      { k: 'e', lab: 'Federated, no download, full traceability', d: 'Sovereign nodes; queries run in place; downstream use tracked.', set: { db: 'daa', arch: 'fed', trace: 'full' }, who: 'Africa Plus' },
      { k: 'f', lab: 'Binding WHO agreements, suspension and liability', d: 'Databases contract with WHO; violators suspended.', set: { db: 'alt3', arch: 'fed', trace: 'full' }, who: '—' }
    ]
  },
  {
    id: 'tier',
    n: 3,
    title: 'Who signs binding contracts',
    ref: 'II.A.5alt · II.A.6 · WHA79 decision',
    pos: [
      { k: 'a', lab: 'Willing manufacturers only', d: 'Model clauses agreed later by the COP.', set: { tier: 'mfr' }, who: 'EU, JP, CH' },
      { k: 'b', lab: 'Tiered standard contracts, annexed now', d: 'Manufacturers and commercial users sign; non-commercial users accept lighter terms.', set: { tier: 'tiered' }, who: 'Bridge' },
      { k: 'c', lab: 'All users under standard binding contracts', d: 'SMTA1, SMTA2 and data access agreement as annexes.', set: { tier: 'all' }, who: 'Equity, Africa' }
    ]
  },
  {
    id: 'money',
    n: 4,
    title: 'Monetary contributions',
    ref: 'II.C.1(a)(i)',
    pos: [
      { k: 'a', lab: 'Operating costs only', d: 'Cost recovery; no revenue link.', set: { contrib: 'cost' }, who: 'EU, G6' },
      { k: 'b', lab: 'Subscription + revenue % above a threshold', d: 'Flat fee by size; a small revenue share only above a sales threshold.', set: { contrib: 'sub' }, who: 'Bridge' },
      { k: 'c', lab: 'At least 0.1% of net sales', d: 'Revenue-linked from the first sale.', set: { contrib: 'p01' }, who: 'Equity' },
      { k: 'd', lab: 'Milestone payments', d: 'Paid at patent filing, Phase III, approval and sales thresholds.', set: { contrib: 'mile' }, who: '—' },
      { k: 'e', lab: 'Royalties on net sales', d: 'Modelled at 2%.', set: { contrib: 'roy' }, who: '—' }
    ]
  },
  {
    id: 'pheic',
    n: 5,
    title: 'Set-aside in a PHEIC, before any pandemic',
    ref: 'II.C.1(b)',
    pos: [
      { k: 'a', lab: 'Supply on request, no floor', d: 'Donation or affordable prices where available.', set: { pheic: 'opt' }, who: 'IFPMA, G6' },
      { k: 'b', lab: 'Minimum floor per contract, in-scope pathogens', d: 'No fixed percentage in the annex.', set: { pheic: 'floor' }, who: 'Bridge' },
      { k: 'c', lab: 'At least 10% donated', d: 'Alt. 3.', set: { pheic: 'alt3' }, who: '—' },
      { k: 'd', lab: 'Reserve 20%: 8% free', d: '12% at not-for-profit prices.', set: { pheic: 'r8' }, who: '—' },
      { k: 'e', lab: 'Reserve 20%: 10% free', d: '10% at not-for-profit prices.', set: { pheic: 'r10' }, who: 'Equity' }
    ]
  },
  {
    id: 'lic',
    n: 6,
    title: 'Licensing and technology transfer',
    ref: 'II.C.1(a)(ii) · (b) alt. 1',
    pos: [
      { k: 'a', lab: 'Menu of two, licensing voluntary', d: '“As mutually agreed.”', set: { menu: 'two', licence: 'none' }, who: 'EU, IFPMA' },
      { k: 'b', lab: 'Menu of three', d: 'Licensing still voluntary.', set: { menu: 'three', licence: 'none' }, who: '—' },
      { k: 'c', lab: 'Standby licences if WHO need is unmet', d: 'Agreed at signature; triggered only on shortfall; run through the Medicines Patent Pool.', set: { menu: 'two', licence: 'standby' }, who: 'Bridge' },
      { k: 'd', lab: 'Whole menu mandatory', d: 'All non-monetary benefits required.', set: { menu: 'all', licence: 'none' }, who: '—' },
      { k: 'e', lab: 'Royalty-free licences to WHO at signature', d: 'Plus the whole menu.', set: { menu: 'all', licence: 'rf' }, who: 'Equity, Africa' }
    ]
  },
  {
    id: 'abs',
    n: 7,
    title: 'National ABS laws vs Nagoya specialised instrument',
    ref: 'I.A.1bis · II.A.7',
    pos: [
      { k: 'a', lab: 'PABS displaces national ABS for signers', d: 'Recognised under Nagoya Art. 4.4.', set: { abs: 'spec' }, who: 'EU, IFPMA' },
      { k: 'b', lab: 'Displacement with a performance fallback', d: 'National laws return only after a COP finding of non-delivery.', set: { abs: 'cond' }, who: 'Bridge' },
      { k: 'c', lab: 'National ABS fallback if PABS fails', d: '1bis as drafted.', set: { abs: 'fb' }, who: 'Africa, Namibia' }
    ]
  }
];

export const W0 = {
  EQ: [3, 3, 2, 2, 2, 2, 1],
  AF: [3, 3, 2, 2, 2, 2, 3],
  EU: [3, 3, 2, 2, 2, 1, 2],
  G6: [2, 2, 2, 2, 3, 1, 2],
  IF: [3, 2, 2, 3, 2, 3, 2],
  CS: [3, 2, 2, 2, 2, 3, 1]
};

export const SECW = 0.5;
export const SECDEF = {
  scope: 'in',
  share: 'xdays',
  ip: 'narrow',
  pandemic: 'full',
  export: 'yes',
  gov: 'dg'
};

export const CLAUSE_PRESETS = [
  {
    k: 'unb',
    n: 'Unbracketed text (30 Apr)',
    short: '30 Apr text',
    desc: 'Only the unbracketed words of the 30 April 2026 on-screen annex text (A79/8).',
    p: {
      i: { link: 'a', access: 'c', tier: 'a', money: 'a', pheic: 'a', lic: 'a', abs: 'a' },
      s: { scope: 'in', share: 'asap', ip: 'narrow', pandemic: 'mid', export: 'no', gov: 'dg' }
    }
  },
  {
    k: 'bridge',
    n: 'Term sheet bridge',
    short: 'Bridge',
    desc: 'Every Party clears the line; 10% free + 10% affordable in a pandemic; standby licensing; export shield.',
    p: {
      i: { link: 'c', access: 'c', tier: 'b', money: 'b', pheic: 'b', lic: 'c', abs: 'b' },
      s: { scope: 'in', share: 'xdays', ip: 'narrow', pandemic: 'full', export: 'yes', gov: 'cop' }
    }
  },
  {
    k: 'hyb',
    n: 'EU hybrid model',
    short: 'EU hybrid',
    desc: 'Provider chooses green, orange or red access; structured PHEIC floor; PABS displaces national ABS.',
    p: {
      i: { link: 'b', access: 'b', tier: 'b', money: 'c', pheic: 'b', lic: 'a', abs: 'a' },
      s: { scope: 'in', share: 'xdays', ip: 'narrow', pandemic: 'full', export: 'yes', gov: 'cop' }
    }
  },
  {
    k: 'fed',
    n: 'Africa Plus federated',
    short: 'Africa Plus',
    desc: 'Sovereign federated nodes, no download; contract before access; 20% PHEIC reserve; national ABS fallback.',
    p: {
      i: { link: 'e', access: 'e', tier: 'c', money: 'c', pheic: 'e', lic: 'c', abs: 'c' },
      s: { scope: 'in', share: 'asap', ip: 'narrow', pandemic: 'full', export: 'yes', gov: 'reg' }
    }
  },
  {
    k: 'max',
    n: 'Equity maximal',
    short: 'Equity max',
    desc: 'Every equity demand at once: contract before access, royalties, royalty-free licences at signature.',
    p: {
      i: { link: 'e', access: 'f', tier: 'c', money: 'e', pheic: 'e', lic: 'e', abs: 'c' },
      s: { scope: 'in', share: 'asap', ip: 'broad', pandemic: 'full', export: 'yes', gov: 'reg' }
    }
  },
  {
    k: 'min',
    n: 'EU / pharma minimal',
    short: 'Minimal',
    desc: 'Open databases, willing manufacturers only, operating costs only, 10% pandemic floor, no export shield.',
    p: {
      i: { link: 'a', access: 'a', tier: 'a', money: 'a', pheic: 'a', lic: 'a', abs: 'a' },
      s: { scope: 'out', share: 'h24', ip: 'narrow', pandemic: 'floor', export: 'no', gov: 'dg' }
    }
  }
];

export const PRESET_DESC = Object.fromEntries(CLAUSE_PRESETS.map(p => [p.k, p.desc]));

export const SCEN = [
  {
    k: 'ebola',
    n: 'Ebola-type',
    type: 'pheic',
    flu: false,
    P: 1,
    R: 0.15,
    yrs: 1,
    lic: 2,
    d: 'A PHEIC with almost no market (Bundibugyo has no licensed vaccine). Set-asides deliver little; licences and regional production carry the value.',
    src: 'Illustrative: 1M doses of a candidate vaccine, revenue US$0.15B. Placeholder.'
  },
  {
    k: 'h1n1',
    n: 'H1N1-type',
    type: 'pandemic',
    flu: true,
    P: 500,
    R: 4,
    yrs: 1,
    lic: 50,
    d: 'A mild influenza pandemic. Whether influenza sits in PABS or under the PIP Framework decides which system delivers.',
    src: 'Placeholder: 0.5B doses, US$4B. To be sourced from WHO H1N1 2009 reports and filings.'
  },
  {
    k: 'covid',
    n: 'COVID-type',
    type: 'pandemic',
    flu: false,
    P: 13000,
    R: 110,
    yrs: 2,
    lic: 650,
    d: 'A severe pandemic with a very large market: about 13B doses over two years; revenue of the two leading mRNA makers about US$110B.',
    src: 'Doses ≈13B administered by end-2022 (Our World in Data). Revenue: Pfizer Comirnaty 2021 $36.8B + 2022 $37.8B; Moderna 2021 $17.7B + 2022 $18.4B (10-K filings).'
  },
  {
    k: 'x',
    n: 'Novel-X',
    type: 'pandemic',
    flu: false,
    P: 6000,
    R: 40,
    yrs: 2,
    lic: 300,
    d: 'A novel pathogen that becomes a pandemic emergency. Mid-sized market.',
    src: 'Illustrative: 6B doses, US$40B over two years.'
  }
];

export const DEFAULT_ASSUMPTIONS = {
  tol: 0.22,
  m: 0.5,
  bench: 1,
  thr: 50
};

export const SOURCES = [
  ['A79/8, Appendix: draft PABS Annex, on-screen text as at 30 April 2026', 'https://apps.who.int/gb/ebwha/pdf_files/WHA79/A79_8-en.pdf'],
  ['WHA78.1: WHO Pandemic Agreement (Art. 11 fn 8; Art. 12.6)', 'https://apps.who.int/gb/ebwha/pdf_files/WHA78/A78_R1-en.pdf'],
  ['A/IGWG/8/4: report of IGWG-8, 14–18 September 2026', 'https://apps.who.int/gb/igwg/pdf_files/IGWG8/A_IGWG8_4-en.pdf'],
  ['EU input of 17 October 2025 on possible provisions of the PABS Annex', 'https://www.eeas.europa.eu/sites/default/files/2025/documents/EU%20input%20of%2017%20October%202025%20on%20possible%20provisions%20of%20the%20PABS%20Annex.pdf'],
  ['PABS Hybrid Model deck, 15 July 2026', 'https://healthpolicy-watch.news/wp-content/uploads/2026/07/PABS_hybrid_landing_zone_15.07.2026.pdf'],
  ['Pre-IGWG7 informals outcomes, 6 July 2026', 'https://healthpolicy-watch.news/wp-content/uploads/2026/07/PABS-IGWG7-Debriefing-of-Informals.pdf'],
  ['IFPMA statement, IGWG-6, 23 March 2026', 'https://www.ifpma.org/wp-content/uploads/2026/03/230326_PABS-instrument_IGWG6_Statement_IFPMA.pdf'],
  ['IFPMA statement, IGWG-7, 6 July 2026', 'https://www.ifpma.org/wp-content/uploads/2026/07/06072026_PABS_Instrument_Statement_IGWG7_IFPMA.pdf'],
  ['TWN, IGWG-7 positions, 13 July 2026 (pro-developing-country framing)', 'https://twn.my/title2/biotk/2026/btk260701.htm'],
  ['TWN, IGWG-8 positions, 4 October 2026', 'https://twn.my/title2/health.info/2026/hi261001.htm'],
  ['Health Policy Watch: two opposing models for pathogen sharing', 'https://healthpolicy-watch.news/pandemic-talks-consider-two-opposing-models-for-pathogen-sharing/'],
  ['KEI proposed text: registration and sale trigger', 'https://www.keionline.org/41357'],
  ['WHO PIP Framework, 15th anniversary figures', 'https://www.who.int/initiatives/pandemic-influenza-preparedness-framework/15th-anniversary'],
  ['Our World in Data: COVID-19 vaccinations & excess deaths (217 countries, 2020–2022)', 'https://ourworldindata.org/covid-vaccinations']
];

export const clone = o => JSON.parse(JSON.stringify(o));

export const fmtD = m =>
  m >= 1000
    ? (m / 1000).toFixed(m >= 10000 ? 0 : 1) + 'B'
    : m >= 1
      ? Math.round(m) + 'M'
      : m > 0
        ? Math.round(m * 1000) + 'k'
        : '0';

export const fmt$ = b =>
  b >= 1
    ? '$' + b.toFixed(b >= 10 ? 0 : 1) + 'B'
    : b >= 0.001
      ? '$' + Math.round(b * 1000) + 'M'
      : '$0';

export const fmtL = n =>
  n >= 1e6
    ? (n / 1e6).toFixed(1) + 'M'
    : n >= 1000
      ? Math.round(n / 1000) + 'k'
      : Math.round(n) + '';

export const fmtPop = p =>
  p >= 1e9
    ? (p / 1e9).toFixed(2) + 'B'
    : p >= 1e6
      ? (p / 1e6).toFixed(p >= 1e8 ? 0 : 1) + 'M'
      : Math.round(p / 1e3) + 'k';

export const posOf = (iss, k) => iss.pos.find(p => p.k === k) || iss.pos[0];

export function leversOf(p) {
  const S = Object.assign({}, SECDEF, (p && p.s) || {});
  for (const iss of ISSUES) {
    const pos = posOf(iss, p && p.i ? p.i[iss.id] : iss.pos[0].k);
    Object.assign(S, pos.set);
  }
  return S;
}

export function model(p, scOrKey = 'covid', over = {}, assumptions = DEFAULT_ASSUMPTIONS) {
  const sc = typeof scOrKey === 'string' ? SCEN.find(s => s.k === scOrKey) || SCEN[2] : scOrKey;
  const A = Object.assign({}, DEFAULT_ASSUMPTIONS, assumptions);
  const S = leversOf(p);
  let E = 0.1;
  let comp = 0;
  let delay = 0;
  let pct = 0;
  let fix = 0;
  let fund = 0;
  let menu = 0;
  let lic = 0;
  let deliv = 1;
  let flu = true;

  for (const id in S) {
    const opt = LEVERS[id] && LEVERS[id].opts[S[id]];
    if (!opt) continue;
    const x = opt.fx;
    E += x.E || 0;
    comp += x.comp || 0;
    delay += x.delay || 0;
    lic += x.lic || 0;
    if (x.pct != null) pct = x.pct;
    if (x.fix != null) fix = x.fix;
    if (x.fund != null) fund = x.fund;
    if (x.menu != null) menu = x.menu;
    if (x.deliv != null) deliv = x.deliv;
    if (x.flu != null) flu = x.flu;
  }
  E = Math.min(1, E);

  let d;
  let a;
  if (sc.type === 'pheic') {
    const ph = LEVERS.pheic.opts[S.pheic].fx;
    d = ph.d;
    a = ph.a;
  } else {
    d = 0.10;
    a = LEVERS.pandemic.opts[S.pandemic].fx.a;
  }
  if (over.s != null) {
    d = over.s / 2;
    a = over.s / 2;
  }

  const tol = over.tol ?? A.tol;
  const c = d + a * A.m + pct + menu + lic;
  const B = c + comp + fix;
  const p_ = (0.95 * (0.3 + 0.7 * E)) / (1 + Math.exp((B - tol) / 0.06));
  const inPABS = !(sc.flu && !flu);
  const doses = inPABS ? p_ * sc.P * (d + a) * deliv + (lic ? p_ * sc.lic * (lic / 0.05) : 0) : sc.P * 0.11;
  const timely = Math.exp(-delay / 45);
  return {
    E,
    B,
    c,
    p: p_,
    d,
    a,
    doses,
    lives: doses * 1e3 * A.bench * timely,
    fundB: inPABS ? fund * sc.yrs + pct * sc.R * p_ : 0,
    cost: inPABS ? c * sc.R * p_ : 0,
    delay,
    deliv,
    lic,
    inPABS
  };
}

export function issueScore(iss, k, bi) {
  const set = posOf(iss, k).set;
  const ids = Object.keys(set);
  return ids.reduce((s, id) => s + LEVERS[id].opts[set[id]].b[bi], 0) / ids.length;
}

export function evalBlocs(p, weights = W0, assumptions = DEFAULT_ASSUMPTIONS) {
  const A = Object.assign({}, DEFAULT_ASSUMPTIONS, assumptions);
  const W = weights || W0;
  return BLOCS.map((b, bi) => {
    let sw = 0;
    let ss = 0;
    const rls = [];
    ISSUES.forEach((iss, ii) => {
      const w = (W[b.k] && W[b.k][ii]) ?? W0[b.k][ii];
      ss += w * issueScore(iss, p.i[iss.id], bi);
      sw += w;
      const pos = posOf(iss, p.i[iss.id]);
      if (pos.rl && pos.rl.includes(b.k)) rls.push(iss.title);
      for (const id in pos.set) {
        const o = LEVERS[id].opts[pos.set[id]];
        if (o.rl && o.rl.includes(b.k)) rls.push(iss.title + ': ' + o.lab);
      }
    });
    const S = Object.assign({}, SECDEF, p.s);
    for (const id of SECONDARY) {
      const o = LEVERS[id].opts[S[id]];
      ss += SECW * o.b[bi];
      sw += SECW;
    }
    const score = Math.round(((ss / sw + 2) / 4) * 100);
    const uniqueRls = [...new Set(rls)];
    return {
      b,
      score,
      rls: uniqueRls,
      ok: score >= A.thr && !uniqueRls.length
    };
  });
}

export function verdictOf(ev) {
  const parties = ev.filter(x => x.b.party);
  return {
    signable: parties.every(x => x.ok),
    minP: Math.min(...parties.map(x => x.score)),
    blocking: parties.filter(x => !x.ok)
  };
}

/**
 * Deterministic COVID-2 country trajectory calculation from minister/index.html.
 * Computes historical COVID-19 coverage vs. modeled COVID-2 coverage for any of the 217 OWID countries.
 */
export function covid2(p, countryCode = 'PAK', assumptions = DEFAULT_ASSUMPTIONS) {
  const code = COUNTRY[countryCode] ? countryCode : 'PAK';
  const c = COUNTRY[code];
  const sc = SCEN.find(s => s.k === 'covid');
  const r = model(p, sc, {}, assumptions);
  const S = leversOf(p);
  const exportFactor = S.export === 'no' ? 0.8 : 1;
  const whoShare = (r.d + r.a) * r.p * (r.inPABS ? 1 : 0) * exportFactor;
  const pop = Number(c.pop) || 0;
  const myShare = pop > 0 ? pop / POOL : 0;
  // Extra doses arriving to this country at month m through the WHO PABS pool
  const extra = m => WORLD_CUM[m] * whoShare * myShare;
  // Note: minister/index.html uses: Math.min(90, c.cov[m] + 100 * extra(m) / c.pop) where cov is doses per 100 people (capped at 90).
  const cov2 = MONTHS.map((_, m) => {
    const baseCov = Number(c.cov[m]) || 0;
    const addCov = pop > 0 ? (100 * extra(m)) / pop : 0;
    return Math.min(90, +(baseCov + addCov).toFixed(2));
  });
  const firstDay2 = c.first_day == null ? 30 : Math.min(c.first_day, 30);
  const extra6m = extra(6); // June 2021
  const extra12m = extra(12); // Dec 2021
  const extraEnd = extra(24); // Dec 2022

  const donatedShare = r.d + r.a > 0 ? r.d / (r.d + r.a) : 0;
  const affordableShare = r.d + r.a > 0 ? r.a / (r.d + r.a) : 0;
  const cov6Actual = Number(c.cov[6]) || 0;
  const cov12Actual = Number(c.cov[12]) || 0;

  return {
    code,
    country: c,
    r,
    whoShare,
    myShare,
    cov1: c.cov,
    cov2,
    extra,
    extra6m,
    extra12m,
    extraEnd,
    donatedDosesEnd: extraEnd * donatedShare,
    affordableDosesEnd: extraEnd * affordableShare,
    firstDay1: c.first_day,
    firstDay2,
    daysSaved: c.first_day != null ? Math.max(0, c.first_day - firstDay2) : null,
    gap6mActual: cov6Actual,
    gap6mWithPabs: cov2[6],
    gain6mPoints: +(cov2[6] - cov6Actual).toFixed(1),
    gap12mActual: cov12Actual,
    gap12mWithPabs: cov2[12],
    gain12mPoints: +(cov2[12] - cov12Actual).toFixed(1)
  };
}

export function idealFor(biOrBlocKey) {
  const bi = typeof biOrBlocKey === 'number' ? biOrBlocKey : Math.max(0, BLOCS.findIndex(b => b.k === biOrBlocKey));
  const p = { i: {}, s: {} };
  ISSUES.forEach(iss => {
    let best = iss.pos[0];
    let bs = -9;
    iss.pos.forEach(pp => {
      const s = issueScore(iss, pp.k, bi);
      if (s > bs) {
        bs = s;
        best = pp;
      }
    });
    p.i[iss.id] = best.k;
  });
  SECONDARY.forEach(id => {
    let bk = null;
    let bs = -9;
    for (const [k, o] of Object.entries(LEVERS[id].opts)) {
      if (o.b[bi] > bs) {
        bs = o.b[bi];
        bk = k;
      }
    }
    p.s[id] = bk;
  });
  return p;
}

function tradeObjective(p, sc, floor, weights, assumptions) {
  const ev = evalBlocs(p, weights, assumptions);
  const v = verdictOf(ev);
  const m = model(p, sc, {}, assumptions);
  const vetoes = ev.filter(x => x.b.party && x.rls.length).length;
  const dosePenalty = m.doses < floor ? 50 + (100 * (floor - m.doses)) / Math.max(floor, 1e-9) : 0;
  return {
    score: v.minP - 40 * vetoes - dosePenalty + (m.doses / Math.max(floor, 1e-9)) * 0.01,
    v,
    m,
    ev,
    vetoes
  };
}

/**
 * Deterministic coordinate-ascent Trade Finder from app/index.html.
 * Searches across all 7 issues + 6 secondary levers to lift the least satisfied Party
 * while respecting every coded red line and keeping doses above the user's floor.
 */
export function findTrades(startPkg, scOrKey = 'covid', floorPct = 80, weights = W0, assumptions = DEFAULT_ASSUMPTIONS) {
  const sc = typeof scOrKey === 'string' ? SCEN.find(s => s.k === scOrKey) || SCEN[2] : scOrKey;
  const start = clone(startPkg);
  const m0 = model(start, sc, {}, assumptions);
  const e0 = evalBlocs(start, weights, assumptions);
  const v0 = verdictOf(e0);
  const floor = m0.doses * (Number(floorPct) || 0) / 100;

  const dims = [
    ...ISSUES.map(iss => ({ t: 'i', id: iss.id, opts: iss.pos.map(p => p.k) })),
    ...SECONDARY.map(id => ({ t: 's', id, opts: Object.keys(LEVERS[id].opts) }))
  ];
  const get = (p, d) => (d.t === 'i' ? p.i[d.id] : Object.assign({}, SECDEF, p.s)[d.id]);
  const put = (p, d, v) => {
    if (d.t === 'i') {
      p.i[d.id] = v;
    } else {
      p.s = Object.assign({}, SECDEF, p.s);
      p.s[d.id] = v;
    }
  };

  const climb = p => {
    let cur = tradeObjective(p, sc, floor, weights, assumptions);
    let improved = true;
    let n = 0;
    while (improved && n < 12) {
      improved = false;
      n++;
      for (const d of dims) {
        let bv = get(p, d);
        let bs = cur.score;
        for (const o of d.opts) {
          if (o === bv) continue;
          put(p, d, o);
          const s = tradeObjective(p, sc, floor, weights, assumptions).score;
          if (s > bs + 1e-9) {
            bs = s;
            bv = o;
          }
        }
        put(p, d, bv);
        if (bs > cur.score + 1e-9) {
          cur = tradeObjective(p, sc, floor, weights, assumptions);
          improved = true;
        }
      }
    }
    return { p, o: cur };
  };

  // Deterministic seed bank (start package + all 6 presets + bloc ideals) so results are 100% reproducible
  const seeds = [
    clone(start),
    ...CLAUSE_PRESETS.map(x => clone(x.p)),
    ...PARTY.map(bi => idealFor(bi))
  ];

  let best = null;
  for (const s of seeds) {
    const r = climb(s);
    if (!best || r.o.score > best.o.score) best = r;
  }

  const e1 = best.o.ev;
  const moves = [];
  dims.forEach(d => {
    const a = get(start, d);
    const b = get(best.p, d);
    if (a === b) return;
    const tmp = clone(start);
    put(tmp, d, b);
    const ea = evalBlocs(start, weights, assumptions);
    const eb = evalBlocs(tmp, weights, assumptions);
    const ma = model(start, sc, {}, assumptions);
    const mb = model(tmp, sc, {}, assumptions);
    const deltas = ea.map((x, i) => ({
      k: x.b.k,
      n: x.b.n,
      party: x.b.party,
      dd: eb[i].score - x.score
    }));
    const gains = deltas.filter(x => x.dd > 0).sort((x, y) => y.dd - x.dd);
    const losses = deltas.filter(x => x.dd < 0).sort((x, y) => x.dd - y.dd);
    const iss = d.t === 'i' ? ISSUES.find(i => i.id === d.id) : null;
    const fromPos = iss ? posOf(iss, a) : LEVERS[d.id].opts[a];
    const toPos = iss ? posOf(iss, b) : LEVERS[d.id].opts[b];
    const lifted = ea.filter((x, i) => x.rls.length > eb[i].rls.length).map(x => x.b.n);
    const tripped = ea.filter((x, i) => x.rls.length < eb[i].rls.length).map(x => x.b.n);
    moves.push({
      type: d.t,
      id: d.id,
      number: iss ? iss.n : null,
      title: iss ? `${iss.n}. ${iss.title}` : LEVERS[d.id].title,
      ref: iss ? iss.ref : LEVERS[d.id].ref,
      fromKey: a,
      toKey: b,
      fromLabel: fromPos.lab,
      toLabel: toPos.lab,
      lifted,
      tripped,
      gains,
      losses,
      doseDelta: mb.doses - ma.doses
    });
  });

  return {
    startPkg: start,
    bestPkg: best.p,
    floorPct: Number(floorPct) || 0,
    floorDoses: floor,
    startModel: m0,
    bestModel: best.o.m,
    startVerdict: v0,
    bestVerdict: best.o.v,
    startBlocs: e0,
    bestBlocs: e1,
    moves
  };
}

/**
 * Issue-by-issue waterfall comparison between Package A and Package B.
 */
export function comparePackages(pkgA, pkgB, scOrKey = 'covid', weights = W0, assumptions = DEFAULT_ASSUMPTIONS) {
  const sc = typeof scOrKey === 'string' ? SCEN.find(s => s.k === scOrKey) || SCEN[2] : scOrKey;
  const ma = model(pkgA, sc, {}, assumptions);
  const mb = model(pkgB, sc, {}, assumptions);
  const ea = evalBlocs(pkgA, weights, assumptions);
  const eb = evalBlocs(pkgB, weights, assumptions);
  const va = verdictOf(ea);
  const vb = verdictOf(eb);

  const cur = clone(pkgA);
  let prevDoses = ma.doses;
  let prevMinP = va.minP;
  const waterfall = [];

  ISSUES.forEach(iss => {
    if (cur.i[iss.id] === pkgB.i[iss.id]) return;
    const fromPos = posOf(iss, cur.i[iss.id]);
    const toPos = posOf(iss, pkgB.i[iss.id]);
    cur.i[iss.id] = pkgB.i[iss.id];
    const m = model(cur, sc, {}, assumptions);
    const v = verdictOf(evalBlocs(cur, weights, assumptions));
    waterfall.push({
      id: iss.id,
      title: `${iss.n}. ${iss.title}`,
      fromLabel: fromPos.lab,
      toLabel: toPos.lab,
      doseDelta: m.doses - prevDoses,
      minPartyDelta: v.minP - prevMinP
    });
    prevDoses = m.doses;
    prevMinP = v.minP;
  });

  const sA = Object.assign({}, SECDEF, pkgA.s);
  const sB = Object.assign({}, SECDEF, pkgB.s);
  if (JSON.stringify(sA) !== JSON.stringify(sB)) {
    cur.s = clone(sB);
    const m = model(cur, sc, {}, assumptions);
    const v = verdictOf(evalBlocs(cur, weights, assumptions));
    waterfall.push({
      id: 'secondary',
      title: 'Other provisions (scope, timing, IP, pandemic remainder, export shield, governance)',
      fromLabel: 'Package A secondary settings',
      toLabel: 'Package B secondary settings',
      doseDelta: m.doses - prevDoses,
      minPartyDelta: v.minP - prevMinP
    });
  }

  return {
    sc,
    ma,
    mb,
    ea,
    eb,
    va,
    vb,
    waterfall
  };
}

export function encodePackageCode(p) {
  const payload = JSON.stringify({ v: 2, i: p.i, s: p.s || SECDEF, n: p.notes || {} });
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(payload)));
  }
  return Buffer.from(payload, 'utf8').toString('base64');
}

export function decodePackageCode(code) {
  const raw = typeof atob === 'function'
    ? decodeURIComponent(escape(atob(code.trim())))
    : Buffer.from(code.trim(), 'base64').toString('utf8');
  const o = JSON.parse(raw);
  if (!o || !o.i) throw new Error('Invalid package code: missing issue selections.');
  ISSUES.forEach(iss => {
    if (!iss.pos.some(p => p.k === o.i[iss.id])) {
      throw new Error(`Invalid position for issue ${iss.id}`);
    }
  });
  return { i: o.i, s: Object.assign({}, SECDEF, o.s || {}), notes: o.n || {} };
}

export function formatBriefText(pkg, scOrKey = 'covid', countryCode = 'PAK', weights = W0, assumptions = DEFAULT_ASSUMPTIONS) {
  const sc = typeof scOrKey === 'string' ? SCEN.find(s => s.k === scOrKey) || SCEN[2] : scOrKey;
  const m = model(pkg, sc, {}, assumptions);
  const ev = evalBlocs(pkg, weights, assumptions);
  const v = verdictOf(ev);
  const c2 = covid2(pkg, countryCode, assumptions);
  const S = Object.assign({}, SECDEF, pkg.s);

  const lines = [
    `PABS ANNEX NEGOTIATION BRIEF — ${c2.country.name.toUpperCase()} (${countryCode})`,
    `Base text: draft PABS Annex, on-screen text 30 April 2026 (A79/8) · Engine ${ENGINE_VERSION}`,
    ``,
    `1. MULTILATERAL VERDICT: ${v.signable ? 'SIGNABLE BY ALL 4 STATE BLOCS' : 'NOT SIGNABLE YET'} — lowest Party acceptance ${v.minP}/100`
  ];
  if (!v.signable) {
    v.blocking.forEach(x => {
      lines.push(`   - Blocking Party: ${x.b.n} — ${x.rls.length ? 'veto on ' + x.rls.join('; ') : 'below threshold (' + x.score + '/100)'}`);
    });
  }
  lines.push(
    ``,
    `2. NATIONAL OUTCOME FOR ${c2.country.name.toUpperCase()} (COVID-2 BENCHMARK, POP. ${fmtPop(c2.country.pop)})`,
    `   - Cumulative doses to ${c2.country.name} via WHO PABS pool (24m): ${fmtD(c2.extraEnd / 1e6)} (${fmtD(c2.donatedDosesEnd / 1e6)} donated free + ${fmtD(c2.affordableDosesEnd / 1e6)} at not-for-profit price)`,
    `   - 6-month coverage (June 2021): ${c2.gap6mActual.toFixed(1)}% actual COVID-19 -> ${c2.gap6mWithPabs.toFixed(1)}% with this PABS package (+${c2.gain6mPoints} pts)`,
    `   - 12-month coverage (Dec 2021): ${c2.gap12mActual.toFixed(1)}% actual COVID-19 -> ${c2.gap12mWithPabs.toFixed(1)}% with this PABS package (+${c2.gain12mPoints} pts)`,
    `   - First supply arrival: Day ${c2.firstDay2} (vs. ${c2.firstDay1 != null ? 'Day ' + c2.firstDay1 + ' in COVID-19 (' + c2.country.first + ')' : 'unrecorded in COVID-19'})`,
    ``,
    `3. GLOBAL SYSTEM OUTCOMES (${sc.n.toUpperCase()} SCENARIO)`,
    `   - Total doses to WHO pool: ${fmtD(m.doses)}`,
    `   - Manufacturers signing PABS contracts: ${m.inPABS ? Math.round(m.p * 100) + '%' : 'n/a (influenza under PIP Framework)'}`,
    `   - Money to the PABS System: ${fmt$(m.fundB)} over ${sc.yrs} yr(s)`,
    `   - Cost to signing manufacturers: ${fmt$(m.cost)} (${(m.c * 100).toFixed(1)}% of window revenue)`,
    ``,
    `4. POSITIONS ACROSS THE 7 CONTESTED TERM-SHEET ISSUES`
  );
  ISSUES.forEach(iss => {
    const pos = posOf(iss, pkg.i[iss.id]);
    lines.push(`   ${iss.n}. ${iss.title} [${iss.ref}]: (${pos.k.toUpperCase()}) ${pos.lab}`);
    if (pkg.notes && pkg.notes[iss.id]) {
      lines.push(`      Delegation wording / note: ${pkg.notes[iss.id]}`);
    }
  });
  lines.push(``, `5. SECONDARY PROVISIONS`);
  SECONDARY.forEach(id => {
    lines.push(`   - ${LEVERS[id].title} [${LEVERS[id].ref}]: ${LEVERS[id].opts[S[id]].lab}`);
  });
  lines.push(``, `6. BLOC ACCEPTANCE (WEIGHTED, THRESHOLD ${assumptions.thr ?? DEFAULT_ASSUMPTIONS.thr}/100)`);
  ev.forEach(x => {
    lines.push(`   - ${x.b.n}${x.b.party ? '' : ' (non-Party)'}: ${x.score}/100${x.rls.length ? ' — RED LINE: ' + x.rls.join('; ') : ''}`);
  });
  return lines.join('\n');
}

export function serializeWorkspaceSnapshot(state) {
  const payload = {
    schema: 'pabs-unified-workspace-v2',
    version: ENGINE_VERSION,
    savedAt: new Date().toISOString(),
    countryCode: state.countryCode || 'PAK',
    blocKey: state.blocKey || 'EQ',
    scenarioKey: state.scenarioKey || 'covid',
    activePreset: state.activePreset || 'custom',
    comparePresetA: state.comparePresetA || 'current',
    comparePresetB: state.comparePresetB || 'bridge',
    pkg: clone(state.pkg),
    weights: clone(state.weights || W0),
    assumptions: clone(state.assumptions || DEFAULT_ASSUMPTIONS)
  };
  return JSON.stringify(payload, null, 2);
}

export function parseWorkspaceSnapshot(json) {
  if (typeof json !== 'string' || json.length > 100000) {
    throw new TypeError('Workspace snapshot file must be smaller than 100,000 characters.');
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new TypeError('This file is not valid JSON.');
  }
  if (parsed && parsed.schema === 'pabs-ministerial-demo') {
    const legacy = parseSnapshot(json);
    const mappedPreset = legacy.packageId === 'bridge' ? 'bridge' : legacy.packageId === 'rapid' ? 'max' : 'unb';
    const basePkg = clone(CLAUSE_PRESETS.find(p => p.k === mappedPreset).p);
    basePkg.notes = {};
    return {
      countryCode: 'PAK',
      blocKey: 'EQ',
      scenarioKey: 'covid',
      activePreset: mappedPreset,
      comparePresetA: 'current',
      comparePresetB: 'bridge',
      pkg: basePkg,
      weights: clone(W0),
      assumptions: clone(DEFAULT_ASSUMPTIONS)
    };
  }
  if (!parsed || parsed.schema !== 'pabs-unified-workspace-v2' || !parsed.pkg || !parsed.pkg.i) {
    throw new TypeError('This file does not contain a valid PABS workspace snapshot.');
  }
  ISSUES.forEach(iss => {
    if (!iss.pos.some(p => p.k === parsed.pkg.i[iss.id])) {
      throw new TypeError(`Invalid position key for issue "${iss.id}".`);
    }
  });
  return {
    countryCode: COUNTRY[parsed.countryCode] ? parsed.countryCode : 'PAK',
    blocKey: BLOCS.some(b => b.k === parsed.blocKey) ? parsed.blocKey : 'EQ',
    scenarioKey: SCEN.some(s => s.k === parsed.scenarioKey) ? parsed.scenarioKey : 'covid',
    activePreset: parsed.activePreset || 'custom',
    comparePresetA: parsed.comparePresetA || 'current',
    comparePresetB: parsed.comparePresetB || 'bridge',
    pkg: {
      i: clone(parsed.pkg.i),
      s: Object.assign({}, SECDEF, parsed.pkg.s || {}),
      notes: clone(parsed.pkg.notes || {})
    },
    weights: clone(parsed.weights || W0),
    assumptions: Object.assign({}, DEFAULT_ASSUMPTIONS, parsed.assumptions || {})
  };
}

/* ==========================================================================
   2. BACKWARDS-COMPATIBLE DEMO-V2 TOY INTERFACE (FOR EXISTING CHECKS)
   ========================================================================== */

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
    title: 'Empirical OWID COVID-19 baseline & illustrative PABS engine', status: 'Empirical baseline + illustrative model',
    text: 'Historical COVID-19 vaccination trajectories and excess mortality for 217 countries come from Our World in Data (2020–2022). The PABS participation logistic curve, bloc weights and red-line scores are an illustrative, open-source negotiation testbed.'
  },
  {
    title: 'First usable delivery', status: 'Transparent formula',
    text: 'In the country COVID-2 trajectory, signing manufacturers deliver their PABS percentage from the first month of global supply (capped at 30 days for first delivery), distributed across developing countries by population share of the 4.17B pool.'
  },
  {
    title: 'Coverage and rollout', status: 'Transparent formula',
    text: 'Manufacturer participation = 0.95 × (0.3 + 0.7 × leverage) / (1 + e^((burden − tolerance)/0.06)). Doses to WHO = participation × production × (donation % + affordable %) × delivery + licensed regional supply.'
  },
  {
    title: 'Cost to manufacturers & revenue share', status: 'Transparent formula',
    text: 'Cost share c = donation% + affordable% × margin_forgone + annual_revenue_% + menu_cost + licence_cost. Burden B = c + compliance_load + fixed_fees.'
  },
  {
    title: 'Two signatures required', status: 'Multilateral + commercial test',
    text: 'Parties sign the PABS Annex (all four state blocs EQ, AF, EU, G6 must clear the acceptance threshold with zero red-line vetoes); manufacturers sign WHO PABS Contracts.'
  },
  {
    title: 'Strict separation between deterministic engine and AI copilot', status: 'Architecture guardrail',
    text: 'Every dose, percentage, coverage curve, cost and bloc score is computed deterministically in model.mjs. The Gemini agent reads draft text, cites clauses, flags out-of-scope provisions, and drafts bridging wording grounded strictly in these deterministic numbers.'
  },
  {
    title: 'Saving and portability', status: 'Local-first privacy',
    text: 'Packages, weights and snapshots remain in your browser. Delegations can share compact base64 package codes or JSON snapshots over their own channels.'
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
