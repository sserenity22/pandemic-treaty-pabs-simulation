// Gemini 2.5 Flash Agentic Layer for the PABS Annex & Ministerial Workspace (demo-v2)
// Implements Slide 8 of proposal/index.html ("Today's Text — how the agentic prototype works")
// plus the Bridging Clause Drafter Copilot and Ministerial Brief & Q&A Synthesizer.
//
// STRICT ARCHITECTURAL GUARDRAIL:
// This module NEVER computes doses, coverage curves, manufacturer participation, costs, or bloc scores.
// All numerical calculations live exclusively in ./model.mjs. The Gemini agent:
//   (1) Reads draft or bracketed PABS Annex text, maps clauses to the 7 core issues + 6 secondary levers
//       with verbatim quotes and confidence levels, and flags "Outside Model Scope" text for human review;
//   (2) Drafts diplomat-ready bridging annex language for deterministic Trade Finder moves;
//   (3) Synthesizes country-tailored Ministerial briefs & defensive Q&A strictly grounded in model.mjs outputs.

import {
  BLOCS,
  ISSUES,
  LEVERS,
  SECONDARY,
  SECDEF,
  SCEN,
  COUNTRY,
  PK_CONTEXT,
  posOf,
  leversOf,
  model,
  evalBlocs,
  verdictOf,
  covid2,
  fmtD,
  fmt$,
  fmtPop
} from './model.mjs';

export const GEMINI_MODEL = 'gemini-2.5-flash';

/* ==========================================================================
   1. SAMPLE NEGOTIATING TEXTS (FOR "TODAY'S TEXT" SLIDE 8 WORKFLOW)
   ========================================================================== */

export const SAMPLE_TEXTS = [
  {
    id: 'a79-8-unbracketed',
    title: 'WHA79 On-Screen Text (A79/8, 30 Apr 2026) — Unbracketed Baseline + Key Brackets',
    source: 'WHO Document A79/8 Appendix (30 April 2026)',
    badge: 'Official A79/8 Baseline',
    description: 'The public on-screen text transmitted to WHA79. Only unbracketed words are treated as agreed baseline; heavily bracketed benefit-sharing paragraphs show the open split.',
    text: `DRAFT PABS ANNEX — ON-SCREEN TEXT AS AT 30 APRIL 2026 (A79/8 APPENDIX)

SECTION I. GENERAL PROVISIONS
I.A.1. The Pathogen Access and Benefit-Sharing (PABS) System is established pursuant to Article 12 of the WHO Pandemic Agreement to ensure rapid, systematic and timely sharing of PABS Materials and Sequence Information, and, on an equal footing, rapid, timely, fair and equitable sharing of monetary and non-monetary benefits arising from their utilization.
[I.A.1bis. In the event that the PABS System does not deliver equitable benefit-sharing in accordance with this Annex, Parties retain their full sovereign rights to apply national access and benefit-sharing Laws.]
I.B(a). "Pathogen with pandemic potential" means any pathogen that has the potential for sustained transmission in humans and wide geographical spread. [NOTE: Delegations hold diverging views on the exclusion of influenza viruses covered by the PIP Framework for the purpose of the PABS Annex.]

SECTION II. OPERATIONAL MODALITIES
II.A.5(d). Participants shall not claim any intellectual property rights over PABS Materials and Sequence Information in the form received from the PABS System.
II.A.6(c). Benefit-sharing obligations apply to entities utilizing PABS Materials and Sequence Information for commercial purposes that have entered into legally binding WHO PABS Contracts; model contract clauses shall be developed and approved by the Conference of the Parties (COP).
II.A.7. Participating Manufacturers and other entities that comply with WHO PABS Contracts shall not be subject to additional benefit-sharing measures with respect to matters covered by such contracts.

II.B.1(a). Each Party shall share PABS Materials and Sequence Information as soon as possible after initial national risk assessment.
II.B.1(a)(iiialt). WHO-recognised databases shall ensure that a unique persistent identifier is assigned and attached to each PABS Material and Sequence Information.
II.B.3(c). WHO-recognised databases shall require users, as a condition of access, to agree to legally binding terms of reference, while keeping access free of charge and immediate.

II.C.1(a)(i). Participating Manufacturers shall pay annual monetary contributions related to the operational costs associated with the functioning of the PABS system.
II.C.1(a)(ii). Participating Manufacturers shall commit to at least two of the following non-monetary options from the menu, including voluntary non-exclusive licensing under mutually agreed terms.
II.C.1(b)(i). During a Public Health Emergency of International Concern (PHEIC), Participating Manufacturers agree to provide, where available, promptly and on a priority basis to WHO on its request, pandemic-related health products as a donation or at affordable prices.
II.C.1(c). During a pandemic emergency, in accordance with Article 12.6(a), each Participating Manufacturer shall make available to WHO rapid access targeting twenty per cent (20%) of its real-time production, with a minimum threshold of ten per cent (10%) as a donation and the remaining percentage, with flexibility based on nature and capacity (modelled at 5%), reserved at affordable prices.

SECTION III. GOVERNANCE AND FINANCIAL MECHANISM
III.A.1. The Director-General shall establish and appoint the PABS Advisory Group from nominations submitted by Parties.
III.B.2. Monetary contributions received under Section II.C.1(a)(i) shall be channelled through the Coordinating Financial Mechanism established under Article 20 of the WHO Pandemic Agreement, subject to fiduciary rules adopted by the COP.`
  },
  {
    id: 'igwg9-chair-bridge',
    title: 'IGWG-9 Informal Chair’s Bridging Non-Paper (Landing Zone Draft)',
    source: 'Illustrative IGWG-9 Informal Bridging Text (Nov 2026)',
    badge: 'Landing Zone Bridge',
    description: 'An informal bridging draft combining an EUL regulatory hook, registration without gating, tiered annexed contracts, subscription + threshold revenue share, standby MPP licensing, and export-ban exemptions.',
    text: `INFORMAL CHAIR'S BRIDGING NON-PAPER — PABS ANNEX LANDING ZONE (IGWG-9)

1. Access–Benefit Linkage & Regulatory Hook [Ref: I.A.1 · II.A.6(c)bis]:
Sharing of PABS Materials and Sequence Information in WHO-recognised databases shall remain rapid and unencumbered at the point of scientific query; however, no commercial entity may submit a vaccine, therapeutic or diagnostic derived from or utilizing the PABS System for WHO Emergency Use Listing (EUL), WHO Prequalification, or procurement by UN agencies without an executed, legally binding WHO PABS Contract in force.

2. Database Registration & Traceability [Ref: II.B.3(c) · II.B.1(a)(iii)]:
WHO-recognised databases shall operate on existing open scientific infrastructure, requiring all users to register verified institutional identities and accept legally binding terms prior to query, while keeping access immediate and free of charge. A unique persistent identifier (UPI) shall be assigned to every sample and sequence.

3. Tiered Contractual Instruments Annexed at Adoption [Ref: II.A.5alt / II.A.6]:
Standardized WHO PABS Contracts for commercial manufacturers shall be annexed to this Instrument upon adoption at WHA80, while academic and non-commercial research entities shall operate under lighter standardized click-wrap cooperation terms.

4. Dual-Tier Monetary Contributions [Ref: II.C.1(a)(i) Bridge]:
Participating Manufacturers shall pay (a) an annual tiered subscription fee scaled to enterprise size to cover PABS operational and surveillance costs, plus (b) a revenue contribution of 0.05% of net annual sales applied exclusively above a COP-determined commercial sales threshold for products utilizing the PABS System.

5. Structured PHEIC Floor & Full 20% Pandemic Set-Aside [Ref: II.C.1(b)-(c)]:
(a) In a PHEIC caused by a pathogen within PABS scope, each Participating Manufacturer commits to a contractually specified minimum supply floor (averaging 4% donated and 4% at not-for-profit prices) without fixing a single rigid statutory percentage across all product classes.
(b) In a pandemic emergency under Article 12.6(a), Participating Manufacturers shall provide the full twenty per cent (20%) real-time production target: 10% free of charge as a donation and 10% at affordable not-for-profit prices.
(c) [Ref: II.C.1(b)bis] Parties shall ensure that pandemic-related health products committed under WHO PABS Contracts are exempt from national export prohibitions or restrictions.

6. Standby Licensing Triggered by Unmet WHO Need [Ref: II.C.1(a)(ii) · II.C.1(b) alt. 1]:
Participating Manufacturers shall commit to at least two non-monetary benefit options and execute a Standby Non-Exclusive Licensing Protocol with the Medicines Patent Pool (MPP) upon contract signature; sub-licensing to qualified regional manufacturers shall be automatically triggered only where the Participating Manufacturer is unable to meet WHO and affected-country demand in a timely manner.

7. Conditional Nagoya Specialised Instrument with COP Performance Fallback [Ref: I.A.1bis · II.A.7]:
Compliance with a WHO PABS Contract satisfies national access and benefit-sharing obligations (Article II.A.7), provided that the sovereign fallback under paragraph I.A.1bis may be activated only following a formal determination by the Conference of the Parties (COP) of systemic non-delivery of contracted benefits.

8. Scope, Sharing Window, IP & Governance [Ref: I.B · II.B.1(a) · II.A.5(d) · III.A]:
- Pathogens with pandemic potential include pandemic influenza strains alongside novel pathogens.
- Parties shall upload sequence data within 7 days of pathogen identification.
- Participants shall not claim IP rights over PABS Materials or Sequence Information in the form received.
- Parties shall nominate and the Conference of the Parties (COP) shall elect the members of the PABS Advisory Group.
- Dispute settlement between WHO and a Participating Manufacturer shall be referred to binding UNCITRAL arbitration in Geneva, with a 60-day cure period prior to contract suspension.`
  },
  {
    id: 'equity-africa-joint',
    title: 'Group for Equity & Africa Plus Joint Room Proposal (EMRO / Pakistan & Algeria)',
    source: 'Coded from Group for Equity & Africa Group IGWG-7 / IGWG-8 Room Statements',
    badge: 'Equity / Africa Pole',
    description: 'Reflects Pakistan (speaking for EMRO / Group for Equity) and Africa Plus positions: point-of-access contracts, federated/registered databases, annexed contracts for all users, 20% PHEIC reserve, mandatory licensing, and sovereign ABS preservation.',
    text: `JOINT ROOM DRAFT — GROUP FOR EQUITY & AFRICA PLUS (IGWG ROOM TEXT)

1. Point-of-Access Linkage ("Equal Footing") [Ref: I.A.1 · II.A.6(c)]:
Access to PABS Materials and Sequence Information and the sharing of benefits shall operate strictly on an equal footing. No delinking of access from benefit-sharing obligations shall be permitted under any configuration. Commercial entities shall sign legally binding WHO PABS Contracts prior to access to any PABS Materials or Sequence Information.

2. Federated Sovereign Databases & Full Downstream Traceability [Ref: II.B.3(c) ALT · II.B.1(a)(iii)]:
Access to sequence information shall be provided exclusively through a federated system of nationally governed or WHO-bound nodes to registered and verified users that have executed a binding Data Access Agreement (DAA). Raw bulk download and anonymous access are prohibited; queries shall run in place with full downstream tracking that automatically triggers benefit-sharing obligations when commercial value is generated.

3. Standardized Contracts Annexed Now for All Participants [Ref: II.A.5alt]:
All participants of the PABS System (SMTA-1, SMTA-2, and Data Access Agreement users) shall, as a condition of participation, be subject to standardized legally binding contractual instruments adopted as integral annexes to this Instrument prior to ratification.

4. Mandatory Annual Revenue-Linked Contributions [Ref: II.C.1(a)(i)alt]:
Participating Manufacturers shall pay mandatory annual monetary contributions into the PABS Fund calculated as a percentage of annual net sales revenue of vaccines, therapeutics and diagnostics relevant to pathogens with pandemic potential, set at not less than 0.1% of such annual net sales revenue from the first sale.

5. Binding 20% Real-Time Production Set-Aside in Both PHEIC and Pandemic Emergencies [Ref: II.C.1(b)(ii) · II.C.1(c)]:
(a) Upon declaration of a PHEIC, Participating Manufacturers shall reserve for WHO at least 20% of real-time production: at least 10% free of charge as a donation and the remaining 10% at not-for-profit prices.
(b) During a pandemic emergency, Participating Manufacturers shall provide 20% of real-time production (10% donated free of charge and 10% at affordable not-for-profit prices).
(c) All WHO-contracted PABS quantities shall be unconditionally exempt from national export restrictions or export bans [II.C.1(b)bis].

6. Mandatory Non-Exclusive Licensing & Technology Transfer [Ref: II.C.1(a)(ii) · II.C.1(b) alt. 1(ii)]:
Participating Manufacturers shall commit to all non-monetary benefit obligations on the menu and grant to WHO, upon signing the WHO PABS Contract, non-exclusive, royalty-free, worldwide licences that can be sublicensed to developing-country manufacturers for local production.

7. Preservation of Sovereign National ABS Laws [Ref: I.A.1bis]:
Nothing in this Annex shall override or pre-empt national access and benefit-sharing legislation. In the event that the PABS System does not deliver equitable benefit-sharing, Parties retain their full sovereign rights to apply national ABS laws.

8. Sharing Timeline, IP Prohibition & Regional Governance [Ref: II.B.1(a) · II.A.5(d) · III.A]:
- Parties shall share materials and sequences as soon as possible after completion of initial national risk assessment and domestic biosecurity clearance.
- Participants shall not claim any intellectual property or other rights that limit facilitated access to or use of PABS Materials and Sequence Information or derivatives thereof.
- WHO Regions shall nominate and the Conference of the Parties (COP) shall appoint the PABS Advisory Group, with mandatory developing-country co-chairs.`
  },
  {
    id: 'eu-hybrid-deck',
    title: 'EU Hybrid Traffic-Light Model & Developed-Country Proposal (July 2026 Deck)',
    source: 'Coded from EU Hybrid Landing Zone Deck (15 July 2026) & EU Oct 2025 Input',
    badge: 'EU / G6 Pole',
    description: 'The Hybrid traffic-light model (green/orange/red provider choice), structured PHEIC floor for in-scope pathogens, voluntary licensing on mutually agreed terms, and full Nagoya Art. 4.4 recognition.',
    text: `PROPOSED COMPROMISE TEXT — HYBRID TRAFFIC-LIGHT MODEL (EU / DEVELOPED PARTNER INPUT)

1. Hybrid Provider-Choice Access Architecture [Ref: II.A.6(c) · II.B.3]:
To avoid transactional bottlenecks during an outbreak while respecting sovereign provider choices, the PABS System shall operate a Hybrid Traffic-Light mechanism:
- Green lane (default for rapid scientific response): open access with user notification of PABS norms;
- Orange lane: users commit upon registration to negotiate a WHO PABS Contract if commercializing a product;
- Red lane (selected by provider Party for specific physical samples): contract or commitment required prior to commercial access.

2. Willing Manufacturer Contracts & Tiered Model Clauses [Ref: II.A.6(c)]:
Standardized commercial PABS contracts shall bind manufacturers commercializing PABS-derived health products, while academic and public-health surveillance laboratories operate under streamlined terms.

3. Monetary Contributions & Non-Monetary Menu [Ref: II.C.1(a)(i)-(ii)]:
(a) Annual monetary contributions shall cover the operational costs of the PABS System, complemented by voluntary or mutually agreed contributions to the Coordinating Financial Mechanism.
(b) Participating Manufacturers shall select at least two capacity-building or non-monetary options from the II.C.1(a)(ii) menu; any licensing and technology transfer shall be undertaken on voluntary, mutually agreed terms ("willingly undertaken").

4. Structured PHEIC Commitment for In-Scope Pathogens & Pandemic Set-Aside [Ref: II.C.1(b)-(c)]:
(a) During a PHEIC caused by a pathogen within PABS scope, Participating Manufacturers shall commit to a contractually agreed minimum supply floor per contract (without fixing a single statutory percentage in the Annex).
(b) During a pandemic emergency, Participating Manufacturers shall target 20% of real-time production (10% donated + 10% affordable).
(c) Export controls shall remain governed by existing WTO rules and national security exceptions.

5. Recognition as a Specialised International ABS Instrument (Nagoya Art. 4.4) [Ref: II.A.7]:
The PABS Annex is recognised as a specialised international access and benefit-sharing instrument within the meaning of Article 4, paragraph 4, of the Nagoya Protocol. Participating Manufacturers and entities complying with WHO PABS Contracts shall not be subject to additional national benefit-sharing measures.

6. Fast 24-Hour Sharing & Narrow IP Clause [Ref: II.B.1(a) · II.A.5(d)]:
- Parties shall share sequence information within 24 to 48 hours of identification of a pathogen with pandemic potential.
- Participants shall not claim intellectual property rights over PABS Materials in the exact form received.
- Parties shall nominate and the COP shall elect the PABS Advisory Group.`
  }
];

