/**
 * SylvaSense (ORION-PS-03) Benchmark Dataset
 * Precomputed multi-sensor satellite features & ground reference benchmarks
 * for representative global forest biomes.
 */

const BENCHMARK_REGIONS = {
  "western-ghats": {
    id: "western-ghats",
    name: "Western Ghats (Agumbe Rainforest)",
    country: "India",
    biome: "Tropical Moist Deciduous & Evergreen",
    coordinates: [13.5152, 75.0934],
    defaultZoom: 13,
    bounds: [
      [13.46, 75.02],
      [13.57, 75.16]
    ],
    areaHectares: 12450,
    opticalData: {
      sensor: "Copernicus Sentinel-2B MSI (Level-2A)",
      t1Date: "2024-01-14",
      t2Date: "2025-01-18",
      cloudCoverT1: 8.4,
      cloudCoverT2: 14.2,
      meanNDVI: 0.81,
      meanEVI: 0.58,
      meanNDRE: 0.42,
      cloudGapAreaHa: 1768,
      qualityFlag: "Good (Monsoon Cloud Gaps Filled by SAR)"
    },
    sarData: {
      sensor: "Copernicus Sentinel-1A C-Band SAR (Level-1 GRD)",
      mode: "IW (Interferometric Wide Swath)",
      pass: "Ascending Orbit 42",
      meanVV_dB: -9.8,
      meanVH_dB: -14.6,
      polarizationRatio: 0.33,
      rfdi: 0.62,
      speckleFilter: "Refined Lee 7x7",
      penetrationEfficiency: 99.4
    },
    gediReference: {
      product: "NASA GEDI L4A (Footprints) & L4B (1km Gridded AGBD)",
      footprintCount: 418,
      meanReferenceAGB: 246.5,
      gediUncertainty: 28.4
    },
    aiEstimation: {
      biomassP50: 241.8,
      biomassP10: 218.4,
      biomassP90: 268.2,
      totalBiomassTonnes: 3010410,
      carbonStock_tCO2e: 5189947,
      canopyCoverPct: 84.6,
      densityProxyStemsHa: 480,
      saturationWarning: false,
      qualityScore: 92
    },
    changeDetection: {
      baselineYear: 2024,
      monitoringYear: 2025,
      deforestationHa: 34.2,
      degradationHa: 89.6,
      stableForestHa: 12185.0,
      regrowthHa: 141.2,
      netCarbonChange_tCO2e: -24100,
      alertsCount: 14,
      alerts: [
        { id: "ALT-WG-01", type: "Deforestation", lat: 13.535, lon: 75.075, areaHa: 14.5, severity: "High", confidence: 94, reason: "Sudden optical drop & VH backscatter loss (road clearance)" },
        { id: "ALT-WG-02", type: "Degradation", lat: 13.488, lon: 75.122, areaHa: 22.1, severity: "Medium", confidence: 86, reason: "Gradual canopy thinning detected via SAR VH decrease" },
        { id: "ALT-WG-03", type: "Regrowth", lat: 13.550, lon: 75.140, areaHa: 38.0, severity: "Low", confidence: 89, reason: "Afforestation plot canopy recovery confirmed by dual-sensor" }
      ]
    },
    reviewStatus: "APPROVED",
    reviewNotes: "Dual-sensor fusion successfully resolved heavy monsoon cloud gaps. Radar backscatter consistent with GEDI validation footprints. Approved for baseline MRV report.",
    reviewer: "Dr. Ananya Sharma, Senior Forest Remote Sensing Analyst"
  },

  "amazon-para": {
    id: "amazon-para",
    name: "Pará Basin, Amazon Rainforest",
    country: "Brazil",
    biome: "Dense Tropical Moist Evergreen Forest",
    coordinates: [-3.4653, -51.9824],
    defaultZoom: 12,
    bounds: [
      [-3.53, -52.05],
      [-3.40, -51.91]
    ],
    areaHectares: 24800,
    opticalData: {
      sensor: "Copernicus Sentinel-2A MSI (Level-2A)",
      t1Date: "2023-08-12",
      t2Date: "2024-08-16",
      cloudCoverT1: 18.2,
      cloudCoverT2: 24.6,
      meanNDVI: 0.77,
      meanEVI: 0.52,
      meanNDRE: 0.39,
      cloudGapAreaHa: 6100,
      qualityFlag: "SAR Critical (Heavy tropical cloud cover)"
    },
    sarData: {
      sensor: "Copernicus Sentinel-1B C-Band SAR",
      mode: "IW",
      pass: "Descending Orbit 12",
      meanVV_dB: -8.9,
      meanVH_dB: -13.8,
      polarizationRatio: 0.36,
      rfdi: 0.68,
      speckleFilter: "Refined Lee 7x7",
      penetrationEfficiency: 99.8
    },
    gediReference: {
      product: "NASA GEDI L4A & L4B Gridded AGBD",
      footprintCount: 684,
      meanReferenceAGB: 312.0,
      gediUncertainty: 42.1
    },
    aiEstimation: {
      biomassP50: 298.4,
      biomassP10: 254.1,
      biomassP90: 346.0,
      totalBiomassTonnes: 7400320,
      carbonStock_tCO2e: 12758251,
      canopyCoverPct: 88.2,
      densityProxyStemsHa: 520,
      saturationWarning: true,
      qualityScore: 84
    },
    changeDetection: {
      baselineYear: 2023,
      monitoringYear: 2024,
      deforestationHa: 284.5,
      degradationHa: 412.0,
      stableForestHa: 23980.0,
      regrowthHa: 123.5,
      netCarbonChange_tCO2e: -289400,
      alertsCount: 38,
      alerts: [
        { id: "ALT-PA-01", type: "Deforestation", lat: -3.480, lon: -51.950, areaHa: 98.4, severity: "Critical", confidence: 98, reason: "Clear-cut deforestation along emerging feeder track (SAR + Optical verified)" },
        { id: "ALT-PA-02", type: "Deforestation", lat: -3.425, lon: -52.010, areaHa: 62.1, severity: "High", confidence: 95, reason: "Agricultural pasture expansion into primary canopy" },
        { id: "ALT-PA-03", type: "Degradation", lat: -3.510, lon: -51.990, areaHa: 75.3, severity: "Medium", confidence: 88, reason: "Selective logging canopy perforation flagged by SAR coherence drop" }
      ]
    },
    reviewStatus: "FLAGGED_FOR_INSPECTION",
    reviewNotes: "SAR saturation flagged in southern high-biomass quadrant (>300 Mg/ha). Large active deforestation front verified on eastern boundary. Recommend VVB ground survey for parcel 3.",
    reviewer: "Carlos Silva, Tropical Forest Carbon Auditor"
  },

  "congo-lope": {
    id: "congo-lope",
    name: "Lopé National Park, Congo Basin",
    country: "Gabon",
    biome: "Central African Tropical Lowland Rainforest & Savanna Mosaic",
    coordinates: [-0.2000, 11.6000],
    defaultZoom: 12,
    bounds: [
      [-0.28, 11.52],
      [-0.12, 11.68]
    ],
    areaHectares: 18600,
    opticalData: {
      sensor: "Copernicus Sentinel-2B MSI (Level-2A)",
      t1Date: "2023-11-04",
      t2Date: "2024-11-08",
      cloudCoverT1: 29.1,
      cloudCoverT2: 32.5,
      meanNDVI: 0.83,
      meanEVI: 0.61,
      meanNDRE: 0.44,
      cloudGapAreaHa: 5800,
      qualityFlag: "High Cloud Belt - SAR Synthetic Gap-Fill Applied"
    },
    sarData: {
      sensor: "Copernicus Sentinel-1A C-Band SAR",
      mode: "IW",
      pass: "Ascending Orbit 86",
      meanVV_dB: -9.2,
      meanVH_dB: -14.1,
      polarizationRatio: 0.35,
      rfdi: 0.65,
      speckleFilter: "Refined Lee 7x7",
      penetrationEfficiency: 99.6
    },
    gediReference: {
      product: "NASA GEDI L4A/L4B Benchmark Core Validation Site",
      footprintCount: 890,
      meanReferenceAGB: 334.2,
      gediUncertainty: 36.8
    },
    aiEstimation: {
      biomassP50: 328.7,
      biomassP10: 279.4,
      biomassP90: 381.5,
      totalBiomassTonnes: 6113820,
      carbonStock_tCO2e: 10537367,
      canopyCoverPct: 89.5,
      densityProxyStemsHa: 540,
      saturationWarning: true,
      qualityScore: 88
    },
    changeDetection: {
      baselineYear: 2023,
      monitoringYear: 2024,
      deforestationHa: 12.0,
      degradationHa: 45.2,
      stableForestHa: 18480.0,
      regrowthHa: 62.8,
      netCarbonChange_tCO2e: -11800,
      alertsCount: 8,
      alerts: [
        { id: "ALT-LP-01", type: "Degradation", lat: -0.220, lon: 11.640, areaHa: 18.4, severity: "Medium", confidence: 87, reason: "Natural tree fall gaps & elephant disturbance trail" },
        { id: "ALT-LP-02", type: "Deforestation", lat: -0.150, lon: 11.560, areaHa: 12.0, severity: "High", confidence: 91, reason: "Park boundary encroachment buffer zone clearance" }
      ]
    },
    reviewStatus: "APPROVED",
    reviewNotes: "Directly calibrated against NASA GEDI Lopé core site. Confidence bounds widened appropriately to account for C-band saturation in >320 Mg/ha parcels. Conservation status verified intact.",
    reviewer: "Marie Danielle Ngoma, Gabon National Climate Council"
  },

  "black-forest": {
    id: "black-forest",
    name: "Black Forest (Schwarzwald)",
    country: "Germany",
    biome: "Temperate Mixed Mountain Conifer (Norway Spruce & Silver Fir)",
    coordinates: [48.4500, 8.2500],
    defaultZoom: 12,
    bounds: [
      [48.38, 8.16],
      [48.52, 8.34]
    ],
    areaHectares: 15300,
    opticalData: {
      sensor: "Copernicus Sentinel-2A MSI (Level-2A)",
      t1Date: "2023-06-20",
      t2Date: "2024-06-25",
      cloudCoverT1: 4.1,
      cloudCoverT2: 6.8,
      meanNDVI: 0.79,
      meanEVI: 0.54,
      meanNDRE: 0.40,
      cloudGapAreaHa: 620,
      qualityFlag: "Optimal Optical & SAR Co-registration"
    },
    sarData: {
      sensor: "Copernicus Sentinel-1B C-Band SAR",
      mode: "IW",
      pass: "Ascending Orbit 15",
      meanVV_dB: -10.4,
      meanVH_dB: -16.2,
      polarizationRatio: 0.29,
      rfdi: 0.58,
      speckleFilter: "Refined Lee 7x7",
      penetrationEfficiency: 99.9
    },
    gediReference: {
      product: "NASA GEDI L4A & German National Forest Inventory (BWI)",
      footprintCount: 520,
      meanReferenceAGB: 215.4,
      gediUncertainty: 19.5
    },
    aiEstimation: {
      biomassP50: 212.6,
      biomassP10: 196.2,
      biomassP90: 231.8,
      totalBiomassTonnes: 3252780,
      carbonStock_tCO2e: 5606155,
      canopyCoverPct: 81.3,
      densityProxyStemsHa: 410,
      saturationWarning: false,
      qualityScore: 96
    },
    changeDetection: {
      baselineYear: 2023,
      monitoringYear: 2024,
      deforestationHa: 42.1,
      degradationHa: 68.4,
      stableForestHa: 15120.0,
      regrowthHa: 69.5,
      netCarbonChange_tCO2e: -8400,
      alertsCount: 11,
      alerts: [
        { id: "ALT-BF-01", type: "Degradation", lat: 48.435, lon: 8.210, areaHa: 24.5, severity: "High", confidence: 93, reason: "Bark beetle (Ips typographus) infestation dieback flagged by rapid NDVI decay" },
        { id: "ALT-BF-02", type: "Deforestation", lat: 48.490, lon: 8.300, areaHa: 17.6, severity: "Medium", confidence: 96, reason: "Sanitary clear-felling following storm windthrow" }
      ]
    },
    reviewStatus: "APPROVED",
    reviewNotes: "Exceptional agreement with German National Forest Inventory ground plots (R² = 0.89). Bark beetle stress zones accurately identified in both optical NDRE and SAR texture.",
    reviewer: "Prof. Klaus Becker, European Forestry Institute"
  },

  "cascadia-olympic": {
    id: "cascadia-olympic",
    name: "Olympic Peninsula, Cascadia",
    country: "USA",
    biome: "Temperate Coastal Rainforest (Douglas Fir & Western Hemlock)",
    coordinates: [47.8000, -123.9000],
    defaultZoom: 11,
    bounds: [
      [47.68, -124.08],
      [47.92, -123.72]
    ],
    areaHectares: 31200,
    opticalData: {
      sensor: "Copernicus Sentinel-2B MSI (Level-2A)",
      t1Date: "2023-09-02",
      t2Date: "2024-09-05",
      cloudCoverT1: 22.4,
      cloudCoverT2: 27.8,
      meanNDVI: 0.85,
      meanEVI: 0.63,
      meanNDRE: 0.46,
      cloudGapAreaHa: 8100,
      qualityFlag: "Frequent Maritime Fog & Cloud - SAR Critical"
    },
    sarData: {
      sensor: "Copernicus Sentinel-1A C-Band SAR",
      mode: "IW",
      pass: "Descending Orbit 55",
      meanVV_dB: -8.4,
      meanVH_dB: -13.2,
      polarizationRatio: 0.38,
      rfdi: 0.71,
      speckleFilter: "Refined Lee 7x7",
      penetrationEfficiency: 99.7
    },
    gediReference: {
      product: "NASA GEDI L4A/L4B & USFS FIA (Forest Inventory and Analysis)",
      footprintCount: 760,
      meanReferenceAGB: 345.8,
      gediUncertainty: 39.2
    },
    aiEstimation: {
      biomassP50: 339.4,
      biomassP10: 292.0,
      biomassP90: 394.2,
      totalBiomassTonnes: 10589280,
      carbonStock_tCO2e: 18251024,
      canopyCoverPct: 91.2,
      densityProxyStemsHa: 590,
      saturationWarning: true,
      qualityScore: 89
    },
    changeDetection: {
      baselineYear: 2023,
      monitoringYear: 2024,
      deforestationHa: 78.4,
      degradationHa: 112.6,
      stableForestHa: 30850.0,
      regrowthHa: 159.0,
      netCarbonChange_tCO2e: -36400,
      alertsCount: 19,
      alerts: [
        { id: "ALT-CA-01", type: "Deforestation", lat: 47.830, lon: -123.820, areaHa: 44.2, severity: "High", confidence: 97, reason: "Commercial timber harvest parcel clearcut" },
        { id: "ALT-CA-02", type: "Degradation", lat: 47.740, lon: -123.960, areaHa: 34.2, severity: "Medium", confidence: 85, reason: "High-wind canopy damage on western ridge" },
        { id: "ALT-CA-03", type: "Regrowth", lat: 47.870, lon: -123.780, areaHa: 68.0, severity: "Low", confidence: 91, reason: "Second-growth plantation canopy closure" }
      ]
    },
    reviewStatus: "APPROVED",
    reviewNotes: "High biomass Old Growth zone shows C-band SAR saturation tendency. Model appropriately applies widened uncertainty bands [P10: 292.0 - P90: 394.2 Mg/ha]. Timber parcel harvest boundaries confirmed.",
    reviewer: "Dr. Ethan Wright, Pacific Rim Geospatial Institute"
  }
};

