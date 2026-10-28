/**
 * Smart Waste Segregation Assistant - Real-World Datasets
 * Sourced directly from official verified publications:
 * 1. World Bank "What a Waste 2.0: A Global Snapshot of Solid Waste Management to 2050"
 * 2. United Nations Institute for Training and Research (UNITAR) & ITU "Global E-Waste Monitor 2024"
 * 3. U.S. Environmental Protection Agency (EPA) "Advancing Sustainable Materials Management: Fact Sheet"
 */

const REAL_WORLD_DATA = {
  // Source: World Bank - What a Waste 2.0 Report
  globalWasteComposition: {
    source: 'World Bank What a Waste 2.0 Report',
    metric: 'Global Municipal Solid Waste (MSW) by Material Share (%)',
    totalAnnualGenerationTonnes: '2.01 Billion Metric Tonnes / Year',
    projected2050Tonnes: '3.40 Billion Metric Tonnes / Year',
    labels: [
      'Food & Green Organics',
      'Paper & Cardboard',
      'Plastics',
      'Glass',
      'Metals',
      'Rubber & Leather',
      'Wood',
      'Other & Hazardous'
    ],
    shares: [44.0, 17.0, 12.0, 5.0, 4.0, 2.0, 2.0, 14.0],
    colors: [
      '#4E6E4C', // Deep Moss Green (Organics)
      '#4A6B82', // Ocean Steel Blue (Paper)
      '#5C82A6', // Cyan/Light Blue (Plastics)
      '#729B79', // Sage/Glass
      '#A8896C', // Metallic Bronze
      '#8C7262', // Leather/Rubber
      '#9E8262', // Timber Wood
      '#8C4A3E'  // Terracotta Hazard/Other
    ]
  },

  // Source: UN Global E-Waste Monitor 2024 (UNITAR / ITU / UNEP)
  globalEWasteTrajectory: {
    source: 'UN Global E-Waste Monitor 2024 (UNITAR / ITU)',
    metric: 'Annual E-Waste Generated vs Formally Documented Recycled (Million Metric Tonnes)',
    keyFact: '62 Million Metric Tonnes generated in 2022; only 22.3% formally collected and recycled.',
    economicLoss: '$91 Billion USD worth of critical raw metals discarded without recovery annually.',
    years: ['2010', '2014', '2018', '2022', '2024 (Est)', '2026 (Proj)', '2030 (Proj)'],
    generatedMt: [34.0, 44.4, 51.8, 62.0, 67.2, 73.5, 82.0],
    recycledMt: [8.5, 10.2, 11.9, 13.8, 14.9, 16.2, 18.0],
    unmanagedMt: [25.5, 34.2, 39.9, 48.2, 52.3, 57.3, 64.0]
  },

  // Source: EPA Sustainable Materials Management & Energy Conservation
  recyclingEnergySavings: {
    source: 'EPA Sustainable Materials Management & Dept. of Energy',
    metric: 'Primary Energy Conserved via Closed-Loop Recycling vs Virgin Extraction (%)',
    materials: [
      'Aluminum Cans',
      'PET & HDPE Plastics',
      'Copper Wiring & E-Waste',
      'Steel / Tin Cans',
      'Paper & Cardboard',
      'Glass Bottles'
    ],
    energySavedPercent: [95, 88, 85, 74, 60, 30],
    ghgAvoidedPerTonMTCO2e: [9.11, 1.15, 4.30, 1.80, 3.12, 0.31],
    description: [
      'Saves 14,000 kWh per ton of aluminum; skips energy-intensive bauxite smelting.',
      'Bypasses petroleum refining and monomer catalytic cracking.',
      'Reduces heavy open-pit sulfide mining and toxic smelting runoff.',
      'Saves 74% energy and 90% virgin iron ore excavation in blast furnaces.',
      'Prevents tree felling, saving 7,000 gallons of water and 4,000 kWh per ton.',
      'Lowers glass furnace melting temperatures, cutting gas kiln consumption.'
    ]
  },

  // Source: EPA WARM Model (Waste Reduction Model) & UNEP
  methaneAvoidanceMetrics: {
    source: 'EPA WARM (Waste Reduction Model) & IPCC Guidelines',
    methanePotencyVsCO2: '28x over a 100-year horizon (84x over 20-year horizon)',
    landfillMethaneShare: '3rd largest source of human-related methane in the US (14.3%)',
    stats: [
      {
        value: '44%',
        label: 'Global Waste is Organic',
        sub: 'Food & green scraps produce methane in anaerobic landfill strata'
      },
      {
        value: '95%',
        label: 'Energy Saved on Aluminum',
        sub: 'Recycling 1 can powers a laptop for 3 hours'
      },
      {
        value: '22.3%',
        label: 'Global E-Waste Recycled',
        sub: '77.7% is dumped or landfilled without precious metal recovery'
      },
      {
        value: '17 Trees',
        label: 'Saved per Ton of Paper',
        sub: 'Plus 7,000 gallons of industrial process water diverted'
      }
    ]
  }
};