/* ==========================================================================
   2. PRE-COMPUTED CITED MAPPINGS FOR SAMPLE TEXTS + DETERMINISTIC MATCHER
   ========================================================================== */

const PRECOMPUTED_ANALYSES = {
  'a79-8-unbracketed': {
    summary: 'Maps the 30 April 2026 on-screen text (A79/8) by taking only unbracketed baseline language. While it avoids tripping EU or G6 red lines, it leaves Group for Equity and Africa Plus at 0/100 due to the absence of point-of-access linkage, revenue contributions, or PHEIC floors.',
    matchedPreset: 'unb',
    issues: {
      link: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.A.6(c)',
        quote: 'Benefit-sharing obligations apply to entities utilizing PABS Materials and Sequence Information for commercial purposes that have entered into legally binding WHO PABS Contracts',
        rationale: 'Unbracketed II.A.6(c) applies obligations only to entities that have entered into WHO PABS Contracts ("opt-in"), with [prior to access] remaining in brackets.'
      },
      access: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'II.B.3(c) · II.B.1(a)(iiialt)',
        quote: 'require users, as a condition of access, to agree to legally binding terms of reference, while keeping access free of charge and immediate.',
        rationale: 'Matches registration/binding terms without gating on existing open databases, paired with a Unique Persistent Identifier (UPI).'
      },
      tier: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.A.6(c)',
        quote: 'entities … that have entered into legally binding WHO PABS Contracts; model contract clauses shall be developed and approved by the Conference of the Parties (COP).',
        rationale: 'Leaves model contract clauses to be agreed later by the COP rather than annexing binding contracts at adoption.'
      },
      money: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.C.1(a)(i)',
        quote: 'annual monetary contributions related to the operational costs associated with the functioning of the PABS system.',
        rationale: 'Unbracketed text in II.C.1(a)(i) covers operational costs only; percentage of net sales [(i)alt], milestones [(i)bis] and royalties [(i)ter] are bracketed.'
      },
      pheic: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.C.1(b)(i)',
        quote: 'agreeing to provide, where available, promptly and on a priority basis to WHO on its request, pandemic-related health products as a donation or at affordable prices.',
        rationale: 'Unbracketed II.C.1(b)(i) sets a best-endeavours supply-on-request standard with no percentage floor.'
      },
      lic: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.C.1(a)(ii)',
        quote: 'commit to at least two of the following non-monetary options from the menu, including voluntary non-exclusive licensing under mutually agreed terms.',
        rationale: 'Defaults to a menu of two non-monetary options with voluntary licensing on mutually agreed terms.'
      },
      abs: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'unbracketed',
        clauseRef: 'II.A.7',
        quote: 'Participating Manufacturers and other entities that comply with WHO PABS Contracts shall not be subject to additional benefit-sharing measures with respect to matters covered by such contracts.',
        rationale: 'Paragraph II.A.7 is unbracketed, whereas the sovereign national ABS fallback in [I.A.1bis] is wholly bracketed.'
      }
    },
    secondary: {
      scope: {
        opt: 'in',
        clauseRef: 'I.B(a)',
        quote: '"Pathogen with pandemic potential" means any pathogen that has the potential for sustained transmission in humans',
        rationale: 'Main definition covers all pathogens with pandemic potential; influenza exclusion sits in a bracketed footnote.'
      },
      share: {
        opt: 'asap',
        clauseRef: 'II.B.1(a)',
        quote: 'share PABS Materials and Sequence Information as soon as possible after initial national risk assessment.',
        rationale: 'Uses "as soon as possible after initial national risk assessment" (~10 days modelled delay).'
      },
      ip: {
        opt: 'narrow',
        clauseRef: 'II.A.5(d)',
        quote: 'not claim any intellectual property rights over PABS Materials and Sequence Information in the form received',
        rationale: 'Unbracketed clause restricts IP claims only over materials "in the form received".'
      },
      pandemic: {
        opt: 'mid',
        clauseRef: 'II.C.1(c)',
        quote: 'a minimum threshold of ten per cent (10%) as a donation and the remaining percentage, with flexibility based on nature and capacity (modelled at 5%), reserved at affordable prices.',
        rationale: '10% donation floor plus flexible affordable remainder (modelled at 5%).'
      },
      export: {
        opt: 'no',
        clauseRef: 'II.C.1(b)bis',
        quote: 'Export prohibition exemption remains bracketed in A79/8.',
        rationale: 'Because [II.C.1(b)bis] is bracketed in A79/8, the unbracketed baseline leaves WHO quantities exposed to national export controls.'
      },
      gov: {
        opt: 'dg',
        clauseRef: 'III.A.1',
        quote: 'The Director-General shall establish and appoint the PABS Advisory Group from nominations submitted by Parties.',
        rationale: 'Director-General appointment from Party nominations.'
      }
    },
    outOfScope: [
      {
        category: 'Coordinating Financial Mechanism (CFM)',
        clauseRef: 'III.B.2 · Art. 20',
        quote: 'Monetary contributions received under Section II.C.1(a)(i) shall be channelled through the Coordinating Financial Mechanism established under Article 20 of the WHO Pandemic Agreement, subject to fiduciary rules adopted by the COP.',
        whyUnmodelled: 'Governance of fund disbursement and fiduciary allocation rules between the COP and the Article 20 CFM are institutional architecture questions not captured in the dose/uptake equations.',
        suggestedNote: 'Clarify whether PABS monetary contributions sit in a ring-fenced PABS sub-account under COP authority.'
      },
      {
        category: 'Bracketed Sovereign ABS Override ([I.A.1bis])',
        clauseRef: '[I.A.1bis]',
        quote: '[I.A.1bis. In the event that the PABS System does not deliver equitable benefit-sharing in accordance with this Annex, Parties retain their full sovereign rights to apply national access and benefit-sharing Laws.]',
        whyUnmodelled: 'While Issue 7 models the choice between II.A.7 and I.A.1bis, the legal trigger for what constitutes "non-delivery" is undefined in the text.',
        suggestedNote: 'Define an objective COP review mechanism before national ABS fallback measures can be invoked.'
      }
    ]
  },

  'igwg9-chair-bridge': {
    summary: 'Maps the IGWG-9 Chair’s Informal Bridging Non-Paper. Every one of the 7 contested issues lands on a bridging compromise that clears the 50/100 acceptance line for all 4 state blocs (EQ 66, AF 64, EU 54, G6 52) with zero red-line vetoes and ~1.6B COVID-type doses to WHO.',
    matchedPreset: 'bridge',
    issues: {
      link: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 1 · II.A.6(c)bis',
        quote: 'no commercial entity may submit a vaccine, therapeutic or diagnostic derived from or utilizing the PABS System for WHO Emergency Use Listing (EUL), WHO Prequalification, or procurement by UN agencies without an executed, legally binding WHO PABS Contract',
        rationale: 'Enforces the WHO PABS Contract at the WHO EUL / prequalification regulatory market chokepoint while keeping scientific database access rapid.'
      },
      access: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 2 · II.B.3(c)',
        quote: 'requiring all users to register verified institutional identities and accept legally binding terms prior to query, while keeping access immediate and free of charge.',
        rationale: 'Registration without gating on existing open infrastructure with Unique Persistent Identifiers (UPI).'
      },
      tier: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 3 · II.A.5alt',
        quote: 'Standardized WHO PABS Contracts for commercial manufacturers shall be annexed to this Instrument upon adoption at WHA80, while academic and non-commercial research entities shall operate under lighter standardized click-wrap cooperation terms.',
        rationale: 'Tiered standard contracts annexed now for commercial users; lighter terms for non-commercial researchers.'
      },
      money: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 4 · II.C.1(a)(i) Bridge',
        quote: 'an annual tiered subscription fee scaled to enterprise size to cover PABS operational and surveillance costs, plus (b) a revenue contribution of 0.05% of net annual sales applied exclusively above a COP-determined commercial sales threshold',
        rationale: 'Combines flat subscription by size with a revenue percentage applied only above a sales threshold, avoiding IFPMA’s first-dollar revenue red line.'
      },
      pheic: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 5(a) · II.C.1(b)',
        quote: 'In a PHEIC caused by a pathogen within PABS scope, each Participating Manufacturer commits to a contractually specified minimum supply floor (averaging 4% donated and 4% at not-for-profit prices) without fixing a single rigid statutory percentage',
        rationale: 'Sets a contractual minimum floor for in-scope pathogens without a fixed statutory percentage in the Annex, lifting G6’s PHEIC percentage veto.'
      },
      lic: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 6 · II.C.1(b) alt. 1',
        quote: 'execute a Standby Non-Exclusive Licensing Protocol with the Medicines Patent Pool (MPP) upon contract signature; sub-licensing to qualified regional manufacturers shall be automatically triggered only where the Participating Manufacturer is unable to meet WHO and affected-country demand',
        rationale: 'Standby licences through the Medicines Patent Pool triggered if WHO need is unmet, plus two menu options.'
      },
      abs: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 7 · I.A.1bis / II.A.7',
        quote: 'Compliance with a WHO PABS Contract satisfies national access and benefit-sharing obligations (Article II.A.7), provided that the sovereign fallback under paragraph I.A.1bis may be activated only following a formal determination by the Conference of the Parties (COP) of systemic non-delivery',
        rationale: 'Nagoya specialisation displacement paired with a performance fallback triggered only after a COP finding of non-delivery.'
      }
    },
    secondary: {
      scope: {
        opt: 'in',
        clauseRef: 'Para. 8',
        quote: 'Pathogens with pandemic potential include pandemic influenza strains alongside novel pathogens.',
        rationale: 'Influenza is included in PABS scope.'
      },
      share: {
        opt: 'xdays',
        clauseRef: 'Para. 8',
        quote: 'Parties shall upload sequence data within 7 days of pathogen identification.',
        rationale: 'Fixed 7-day sharing window.'
      },
      ip: {
        opt: 'narrow',
        clauseRef: 'Para. 8',
        quote: 'Participants shall not claim IP rights over PABS Materials or Sequence Information in the form received.',
        rationale: 'Narrow IP prohibition ("in the form received").'
      },
      pandemic: {
        opt: 'full',
        clauseRef: 'Para. 5(b)',
        quote: 'provide the full twenty per cent (20%) real-time production target: 10% free of charge as a donation and 10% at affordable not-for-profit prices.',
        rationale: 'Full 20% pandemic target (10% donated + 10% affordable).'
      },
      export: {
        opt: 'yes',
        clauseRef: 'Para. 5(c) · II.C.1(b)bis',
        quote: 'Parties shall ensure that pandemic-related health products committed under WHO PABS Contracts are exempt from national export prohibitions or restrictions.',
        rationale: 'Full export-ban shield for WHO-contracted PABS quantities.'
      },
      gov: {
        opt: 'cop',
        clauseRef: 'Para. 8 · III.A',
        quote: 'Parties shall nominate and the Conference of the Parties (COP) shall elect the members of the PABS Advisory Group.',
        rationale: 'Parties nominate, COP elects.'
      }
    },
    outOfScope: [
      {
        category: 'Dispute Settlement & Cure Period (UNCITRAL Arbitration)',
        clauseRef: 'Para. 8 (final bullet)',
        quote: 'Dispute settlement between WHO and a Participating Manufacturer shall be referred to binding UNCITRAL arbitration in Geneva, with a 60-day cure period prior to contract suspension.',
        whyUnmodelled: 'Commercial arbitration venues (UNCITRAL) and cure periods affect manufacturer legal certainty and contract enforcement speed, which are outside the 13 quantitative levers.',
        suggestedNote: 'Attach 60-day cure period and UNCITRAL arbitration clause to Issue 1 / Issue 3 contract notes.'
      }
    ]
  },

  'equity-africa-joint': {
    summary: 'Maps the Group for Equity (Pakistan/EMRO) and Africa Plus (Algeria) Joint Room Proposal. Secures 95/100 for Group for Equity and 98/100 for Africa Plus, but triggers red-line vetoes from G6 (on the 20% PHEIC reserve) and EU/IFPMA (on mandatory royalty-free licences at signature), leaving the package unsignable by EU (8/100) and G6 (13/100).',
    matchedPreset: 'fed',
    issues: {
      link: {
        pos: 'e',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 1 · I.A.1 · II.A.6(c)',
        quote: 'No delinking of access from benefit-sharing obligations shall be permitted under any configuration. Commercial entities shall sign legally binding WHO PABS Contracts prior to access',
        rationale: 'Requires a signed WHO PABS Contract prior to any commercial access (point-of-access linkage).'
      },
      access: {
        pos: 'e',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 2 · II.B.3(c) ALT',
        quote: 'provided exclusively through a federated system of nationally governed or WHO-bound nodes to registered and verified users that have executed a binding Data Access Agreement (DAA). Raw bulk download and anonymous access are prohibited',
        rationale: 'Federated database architecture with no bulk download, verified DAA users, and full downstream traceability.'
      },
      tier: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 3 · II.A.5alt',
        quote: 'All participants of the PABS System (SMTA-1, SMTA-2, and Data Access Agreement users) shall, as a condition of participation, be subject to standardized legally binding contractual instruments adopted as integral annexes',
        rationale: 'All users bound under standardized contracts annexed prior to ratification.'
      },
      money: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 4 · II.C.1(a)(i)alt',
        quote: 'calculated as a percentage of annual net sales revenue of vaccines, therapeutics and diagnostics relevant to pathogens with pandemic potential, set at not less than 0.1% of such annual net sales revenue',
        rationale: 'Mandatory annual contribution of at least 0.1% of net sales from the first sale (trips IFPMA red line).'
      },
      pheic: {
        pos: 'e',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 5(a) · II.C.1(b)(ii)',
        quote: 'Upon declaration of a PHEIC, Participating Manufacturers shall reserve for WHO at least 20% of real-time production: at least 10% free of charge as a donation and the remaining 10% at not-for-profit prices.',
        rationale: '20% PHEIC reserve (10% free + 10% not-for-profit), which triggers the G6 red line against fixed PHEIC set-aside percentages.'
      },
      lic: {
        pos: 'e',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 6 · II.C.1(b) alt. 1(ii)',
        quote: 'commit to all non-monetary benefit obligations on the menu and grant to WHO, upon signing the WHO PABS Contract, non-exclusive, royalty-free, worldwide licences that can be sublicensed',
        rationale: 'Whole non-monetary menu mandatory plus royalty-free worldwide licences to WHO upon contract signature (trips EU and IFPMA red lines).'
      },
      abs: {
        pos: 'c',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 7 · I.A.1bis',
        quote: 'In the event that the PABS System does not deliver equitable benefit-sharing, Parties retain their full sovereign rights to apply national ABS laws.',
        rationale: 'Preserves full national ABS fallback under paragraph I.A.1bis as drafted.'
      }
    },
    secondary: {
      scope: {
        opt: 'in',
        clauseRef: 'Para. 4',
        quote: 'pathogens with pandemic potential',
        rationale: 'Covers all pathogens with pandemic potential including influenza.'
      },
      share: {
        opt: 'asap',
        clauseRef: 'Para. 8',
        quote: 'share materials and sequences as soon as possible after completion of initial national risk assessment and domestic biosecurity clearance.',
        rationale: 'Sharing after initial national risk assessment (~10 days modelled delay).'
      },
      ip: {
        opt: 'broad',
        clauseRef: 'Para. 8 · II.A.5(d)',
        quote: 'not claim any intellectual property or other rights that limit facilitated access to or use of PABS Materials and Sequence Information or derivatives thereof.',
        rationale: 'Broad IP prohibition extending to rights that limit access or use or derivatives.'
      },
      pandemic: {
        opt: 'full',
        clauseRef: 'Para. 5(b)',
        quote: 'During a pandemic emergency, Participating Manufacturers shall provide 20% of real-time production (10% donated free of charge and 10% at affordable not-for-profit prices).',
        rationale: 'Full 20% pandemic target (10% donated + 10% affordable).'
      },
      export: {
        opt: 'yes',
        clauseRef: 'Para. 5(c) · II.C.1(b)bis',
        quote: 'All WHO-contracted PABS quantities shall be unconditionally exempt from national export restrictions or export bans',
        rationale: 'Exempts WHO quantities from national export bans.'
      },
      gov: {
        opt: 'reg',
        clauseRef: 'Para. 8 · III.A',
        quote: 'WHO Regions shall nominate and the Conference of the Parties (COP) shall appoint the PABS Advisory Group',
        rationale: 'Regions nominate, COP appoints.'
      }
    },
    outOfScope: [
      {
        category: 'Domestic Biosecurity Clearance Prerequisite',
        clauseRef: 'Para. 8 (bullet 1)',
        quote: 'after completion of initial national risk assessment and domestic biosecurity clearance.',
        whyUnmodelled: 'While the sharing delay lever models the 10-day "after national risk assessment" option, separate domestic export/biosecurity permit procedures vary by national statute.',
        suggestedNote: 'Specify that domestic biosecurity clearance shall be expedited within a target window so it does not block emergency surveillance.'
      }
    ]
  },

  'eu-hybrid-deck': {
    summary: 'Maps the EU Hybrid Traffic-Light Deck (15 July 2026). Reaches high acceptance for EU (82/100) and G6 (76/100), but triggers Group for Equity and Africa Plus red-line vetoes on Issue 1 (provider-choice traffic light delinks green/orange lanes from mandatory upfront contracts) and Africa Plus red line on Issue 7 (unconditional Nagoya displacement).',
    matchedPreset: 'hyb',
    issues: {
      link: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 1 · II.A.6(c)',
        quote: 'Green lane (default for rapid scientific response): open access with user notification of PABS norms; Orange lane: users commit upon registration to negotiate a WHO PABS Contract if commercializing a product; Red lane: contract or commitment required prior to commercial access.',
        rationale: 'Matches the EU Hybrid traffic-light model where the provider chooses green, orange or red access (trips EQ and AF red line against any configuration that delinks access from binding benefits).'
      },
      access: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 1 · II.B.3',
        quote: 'the PABS System shall operate a Hybrid Traffic-Light mechanism',
        rationale: 'Hybrid architecture allowing both open and gated lanes at the Party’s choice.'
      },
      tier: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 2 · II.A.6(c)',
        quote: 'Standardized commercial PABS contracts shall bind manufacturers commercializing PABS-derived health products, while academic and public-health surveillance laboratories operate under streamlined terms.',
        rationale: 'Tiered standard contracts separating commercial manufacturers from non-commercial surveillance labs.'
      },
      money: {
        pos: 'a',
        confidence: 'medium',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 3(a) · II.C.1(a)(i)',
        quote: 'Annual monetary contributions shall cover the operational costs of the PABS System, complemented by voluntary or mutually agreed contributions to the Coordinating Financial Mechanism.',
        rationale: 'Mandatory payment covers operational costs only; further contributions are voluntary/mutually agreed.'
      },
      pheic: {
        pos: 'b',
        confidence: 'high',
        bracketStatus: 'bracketed-compromise',
        clauseRef: 'Para. 4(a) · II.C.1(b)',
        quote: 'During a PHEIC caused by a pathogen within PABS scope, Participating Manufacturers shall commit to a contractually agreed minimum supply floor per contract (without fixing a single statutory percentage in the Annex).',
        rationale: 'Minimum floor per contract for in-scope pathogens with no fixed statutory percentage.'
      },
      lic: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 3(b) · II.C.1(a)(ii)',
        quote: 'select at least two capacity-building or non-monetary options from the II.C.1(a)(ii) menu; any licensing and technology transfer shall be undertaken on voluntary, mutually agreed terms ("willingly undertaken").',
        rationale: 'Menu of two options with licensing strictly voluntary on mutually agreed terms.'
      },
      abs: {
        pos: 'a',
        confidence: 'high',
        bracketStatus: 'bracketed-polarised',
        clauseRef: 'Para. 5 · II.A.7',
        quote: 'The PABS Annex is recognised as a specialised international access and benefit-sharing instrument within the meaning of Article 4, paragraph 4, of the Nagoya Protocol. Participating Manufacturers and entities complying with WHO PABS Contracts shall not be subject to additional national benefit-sharing measures.',
        rationale: 'Full Nagoya Art. 4.4 specialisation displacing national ABS measures without a 1bis fallback (trips Africa Plus red line).'
      }
    },
    secondary: {
      scope: {
        opt: 'in',
        clauseRef: 'Para. 4(a)',
        quote: 'pathogen within PABS scope',
        rationale: 'In-scope pathogens covered.'
      },
      share: {
        opt: 'h24',
        clauseRef: 'Para. 6 · II.B.1(a)',
        quote: 'Parties shall share sequence information within 24 to 48 hours of identification of a pathogen with pandemic potential.',
        rationale: '24–48 hour rapid sharing requirement.'
      },
      ip: {
        opt: 'narrow',
        clauseRef: 'Para. 6 · II.A.5(d)',
        quote: 'not claim intellectual property rights over PABS Materials in the exact form received.',
        rationale: 'Narrow IP prohibition limited to materials in the exact form received.'
      },
      pandemic: {
        opt: 'full',
        clauseRef: 'Para. 4(b)',
        quote: 'target 20% of real-time production (10% donated + 10% affordable).',
        rationale: 'Full 20% target (10% donated + 10% affordable).'
      },
      export: {
        opt: 'no',
        clauseRef: 'Para. 4(c)',
        quote: 'Export controls shall remain governed by existing WTO rules and national security exceptions.',
        rationale: 'Omits the PABS export-ban exemption, leaving WTO/national export controls intact.'
      },
      gov: {
        opt: 'cop',
        clauseRef: 'Para. 6',
        quote: 'Parties shall nominate and the COP shall elect the PABS Advisory Group.',
        rationale: 'Parties nominate, COP elects.'
      }
    },
    outOfScope: [
      {
        category: 'WTO Rules & National Security Export Carve-Out',
        clauseRef: 'Para. 4(c)',
        quote: 'Export controls shall remain governed by existing WTO rules and national security exceptions.',
        whyUnmodelled: 'Cross-treaty interaction with GATT Article XXI (national security exceptions) is a trade-law question outside the quantitative PABS model.',
        suggestedNote: 'Assess whether WTO TRIPS/GATT cross-references weaken the Article 12.6 delivery guarantee during acute shortages.'
      }
    ]
  }
};