const RESEARCH_REFERENCES = [
  {
    num: 1,
    title: "Sentinel-1: All-Weather Radar Imaging",
    organization: "European Space Agency (ESA)",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1",
    summary: "Synthetic Aperture Radar (SAR) C-band mission providing all-weather, day-and-night structural imaging of forest canopies, penetrating cloud cover and surface haze."
  },
  {
    num: 2,
    title: "The Sentinel Missions & Copernicus Programme",
    organization: "European Space Agency (ESA)",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/The_Sentinel_missions",
    summary: "Overview of Europe's environmental Earth observation constellation providing systematic open-access data for land, climate, and forest monitoring."
  },
  {
    num: 3,
    title: "Sentinel-2 Multispectral Imaging",
    organization: "European Space Agency (ESA)",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2",
    summary: "13-band optical imaging sensor at 10m-60m spatial resolution delivering spectral reflectance bands for vegetation indices (NDVI, EVI, NDRE) and canopy health assessment."
  },
  {
    num: 4,
    title: "GEDI L4A Footprint Level Aboveground Biomass Density",
    organization: "NASA Earthdata",
    url: "https://earthdata.nasa.gov/",
    summary: "Waveform LiDAR product providing high-precision aboveground biomass density estimates (Mg/ha) along sampled 25m orbital footprints globally."
  },
  {
    num: 5,
    title: "GEDI L4B Gridded Aboveground Biomass Density",
    organization: "NASA Earthdata",
    url: "https://earthdata.nasa.gov/",
    summary: "1 km gridded mean biomass density and uncertainty product derived from footprint-level GEDI sampling for regional and global carbon stock estimation."
  },
  {
    num: 6,
    title: "REDD+ MRV and Results-Based Payments",
    organization: "UNFCCC",
    url: "https://redd.unfccc.int/",
    summary: "International framework for Measurement, Reporting, and Verification (MRV) of forest carbon stock changes and reduced emissions from deforestation."
  },
  {
    num: 7,
    title: "National Forest Monitoring Systems (NFMS)",
    organization: "UNFCCC",
    url: "https://redd.unfccc.int/",
    summary: "Guidance on transparent, continuous, and auditable satellite monitoring systems combining remote sensing with national forest inventories."
  },
  {
    num: 8,
    title: "Measurement, Reporting and Verification for Environmental Integrity",
    organization: "Food and Agriculture Organization (FAO)",
    url: "https://www.fao.org/",
    summary: "Principles for high-integrity forest carbon MRV: consistency, transparency, accuracy, uncertainty quantification, and independent audibility."
  },
  {
    num: 9,
    title: "Synergistic Use of Sentinel-1 and Sentinel-2 for Biomass Estimation",
    organization: "MDPI Forests (2023)",
    url: "https://www.mdpi.com/1999-4907/14/8/1615",
    summary: "Peer-reviewed methodology demonstrating how feature-level fusion of SAR backscatter (VV/VH) and optical vegetation indices overcomes individual sensor limitations."
  },
  {
    num: 10,
    title: "Monitoring and Verification of Carbon Credits from Forestry",
    organization: "ESA Business Applications",
    url: "https://business.esa.int/",
    summary: "Technical report on satellite Earth observation workflows for independent Validation and Verification Bodies (VVBs) assessing carbon offset projects."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BENCHMARK_REGIONS, RESEARCH_REFERENCES };
}