/**
 * Deterministic keyword & clause heuristic analyzer for custom user-pasted text when running
 * without a live Gemini API key.
 */
export function heuristicAnalyzeDraftText(rawText) {
  const text = String(rawText || '').trim();
  const lower = text.toLowerCase();

  // Check if it matches one of the 4 sample texts closely
  for (const sample of SAMPLE_TEXTS) {
    if (text === sample.text.trim() || lower.includes(sample.title.toLowerCase().slice(0, 28))) {
      return structuredClone(PRECOMPUTED_ANALYSES[sample.id]);
    }
  }

  const snippetAround = (regex, fallback) => {
    const m = text.match(regex);
    if (!m || m.index == null) return fallback;
    const start = Math.max(0, m.index - 40);
    const end = Math.min(text.length, m.index + m[0].length + 140);
    return text.slice(start, end).replace(/\s+/g, ' ').trim();
  };

  // Issue 1: link
  let linkPos = 'a';
  if (/prior to access|before.*commercial access|no delinking/i.test(text) && /eul|emergency use listing|prequalification/i.test(text)) linkPos = 'f';
  else if (/prior to access|before.*commercial access|no delinking/i.test(text)) linkPos = 'e';
  else if (/registration and sale|kei/i.test(text)) linkPos = 'd';
  else if (/emergency use listing|\beul\b|prequalification/i.test(text)) linkPos = 'c';
  else if (/traffic[- ]light|green.*orange.*red|provider chooses/i.test(text)) linkPos = 'b';

  // Issue 2: access
  let accessPos = 'c';
  if (/3alt|suspend access for violators|liability for damages/i.test(text)) accessPos = 'f';
  else if (/federated|no download|queries run/i.test(text)) accessPos = 'e';
  else if (/data access agreement|\bdaa\b|registered and verified/i.test(text)) accessPos = 'd';
  else if (/traffic[- ]light|hybrid.*open and gated/i.test(text)) accessPos = 'b';
  else if (/anonymous|inform users/i.test(text)) accessPos = 'a';

  // Issue 3: tier
  let tierPos = 'b';
  if (/5alt|all participants.*standardized|smta1.*smta2/i.test(text)) tierPos = 'c';
  else if (/tiered|lighter terms for non-commercial|annexed.*commercial/i.test(text)) tierPos = 'b';
  else if (/model clauses.*cop|willing manufacturers only/i.test(text)) tierPos = 'a';

  // Issue 4: money
  let moneyPos = 'b';
  if (/royalt(y|ies)/i.test(text)) moneyPos = 'e';
  else if (/milestone payments|phase iii/i.test(text)) moneyPos = 'd';
  else if (/0\.1%|not less than \[?0\.1%\]?/i.test(text)) moneyPos = 'c';
  else if (/subscription|sales threshold|0\.05%/i.test(text)) moneyPos = 'b';
  else if (/operational costs|operating costs/i.test(text)) moneyPos = 'a';

  // Issue 5: pheic
  let pheicPos = 'b';
  if (/10%.*free.*10%.*not-for-profit|reserve.*20%.*10%/i.test(text)) pheicPos = 'e';
  else if (/8%.*free.*12%.*not-for-profit/i.test(text)) pheicPos = 'd';
  else if (/alt\.\s*3|no less than 10 per cent.*donation/i.test(text)) pheicPos = 'c';
  else if (/minimum.*floor|no fixed.*percentage/i.test(text)) pheicPos = 'b';
  else if (/where available.*on its request|supply on request/i.test(text)) pheicPos = 'a';

  // Issue 6: lic
  let licPos = 'c';
  if (/royalty-free.*sublicens|upon signing.*royalty-free/i.test(text)) licPos = 'e';
  else if (/all of the following mandatory obligations|whole menu mandatory/i.test(text)) licPos = 'd';
  else if (/standby|medicines patent pool|\bmpp\b|unable to meet.*needs/i.test(text)) licPos = 'c';
  else if (/at least \[?three\]?/i.test(text)) licPos = 'b';
  else if (/mutually agreed terms|voluntary.*licens/i.test(text)) licPos = 'a';

  // Issue 7: abs
  let absPos = 'b';
  if (/cond|cop.*finding|determination by the conference of the parties.*non-delivery/i.test(text)) absPos = 'b';
  else if (/1bis|retain their full sovereign rights to apply national/i.test(text) && !/determination by the conference/i.test(text)) absPos = 'c';
  else if (/shall not be subject to additional benefit-sharing|nagoya.*4\.4|specialised.*instrument/i.test(text)) absPos = 'a';

  const hasBrackets = /\[.*\]/.test(text);

  return {
    summary: 'Mapped custom negotiating text across all 7 core PABS Annex issues and 6 secondary provisions using clause-level citation matching, and flagged provisions outside the quantitative model scope for delegation review.',
    matchedPreset: 'custom',
    issues: {
      link: {
        pos: linkPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'I.A.1 · II.A.6(c)',
        quote: snippetAround(/contract|access|eul|traffic[- ]light|equal footing/i, 'Commercial access and WHO PABS Contract trigger clause in pasted text.'),
        rationale: `Detected position (${linkPos.toUpperCase()}): ${posOf(ISSUES[0], linkPos).lab}.`
      },
      access: {
        pos: accessPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'II.B.3 · II.B.1(a)(iii)',
        quote: snippetAround(/database|sequence|registered|federated|identifier/i, 'Database access and sequence traceability provision in pasted text.'),
        rationale: `Detected position (${accessPos.toUpperCase()}): ${posOf(ISSUES[1], accessPos).lab}.`
      },
      tier: {
        pos: tierPos,
        confidence: 'medium',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'II.A.5alt · II.A.6',
        quote: snippetAround(/standardized|contract|tiered|non-commercial|cop/i, 'Contractual tiering and annex status provision in pasted text.'),
        rationale: `Detected position (${tierPos.toUpperCase()}): ${posOf(ISSUES[2], tierPos).lab}.`
      },
      money: {
        pos: moneyPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'II.C.1(a)(i)',
        quote: snippetAround(/monetary|operational cost|sales|royalt|milestone|subscription/i, 'Annual monetary contribution clause in pasted text.'),
        rationale: `Detected position (${moneyPos.toUpperCase()}): ${posOf(ISSUES[3], moneyPos).lab}.`
      },
      pheic: {
        pos: pheicPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'II.C.1(b)',
        quote: snippetAround(/pheic|public health emergency|floor|reserve.*20%|on its request/i, 'PHEIC real-time production set-aside clause in pasted text.'),
        rationale: `Detected position (${pheicPos.toUpperCase()}): ${posOf(ISSUES[4], pheicPos).lab}.`
      },
      lic: {
        pos: licPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'II.C.1(a)(ii) · II.C.1(b) alt. 1',
        quote: snippetAround(/licen[cs]|patent pool|technology transfer|menu/i, 'Licensing and non-monetary benefit menu clause in pasted text.'),
        rationale: `Detected position (${licPos.toUpperCase()}): ${posOf(ISSUES[5], licPos).lab}.`
      },
      abs: {
        pos: absPos,
        confidence: 'high',
        bracketStatus: hasBrackets ? 'bracketed-compromise' : 'unbracketed',
        clauseRef: 'I.A.1bis · II.A.7',
        quote: snippetAround(/national.*abs|benefit-sharing measures|nagoya|1bis/i, 'National ABS relationship / Nagoya Art. 4.4 clause in pasted text.'),
        rationale: `Detected position (${absPos.toUpperCase()}): ${posOf(ISSUES[6], absPos).lab}.`
      }
    },
    secondary: {
      scope: {
        opt: /exclude influenza|exclusion of influenza/i.test(text) ? 'out' : 'in',
        clauseRef: 'I.B(a)',
        quote: snippetAround(/influenza|pathogen with pandemic potential/i, 'Scope definition.'),
        rationale: /exclude influenza|exclusion of influenza/i.test(text) ? 'Excludes influenza (PIP applies).' : 'Includes influenza in PABS scope.'
      },
      share: {
        opt: /24 hours|48 hours/i.test(text) ? 'h24' : /7 days|\b\[?x\]? days/i.test(text) ? 'xdays' : 'asap',
        clauseRef: 'II.B.1(a)',
        quote: snippetAround(/24 hours|48 hours|days of identification|as soon as possible/i, 'Sharing timeline clause.'),
        rationale: 'Mapped pathogen sharing timeline.'
      },
      ip: {
        opt: /other rights that limit|derivatives/i.test(text) ? 'broad' : 'narrow',
        clauseRef: 'II.A.5(d)',
        quote: snippetAround(/intellectual property|in the form received/i, 'IP clause.'),
        rationale: 'Mapped IP restriction scope.'
      },
      pandemic: {
        opt: /10%.*free.*10%.*affordable|targeting twenty per cent.*10%.*10%|full twenty per cent/i.test(text)
          ? 'full'
          : /5%|flexibility based on/i.test(text)
            ? 'mid'
            : 'floor',
        clauseRef: 'II.C.1(c)',
        quote: snippetAround(/pandemic emergency|12\.6|twenty per cent|ten per cent/i, 'Pandemic set-aside clause.'),
        rationale: 'Mapped Article 12.6(a) pandemic emergency real-time production tranche.'
      },
      export: {
        opt: /not subject to export|exempt from.*export/i.test(text) ? 'yes' : 'no',
        clauseRef: 'II.C.1(b)bis',
        quote: snippetAround(/export prohibition|export control|export ban/i, 'Export control provision.'),
        rationale: 'Mapped export restriction shield.'
      },
      gov: {
        opt: /regions.*nominate/i.test(text) ? 'reg' : /cop.*elect|parties nominate.*cop/i.test(text) ? 'cop' : 'dg',
        clauseRef: 'III.A',
        quote: snippetAround(/advisory group|director-general|cop.*elect/i, 'Governance appointment clause.'),
        rationale: 'Mapped PABS Advisory Group appointment mechanism.'
      }
    },
    outOfScope: [
      {
        category: 'Institutional, Liability & Enforcement Clauses',
        clauseRef: 'Section III / Dispute & CFM',
        quote: snippetAround(/arbitration|financial mechanism|liability|ratification|entry into force/i, 'Governance, dispute settlement, or Coordinating Financial Mechanism (Article 20) provisions in text.'),
        whyUnmodelled: 'Dispute arbitration rules, CFM disbursement governance, and ratification thresholds are legal-institutional provisions not directly parameterised in the 13 quantitative levers.',
        suggestedNote: 'Record delegation red lines or conditions on this provision in the package free-text notes.'
      }
    ]
  };
}

/* ==========================================================================
   3. GEMINI API CLIENT (LOCAL SERVER PROXY OR IN-BROWSER KEY + FALLBACK)
   ========================================================================== */

let serverKeyAvailable = null;

export async function checkAgentStatus() {
  const browserKey = getBrowserApiKey();
  try {
    const res = await fetch('/api/gemini/status', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      serverKeyAvailable = Boolean(data && data.configured);
      return {
        mode: serverKeyAvailable ? 'server-gemini' : browserKey ? 'browser-gemini' : 'builtin-hybrid',
        model: data.model || GEMINI_MODEL,
        serverAvailable: true,
        serverKeyConfigured: serverKeyAvailable,
        browserKeyConfigured: Boolean(browserKey)
      };
    }
  } catch {
    serverKeyAvailable = false;
  }
  return {
    mode: browserKey ? 'browser-gemini' : 'builtin-hybrid',
    model: GEMINI_MODEL,
    serverAvailable: false,
    serverKeyConfigured: false,
    browserKeyConfigured: Boolean(browserKey)
  };
}

export function getBrowserApiKey() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return (sessionStorage.getItem('pabs_gemini_api_key') || '').trim();
    }
  } catch {
    // ignore storage errors
  }
  return '';
}

export function setBrowserApiKey(key) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (key && key.trim()) {
        sessionStorage.setItem('pabs_gemini_api_key', key.trim());
      } else {
        sessionStorage.removeItem('pabs_gemini_api_key');
      }
    }
  } catch {
    // ignore
  }
}

async function callGeminiJson({ systemInstruction, userPrompt, temperature = 0.15 }) {
  const browserKey = getBrowserApiKey();

  // 1. Try local Node server proxy (/api/gemini/generate) first if available
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        userPrompt,
        temperature,
        apiKey: browserKey || undefined
      })
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.data) {
        return { data: payload.data, source: payload.source || 'gemini-2.5-flash (server)' };
      }
    }
  } catch {
    // Server endpoint not running; fall through to direct browser call if browserKey exists
  }

  // 2. If user supplied a browser API key, call Gemini REST API directly from browser
  if (browserKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(browserKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json'
        }
      })
    });
    if (res.ok) {
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { data: JSON.parse(text), source: `${GEMINI_MODEL} (live API)` };
      }
    }
  }

  return null;
}

/* ==========================================================================
   4. WORKFLOW 1: "TODAY'S TEXT" DRAFT & BRACKET READER AGENT (SLIDE 8)
   ========================================================================== */

export async function analyzeDraftText(rawText, { sampleId = null, preferLive = true } = {}) {
  if (sampleId && PRECOMPUTED_ANALYSES[sampleId] && !preferLive) {
    return {
      ...structuredClone(PRECOMPUTED_ANALYSES[sampleId]),
      engineSource: 'Pre-verified A79/8 Citation Mapping (Instant)'
    };
  }

  const issueSchemaDesc = ISSUES.map(
    iss => `${iss.id} (${iss.title}, ref ${iss.ref}): valid pos keys = ${iss.pos.map(p => `${p.k} ("${p.lab}")`).join(', ')}`
  ).join('\n');

  const secSchemaDesc = SECONDARY.map(
    id => `${id} (${LEVERS[id].title}, ref ${LEVERS[id].ref}): valid opt keys = ${Object.entries(LEVERS[id].opts).map(([k, o]) => `${k} ("${o.lab}")`).join(', ')}`
  ).join('\n');

  const systemInstruction = `You are a neutral legal-technical treaty analyst supporting delegations negotiating the WHO Pandemic Agreement PABS Annex (Document A79/8).
Your job is strictly to read the supplied draft PABS Annex text, extract verbatim quotes and paragraph citations, map each of the 7 core issues and 6 secondary provisions to the closest position code, and list any provisions that fall OUTSIDE the 13 modelled levers in an "outOfScope" array.
NEVER invent numbers or calculate doses. Return valid JSON matching the exact schema requested.`;

  const userPrompt = `Analyze the following draft PABS Annex text and return a JSON object with keys:
- "summary": 2-sentence neutral summary of where this text sits in the PABS negotiation.
- "issues": object with keys link, access, tier, money, pheic, lic, abs. Each value must have:
  { "pos": "<valid key>", "confidence": "high"|"medium"|"ambiguous", "bracketStatus": "unbracketed"|"bracketed-compromise"|"bracketed-polarised", "clauseRef": "<section ref>", "quote": "<exact verbatim quote from text>", "rationale": "<1 sentence why>" }
- "secondary": object with keys scope, share, ip, pandemic, export, gov. Each value must have:
  { "opt": "<valid key>", "clauseRef": "<section ref>", "quote": "<exact quote>", "rationale": "<1 sentence why>" }
- "outOfScope": array of 1 to 3 objects for clauses in the text that are NOT captured by the 13 quantitative levers (e.g., CFM governance, arbitration, biosecurity permits, liability):
  { "category": "<title>", "clauseRef": "<ref>", "quote": "<quote>", "whyUnmodelled": "<explanation>", "suggestedNote": "<note for delegation>" }

Valid Issue Position Keys:
${issueSchemaDesc}

Valid Secondary Provision Keys:
${secSchemaDesc}

DRAFT TEXT TO ANALYZE:
${rawText}`;

  try {
    const live = await callGeminiJson({ systemInstruction, userPrompt, temperature: 0.1 });
    if (live && live.data && live.data.issues) {
      // Validate and sanitize keys against model.mjs
      const fallback = sampleId && PRECOMPUTED_ANALYSES[sampleId]
        ? structuredClone(PRECOMPUTED_ANALYSES[sampleId])
        : heuristicAnalyzeDraftText(rawText);

      ISSUES.forEach(iss => {
        const item = live.data.issues[iss.id];
        if (!item || !iss.pos.some(p => p.k === item.pos)) {
          live.data.issues[iss.id] = fallback.issues[iss.id];
        }
      });
      SECONDARY.forEach(id => {
        const item = live.data.secondary && live.data.secondary[id];
        if (!item || !LEVERS[id].opts[item.opt]) {
          if (!live.data.secondary) live.data.secondary = {};
          live.data.secondary[id] = fallback.secondary[id];
        }
      });
      if (!Array.isArray(live.data.outOfScope) || !live.data.outOfScope.length) {
        live.data.outOfScope = fallback.outOfScope;
      }
      return {
        ...live.data,
        engineSource: live.source
      };
    }
  } catch {
    // Fall back cleanly
  }

  if (sampleId && PRECOMPUTED_ANALYSES[sampleId]) {
    return {
      ...structuredClone(PRECOMPUTED_ANALYSES[sampleId]),
      engineSource: 'Verified A79/8 Citation Engine (Deterministic)'
    };
  }
  return {
    ...heuristicAnalyzeDraftText(rawText),
    engineSource: 'Citation & Clause Matcher (Deterministic)'
  };
}

/* ==========================================================================
   5. WORKFLOW 2: BRIDGING CLAUSE DRAFTER COPILOT (FOR TRADE FINDER MOVES)
   ========================================================================== */

const BRIDGING_CLAUSE_TEMPLATES = {
  link: {
    c: {
      articleHeading: 'Annex Section II.A.6(c)bis — Regulatory Market-Entry Conditionality (EUL / Prequalification Hook)',
      cleanTreatyText: 'Sharing of PABS Materials and Sequence Information through WHO-recognised databases shall remain rapid, open and unencumbered at the point of scientific access; however, no commercial entity may submit a pandemic-related health product derived from or utilizing the PABS System for WHO Emergency Use Listing (EUL), WHO Prequalification, or UN agency procurement without an executed, legally binding WHO PABS Contract in force.',
      bracketedFallback: 'II.A.6(c)bis. Entities utilizing PABS Materials and Sequence Information for commercial purposes shall execute a legally binding WHO PABS Contract [prior to submission for WHO Emergency Use Listing, prequalification, or regulatory marketing authorization].',
      redLineAnalysis: 'Lifts the Group for Equity and Africa Plus red line against optional/delinked benefit-sharing while addressing EU, G6 and IFPMA objections that upfront point-of-access negotiation slows down emergency scientific research.',
      equityPitch: 'Guarantees an enforceable market chokepoint: no manufacturer can sell into WHO-listed or UN/Gavi markets without signing the binding PABS Contract.',
      industryEuPitch: 'Preserves zero-friction scientific access in the lab during the first hours of an outbreak; obligations attach only when a commercial product is actually brought to regulatory review.'
    }
  },
  access: {
    c: {
      articleHeading: 'Annex Section II.B.3(c) — Verified Institutional Registration Without Gating + Persistent Identifiers',
      cleanTreatyText: 'WHO-recognised databases under Section II.B.2ter shall require all users to register verified institutional identities and accept standardized, legally binding PABS Terms of Reference as a condition of account activation, while ensuring that scientific query and sequence access remain immediate and free of charge, with a Unique Persistent Identifier (UPI) attached to every PABS Material and Sequence Information entry.',
      bracketedFallback: 'II.B.3(c). WHO-recognised databases shall provide immediate, free-of-charge access to registered users that have accepted legally binding terms of reference [and attach a unique persistent identifier (UPI) to each sequence].',
      redLineAnalysis: 'Removes the Group for Equity and Africa Plus red line against anonymous/untraceable access (`inform users` only) without imposing the 2-day compliance delay or database liability red lines of `3alt`.',
      equityPitch: 'Eliminates anonymous sequence harvesting: every user is identified and legally bound to PABS terms with UPI traceability.',
      industryEuPitch: 'Maintains existing WHO-recognised database infrastructure with immediate, un-gated query speed for researchers.'
    }
  },
  tier: {
    b: {
      articleHeading: 'Annex Section II.A.6 ALT — Tiered Standardized Contracts Annexed at Adoption',
      cleanTreatyText: 'Standardized legally binding WHO PABS Contracts for Participating Manufacturers shall be adopted as an integral Appendix to this Annex at WHA80, whereas academic, public-health surveillance and non-commercial research entities shall participate under streamlined, non-commercial cooperation terms.',
      bracketedFallback: 'II.A.6 ALT. Commercial manufacturers shall execute the standardized WHO PABS Contract annexed hereto; non-commercial research entities shall be governed by simplified cooperation terms [approved by the COP].',
      redLineAnalysis: 'Bridges the gap between deferring all contract terms to the COP (`tier: a`) and subjecting every academic lab to commercial SMTA-2 obligations (`tier: c`).',
      equityPitch: 'Locks in binding commercial contract terms now at WHA80 rather than postponing them to post-ratification COP negotiations.',
      industryEuPitch: 'Protects university and public-health surveillance labs from heavy commercial contract bureaucracy.'
    }
  },
  money: {
    b: {
      articleHeading: 'Annex Section II.C.1(a)(i) Bridge — Tiered Operational Subscription + Threshold Net-Sales Share',
      cleanTreatyText: 'Participating Manufacturers shall pay (1) an annual tiered subscription contribution scaled to enterprise size to sustain the operational and surveillance costs of the PABS System, and (2) an annual revenue contribution of 0.05% of net sales applied exclusively to revenues exceeding a commercial sales threshold determined by the Conference of the Parties for PABS-derived products.',
      bracketedFallback: 'II.C.1(a)(i). Participating Manufacturers shall pay an annual tiered operational subscription fee, supplemented by [0.05%] of annual net sales revenue on PABS-derived products above a COP-established commercial threshold.',
      redLineAnalysis: 'Lifts IFPMA’s coded red line against unconditional first-dollar net-sales taxes/royalties while delivering predictable annual funding plus upside revenue sharing for Group for Equity.',
      equityPitch: 'Establishes a legally binding revenue-sharing link in the Annex text alongside guaranteed annual operational funding.',
      industryEuPitch: 'Exempts pre-revenue biotech firms, small-market products and routine R&D from first-dollar sales taxes; revenue share applies only above a commercial blockbuster threshold.'
    }
  },
  pheic: {
    b: {
      articleHeading: 'Annex Section II.C.1(b) Bridge — Contractual Minimum Floor for In-Scope PHEIC Pathogens',
      cleanTreatyText: 'Upon the declaration of a Public Health Emergency of International Concern (PHEIC) caused by a pathogen within the scope of the PABS System, each Participating Manufacturer shall make available to WHO a contractually specified minimum floor of real-time production (calibrated by product class and manufacturing capacity, targeting an equal split between free donations and not-for-profit supply) without prescribing a single uniform statutory percentage across all PHEIC declarations.',
      bracketedFallback: 'II.C.1(b). During a PHEIC caused by a pathogen in PABS scope, Participating Manufacturers shall provide to WHO a minimum real-time production floor specified in their respective WHO PABS Contracts [comprising both donated and not-for-profit tranches].',
      redLineAnalysis: 'Lifts the G6 (CH · NO · JP · UK · CA) red line against a rigid statutory PHEIC percentage in the treaty text while guaranteeing a binding contractual floor above pure voluntarism.',
      equityPitch: 'Replaces vague "where available on request" language with a mandatory minimum floor in every signed contract before a pandemic is even declared.',
      industryEuPitch: 'Respects the EU and G6 requirement that PHEIC commitments apply only to pathogens in PABS scope and be calibrated per contract rather than a rigid 20% statutory quota.'
    }
  },
  lic: {
    c: {
      articleHeading: 'Annex Section II.C.1(b) alt. 1(ii) Bridge — Standby Non-Exclusive Licensing via the Medicines Patent Pool',
      cleanTreatyText: 'Participating Manufacturers shall commit to at least two non-monetary benefit options under Section II.C.1(a)(ii) and shall execute, upon signing their WHO PABS Contract, a Standby Non-Exclusive Licensing Agreement with the Medicines Patent Pool (MPP); sub-licensing to qualified developing-country manufacturers shall be triggered where WHO determines that the Participating Manufacturer is unable to meet WHO and affected-country demand in a timely manner.',
      bracketedFallback: 'II.C.1(b) alt. 1(ii). Sub-licensing through the Medicines Patent Pool shall be triggered where the Participating Manufacturer is unable to meet the timely needs of WHO and affected Parties [under transparent terms pre-agreed in the WHO PABS Contract].',
      redLineAnalysis: 'Lifts EU and IFPMA red lines against mandatory royalty-free licences at signature (`lic: e`) while giving developing countries an enforceable standby technology-transfer trigger when supply falls short.',
      equityPitch: 'Creates an automatic regional manufacturing safety net through the Medicines Patent Pool whenever primary manufacturers cannot meet developing-country demand.',
      industryEuPitch: 'Protects primary manufacturers’ IP and commercial markets so long as they meet contracted WHO supply timelines.'
    }
  },
  abs: {
    b: {
      articleHeading: 'Annex Section II.A.7 & I.A.1bis Bridge — Nagoya Specialised Recognition with COP Non-Delivery Fallback',
      cleanTreatyText: 'Participating Manufacturers and entities that comply with their WHO PABS Contracts shall not be subject to additional national benefit-sharing measures with respect to matters covered by such contracts (Section II.A.7), provided that Parties may invoke sovereign national access and benefit-sharing measures under Section I.A.1bis following a formal determination by the Conference of the Parties (COP) of systemic non-delivery of contracted benefits.',
      bracketedFallback: 'II.A.7bis. Paragraph II.A.7 shall apply to compliant Participating Manufacturers; the sovereign fallback in paragraph I.A.1bis may be activated only upon a formal finding of non-delivery by the Conference of the Parties.',
      redLineAnalysis: 'Lifts Africa Plus’s red line against unconditional pre-emption of national ABS laws (`abs: a`) and IFPMA’s red line against unilateral national ABS double-jeopardy (`abs: c`).',
      equityPitch: 'Preserves sovereign national ABS legislation as an ultimate legal backstop if the PABS System fails to deliver.',
      industryEuPitch: 'Gives compliant manufacturers full legal certainty and protection against parallel national ABS claims unless the COP formally finds systemic non-delivery.'
    }
  }
};

export async function draftBridgingClause(tradeMove, pkg, scenarioKey = 'covid', { countryCode = 'PAK' } = {}) {
  const sc = SCEN.find(s => s.k === scenarioKey) || SCEN[2];
  const afterPkg = JSON.parse(JSON.stringify(pkg));
  if (tradeMove.type === 'i') {
    afterPkg.i[tradeMove.id] = tradeMove.toKey;
  } else {
    afterPkg.s = Object.assign({}, SECDEF, afterPkg.s);
    afterPkg.s[tradeMove.id] = tradeMove.toKey;
  }

  const mBefore = model(pkg, sc);
  const mAfter = model(afterPkg, sc);
  const vBefore = verdictOf(evalBlocs(pkg));
  const vAfter = verdictOf(evalBlocs(afterPkg));
  const c2After = covid2(afterPkg, countryCode);

  const preTemplate =
    BRIDGING_CLAUSE_TEMPLATES[tradeMove.id] && BRIDGING_CLAUSE_TEMPLATES[tradeMove.id][tradeMove.toKey];

  const systemInstruction = `You are a senior WHO treaty drafting counsel at IGWG-9 assisting delegations with the PABS Annex (Document A79/8).
Draft authentic, diplomat-ready treaty compromise language for the specified trade move.
STRICT GUARDRAIL: Use the exact deterministic numbers provided in the prompt. Never invent or alter dose numbers, percentages, or bloc scores. Return JSON.`;

  const userPrompt = `Draft a bridging clause for the following deterministic Trade Finder move:
- Issue / Provision: ${tradeMove.title} [Ref: ${tradeMove.ref}]
- Move from: (${tradeMove.fromKey}) ${tradeMove.fromLabel}
- Move to: (${tradeMove.toKey}) ${tradeMove.toLabel}
- Red lines lifted: ${tradeMove.lifted.length ? tradeMove.lifted.join(', ') : 'None'}
- Bloc gains: ${tradeMove.gains.map(g => `${g.n} +${g.dd}`).join(', ') || 'None'}
- Bloc concessions: ${tradeMove.losses.map(l => `${l.n} ${l.dd}`).join(', ') || 'None'}
- Deterministic Global Doses (${sc.n}): ${fmtD(mBefore.doses)} -> ${fmtD(mAfter.doses)} (manufacturer uptake ${Math.round(mAfter.p * 100)}%)
- Deterministic Lowest Party Score: ${vBefore.minP}/100 -> ${vAfter.minP}/100
- Deterministic ${c2After.country.name} COVID-2 Pool Doses: ${fmtD(c2After.extraEnd / 1e6)}

Return JSON with keys:
- "articleHeading": formal PABS Annex section heading
- "cleanTreatyText": clean treaty paragraph ready to paste into the Annex
- "bracketedFallback": fallback version with tactical brackets for room negotiation
- "redLineAnalysis": 1-2 sentences explaining how this move changes bloc acceptance and red lines using the exact deterministic numbers above
- "equityPitch": 1 sentence talking point for Group for Equity / Africa Plus
- "industryEuPitch": 1 sentence talking point for EU / G6 / IFPMA`;

  try {
    const live = await callGeminiJson({ systemInstruction, userPrompt, temperature: 0.2 });
    if (live && live.data && live.data.cleanTreatyText) {
      return {
        ...live.data,
        deterministicImpact: {
          dosesBefore: fmtD(mBefore.doses),
          dosesAfter: fmtD(mAfter.doses),
          minPartyBefore: vBefore.minP,
          minPartyAfter: vAfter.minP,
          uptakeAfter: Math.round(mAfter.p * 100) + '%',
          countryDosesAfter: fmtD(c2After.extraEnd / 1e6)
        },
        engineSource: live.source
      };
    }
  } catch {
    // Fall back to curated template
  }

  const fallback = preTemplate || {
    articleHeading: `Annex Section ${tradeMove.ref} — Compromise Provision on ${tradeMove.title}`,
    cleanTreatyText: `For the purposes of ${tradeMove.title} (${tradeMove.ref}), Parties agree to implement "${tradeMove.toLabel}", ensuring enforceable benefit-sharing commitments while preserving rapid operational participation across all Participating Manufacturers.`,
    bracketedFallback: `${tradeMove.ref}. Parties shall apply [${tradeMove.toLabel}] subject to periodic review by the Conference of the Parties.`,
    redLineAnalysis: `Moving from "${tradeMove.fromLabel}" to "${tradeMove.toLabel}" shifts lowest Party acceptance from ${vBefore.minP}/100 to ${vAfter.minP}/100 and delivers ${fmtD(mAfter.doses)} doses to WHO (${Math.round(mAfter.p * 100)}% manufacturer uptake).`,
    equityPitch: `Secures ${fmtD(mAfter.doses)} global WHO doses (${fmtD(c2After.extraEnd / 1e6)} for ${c2After.country.name} in a COVID-type benchmark) with enforceable obligations.`,
    industryEuPitch: `Keeps manufacturer burden within commercial tolerance (${Math.round(mAfter.p * 100)}% participation) while clearing ${tradeMove.lifted.join(', ') || 'key bloc'} objections.`
  };

  return {
    ...fallback,
    deterministicImpact: {
      dosesBefore: fmtD(mBefore.doses),
      dosesAfter: fmtD(mAfter.doses),
      minPartyBefore: vBefore.minP,
      minPartyAfter: vAfter.minP,
      uptakeAfter: Math.round(mAfter.p * 100) + '%',
      countryDosesAfter: fmtD(c2After.extraEnd / 1e6)
    },
    engineSource: 'Curated A79/8 Legal Drafting Template (Deterministic)'
  };
}

/* ==========================================================================
   6. WORKFLOW 3: MINISTERIAL BRIEF & DEFENSIVE Q&A SYNTHESIZER
   ========================================================================== */

export async function synthesizeMinisterialBrief(countryCode = 'PAK', blocKey = 'EQ', pkg, scenarioKey = 'covid') {
  const c2 = covid2(pkg, countryCode);
  const sc = SCEN.find(s => s.k === scenarioKey) || SCEN[2];
  const m = model(pkg, sc);
  const ev = evalBlocs(pkg);
  const v = verdictOf(ev);
  const myBloc = ev.find(x => x.b.k === blocKey) || ev[0];
  const bridgePkg = {
    i: { link: 'c', access: 'c', tier: 'b', money: 'b', pheic: 'b', lic: 'c', abs: 'b' },
    s: { scope: 'in', share: 'xdays', ip: 'narrow', pandemic: 'full', export: 'yes', gov: 'cop' }
  };
  const c2Bridge = covid2(bridgePkg, countryCode);

  const systemInstruction = `You are a Chief Diplomatic & Health Policy Advisor preparing a Cabinet Ministerial Brief and IGWG Plenary Intervention for ${c2.country.name} (aligned with ${myBloc.b.n}).
STRICT GUARDRAIL: Every single number in your brief MUST match the deterministic figures supplied in the prompt. Never invent or alter any number. Return valid JSON.`;

  const userPrompt = `Synthesize a Ministerial Brief, 90-second IGWG Plenary Statement, and 3 Defensive Q&A responses for ${c2.country.name} (${countryCode}), speaking from the perspective of ${myBloc.b.n} (${myBloc.b.d}).

EXACT DETERMINISTIC MODEL OUTPUTS (DO NOT ALTER ANY NUMBER):
- Country: ${c2.country.name} (Population: ${fmtPop(c2.country.pop)})
- Historical COVID-19 Record: ${c2.country.deaths != null ? c2.country.deaths.toLocaleString() + ' estimated excess deaths (' + c2.country.deaths_pm + ' per million)' : 'Excess mortality tracked in OWID'}; first vaccine recorded on ${c2.country.first || 'N/A'} (Day ${c2.firstDay1 ?? 'N/A'} after 8 Dec 2020 global launch); 6-month coverage (June 2021): ${c2.gap6mActual.toFixed(1)}%; 12-month coverage (Dec 2021): ${c2.gap12mActual.toFixed(1)}%.
- Modeled COVID-2 Outcome under Current Package:
  * Total WHO PABS doses arriving to ${c2.country.name} over 24 months: ${fmtD(c2.extraEnd / 1e6)} (${fmtD(c2.donatedDosesEnd / 1e6)} free donation + ${fmtD(c2.affordableDosesEnd / 1e6)} at not-for-profit price)
  * First PABS delivery day: Day ${c2.firstDay2} (${c2.daysSaved != null ? c2.daysSaved + ' days earlier than COVID-19' : 'within 30 days of authorization'})
  * 6-month coverage (June 2021): rises from ${c2.gap6mActual.toFixed(1)}% to ${c2.gap6mWithPabs.toFixed(1)}% (+${c2.gain6mPoints} percentage points)
  * 12-month coverage (Dec 2021): rises from ${c2.gap12mActual.toFixed(1)}% to ${c2.gap12mWithPabs.toFixed(1)}% (+${c2.gain12mPoints} percentage points)
- Global Package Verdict (${sc.n} scenario):
  * Signable by all 4 state blocs: ${v.signable ? 'YES' : 'NO'} (lowest Party acceptance: ${v.minP}/100)
  * ${myBloc.b.n} acceptance score: ${myBloc.score}/100 ${myBloc.rls.length ? '(Red lines tripped: ' + myBloc.rls.join('; ') + ')' : '(No red lines tripped)'}
  * Blocking Parties: ${v.blocking.map(b => `${b.b.n} (${b.score}/100${b.rls.length ? ', veto: ' + b.rls.join('; ') : ''})`).join(' | ') || 'None'}
  * Global doses to WHO pool: ${fmtD(m.doses)}
  * Manufacturers signing PABS contracts: ${m.inPABS ? Math.round(m.p * 100) + '%' : 'N/A (PIP)'}
  * Money to PABS System: ${fmt$(m.fundB)} over ${sc.yrs} year(s)

Return JSON with keys:
- "headline": 1-line Cabinet bottom-line recommendation
- "executiveSummary": array of 3 concise bullet strings for the Minister
- "plenaryIntervention": 1-paragraph formal WHO IGWG intervention (written in first-person diplomatic voice for ${c2.country.name})
- "defensiveQA": array of 3 objects { "question": "<tough question from press, Parliament, or rival bloc>", "answer": "<grounded response citing the exact deterministic numbers>" }`;

  try {
    const live = await callGeminiJson({ systemInstruction, userPrompt, temperature: 0.15 });
    if (live && live.data && live.data.headline && Array.isArray(live.data.defensiveQA)) {
      return {
        ...live.data,
        engineSource: live.source
      };
    }
  } catch {
    // Fall back to deterministic synthesis
  }

  const verdictLine = v.signable
    ? `This package is signable by all four state blocs (lowest Party score ${v.minP}/100, ${myBloc.b.n} at ${myBloc.score}/100) and delivers ${fmtD(c2.extraEnd / 1e6)} WHO PABS doses to ${c2.country.name}.`
    : `This package is not yet signable (blocked by ${v.blocking.map(x => x.b.n).join(', ')}; lowest Party score ${v.minP}/100), putting ${fmtD(c2.extraEnd / 1e6)} modeled doses for ${c2.country.name} at risk if talks deadlock.`;

  return {
    headline: `${c2.country.name} Cabinet Verdict (${myBloc.b.n}): ${verdictLine}`,
    executiveSummary: [
      `National Supply & Speed (${c2.country.name}, pop. ${fmtPop(c2.country.pop)}): Under this package in a COVID-type pandemic, ${c2.country.name} receives ${fmtD(c2.extraEnd / 1e6)} cumulative doses through the WHO PABS pool (${fmtD(c2.donatedDosesEnd / 1e6)} donated free + ${fmtD(c2.affordableDosesEnd / 1e6)} at not-for-profit prices), lifting 6-month coverage from ${c2.gap6mActual.toFixed(1)}% to ${c2.gap6mWithPabs.toFixed(1)}% (+${c2.gain6mPoints} pts) with first supply at Day ${c2.firstDay2}${c2.daysSaved != null ? ` (${c2.daysSaved} days earlier than COVID-19)` : ''}.`,
      `Multilateral Signability & ${myBloc.b.n} Posture: ${myBloc.b.n} scores ${myBloc.score}/100${myBloc.rls.length ? ` (tripping red lines on: ${myBloc.rls.join('; ')})` : ' with zero red lines tripped'}. Across all four state blocs, lowest Party acceptance is ${v.minP}/100 (${v.signable ? 'all Parties above the 50/100 threshold' : 'blocked by ' + v.blocking.map(x => x.b.n).join(', ')}).`,
      `Commercial Participation Trade-off (${sc.n}): ${m.inPABS ? Math.round(m.p * 100) + '% of manufacturers sign WHO PABS Contracts' : 'Influenza is routed to the PIP Framework'}, generating ${fmtD(m.doses)} global doses to WHO and ${fmt$(m.fundB)} to the PABS System over ${sc.yrs} year(s).`
    ],
    plenaryIntervention: `Chair, speaking for ${c2.country.name} and in alignment with ${myBloc.b.n}, our yardstick for the PABS Annex is concrete delivery when the next pandemic strikes. In COVID-19, ${c2.country.name} waited until ${c2.country.first || 'late in the rollout'} (Day ${c2.firstDay1 ?? '—'}) for its first vaccine dose and stood at just ${c2.gap6mActual.toFixed(1)}% coverage six months into the global rollout${c2.country.deaths != null ? `, while suffering an estimated ${c2.country.deaths.toLocaleString()} excess deaths` : ''}. Under the package before us, our population of ${fmtPop(c2.country.pop)} would receive ${fmtD(c2.extraEnd / 1e6)} doses through the WHO pool—${fmtD(c2.donatedDosesEnd / 1e6)} free of charge and ${fmtD(c2.affordableDosesEnd / 1e6)} at not-for-profit prices—raising 6-month coverage to ${c2.gap6mWithPabs.toFixed(1)}% and bringing first delivery to Day ${c2.firstDay2}. Yet a text that cannot command consensus across all four state blocs delivers zero doses in practice. ${v.signable ? `Because this package clears the threshold for every Party (lowest score ${v.minP}/100) with ${Math.round(m.p * 100)}% manufacturer uptake, it offers a viable landing zone for WHA80.` : `Because this draft currently leaves ${v.blocking.map(x => x.b.n).join(', ')} below the line, we urge coordinators to test bridging moves—such as EUL conditionality, verified registration without gating, and standby MPP licensing—that protect our ${fmtD(c2Bridge.extraEnd / 1e6)} dose floor while bringing all four state blocs to signature.`}`,
    defensiveQA: [
      {
        question: `Why shouldn't ${c2.country.name} insist on the maximal hardline across all seven issues instead of a bridging package?`,
        answer: `Because PABS contracts are opt-in for manufacturers under Article 12.6(a) and Annex requires consensus among all four state blocs. If maximal terms push commercial burden above industry tolerance, manufacturer participation drops and EU/G6 veto the annex—meaning 0 doses arrive. Under the Term Sheet Bridge, ${Math.round(c2Bridge.r.p * 100)}% of manufacturers sign and ${c2.country.name} secures ${fmtD(c2Bridge.extraEnd / 1e6)} doses with all four state blocs above 50/100.`
      },
      {
        question: `How does this package protect ${c2.country.name} against the vaccine hoarding and export bans seen in 2021?`,
        answer: `First, it locks in ${Math.round((m.d + m.a) * 100)}% of signing manufacturers' real-time production for WHO from Day ${c2.firstDay2}. Second, ${leversOf(pkg).export === 'yes' ? 'paragraph II.C.1(b)bis explicitly shields WHO-contracted PABS quantities from national export prohibitions, preserving 100% of the ' + fmtD(c2.extraEnd / 1e6) + ' doses allocated to ' + c2.country.name : 'because paragraph II.C.1(b)bis is currently omitted in this draft, national export controls reduce delivered supply by 20%—our delegation recommends restoring the II.C.1(b)bis export-ban shield'}.`
      },
      {
        question: `What is the fiscal value of the free vs. affordable tranches for ${c2.country.name}'s health budget?`,
        answer: `Out of ${fmtD(c2.extraEnd / 1e6)} total WHO PABS doses arriving to ${c2.country.name} over two years, ${fmtD(c2.donatedDosesEnd / 1e6)} doses arrive 100% free of charge as a donation and ${fmtD(c2.affordableDosesEnd / 1e6)} arrive at not-for-profit prices, alongside ${fmt$(m.fundB)} in multilateral monetary contributions to the PABS System.`
      }
    ],
    engineSource: 'Deterministic Ministerial Synthesis Engine (Grounded in OWID + A79/8 Model)'
  };
}
