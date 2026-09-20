# SylvaSense (ORION-PS-03)
### Satellite-Based Forest-Carbon Monitoring Platform
**Tree Enumeration & Biomass Estimation from Multi-Spectral (Sentinel-2) and SAR (Sentinel-1) Satellite Imagery**

> *"Making forest-carbon claims easier to measure, monitor, and verify."*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Run on Replit](https://replit.com/badge/github/sylvasense/sylvasense)](https://replit.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Node.js%20%7C%20FastAPI-blue.svg)](server.js)

---

## 🌲 Executive Summary

SylvaSense is an open-source, satellite-based forest intelligence and digital MRV (Measurement, Reporting, and Verification) platform. It directly addresses **Problem Statement ORION-PS-03** by integrating:
1. **Copernicus Sentinel-2**: Multispectral optical imagery for vegetation indices (NDVI, EVI, NDRE) and canopy greenness.
2. **Copernicus Sentinel-1**: All-weather C-band Synthetic Aperture Radar (SAR) for volumetric structural backscatter (VV, VH, VH/VV ratio) that penetrates heavy cloud cover.
3. **NASA GEDI**: Waveform LiDAR reference products (L4A footprint-level and L4B 1km gridded AGBD) for regional calibration and uncertainty anchoring.
4. **AI Dual-Branch Feature Fusion**: Cross-modal neural architecture combining optical and radar representations inside the model rather than averaging separate predictions.
5. **Human-in-the-Loop Review**: Mandatory inspection layer where carbon auditors review flagged anomalies, add comments, and sign off with a tamper-evident SHA-256 cryptographic provenance hash.
6. **Audit-Ready Evidence Export**: Printable verification PDF reports and downloadable JSON/GeoJSON packages meeting UNFCCC REDD+ and VVB standards.

---

## 🚀 Instant Deployment Guide

### 1. Deploy to Vercel (Zero-Config)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects `vercel.json` and provisions both static frontend assets and serverless REST API functions at `/api/*`.
5. Click **Deploy**.

Alternatively, with the Vercel CLI:
```bash
npm install -g vercel
vercel
```

### 2. Deploy to Replit
1. Create a new Repl on [Replit](https://replit.com) by importing your GitHub repository.
2. The included `.replit` and `replit.nix` files configure Node.js and the webview port (3000) automatically.
3. Click the green **Run** button.

### 3. Run Locally (Zero npm dependencies required)
SylvaSense's universal server uses native Node.js core modules (`http`, `fs`, `path`, `url`, `crypto`). It can run out of the box with zero external npm installations:
```bash
node server.js
```
Open your browser at `http://localhost:3000`.

### 4. Run via Docker
```bash
docker build -t sylvasense .
docker run -p 3000:3000 sylvasense
```

### 5. Run Python FastAPI Backend (Alternative)
For organizations preferring a Python-native data science environment (Slide 6):
```bash
cd python_backend
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

---

## ⚙️ Seven-Step Operational Workflow

```
[01 Region & Period Selection] ──> [02 Imagery Acquisition] ──> [03 Feature Processing]
                                                                        │
[06 Dashboard Review] <── [05 Temporal Change Detection] <── [04 AI Estimation]
        │
[07 Evidence Export & Human Sign-Off]
```

1. **Step 01: Region & Period Selection** — Select benchmark regions (Western Ghats, Pará Amazon, Lopé Congo Basin, Black Forest, Olympic Peninsula Cascadia) or draw custom AOI polygons. Define baseline (T1) and monitoring (T2) periods.
2. **Step 02: Imagery Acquisition** — Retrieve Sentinel-1 C-band SAR and Sentinel-2 optical scenes along with NASA GEDI validation footprints.
3. **Step 03: Feature Processing & Co-Registration** — Calculate NDVI, EVI, NDRE, radiometric calibration of SAR backscatter, Refined Lee speckle filtering, and spatial alignment to a 10m grid.
4. **Step 04: AI Feature Fusion Estimation** — Dual-branch neural encoder generates median Above-Ground Biomass (P50), explicit confidence intervals [P10 - P90], total carbon stock (tCO2e), and stand-level density proxies.
5. **Step 05: Temporal Change Detection** — Differencing between T1 and T2 flags deforestation fronts, canopy degradation, stable conserved forest, and afforestation/regrowth.
6. **Step 06: Dashboard Review & Inspection** — Side-by-side Optical vs SAR swipe slider, biomass heatmaps, uncertainty distributions, and disturbance alert lists.
7. **Step 07: Evidence Export** — Export audit-ready PDF reports and JSON/GeoJSON data packages with SHA-256 provenance hashes.

---

## 📡 REST API Documentation

### `GET /api/health`
Returns service health and runtime telemetry.
```json
{
  "status": "healthy",
  "service": "SylvaSense Forest-Carbon Monitoring Platform",
  "problemStatement": "ORION-PS-03",
  "version": "2.4.0"
}
```

### `GET /api/aoi/regions`
Returns all 5 benchmark global forest study sites.

### `POST /api/pipeline/run`
Executes the full 9-layer remote sensing pipeline for a region or custom parameters.
**Request Body:**
```json
{
  "regionId": "western-ghats",
  "ndvi": 0.81,
  "evi": 0.58,
  "cloudCover": 14.2,
  "vv_dB": -9.8,
  "vh_dB": -14.6
}
```
**Response:**
```json
{
  "pipeline": "SylvaSense 9-Layer Remote Sensing Pipeline",
  "aiEstimation": {
    "biomassEstimates": {
      "p10LowerBound": 218.4,
      "p50Median": 241.8,
      "p90UpperBound": 268.2,
      "unit": "Mg/ha"
    },
    "carbonStock": {
      "total_tCO2e": 5189947
    },
    "densityProxy": {
      "canopyCoverPct": 84.6,
      "densityProxyStemsHa": 480
    }
  }
}
```

### `POST /api/review/submit`
Records an auditor inspection note, status update, and returns a cryptographic SHA-256 audit hash.

### `GET /api/export/report?regionId=western-ghats`
Generates the comprehensive MRV verification evidence report payload.

---

## ⚖️ Scientific Integrity & Honest Limitations (Slides 3 & 4)

- **Reference Data Quality:** NASA GEDI is sampled waveform LiDAR, serving as calibration benchmarks rather than wall-to-wall ground truth.
- **Dense Forest Saturation:** C-band SAR backscatter experiences sensitivity saturation in dense canopies (>275-300 Mg/ha). SylvaSense explicitly widens uncertainty intervals [P10-P90] under these conditions.
- **Stand-Level Resolution Boundary:** Copernicus 10-meter optical and SAR pixels provide stand-level canopy density proxies. Individual tree enumeration requires sub-meter LiDAR or aerial UAV imagery.
- **Ground Validation Role:** Remote sensing drastically reduces the cost of continuous monitoring but does not eliminate the necessity for field sample plots.
- **Regulatory Positioning:** SylvaSense is an independent evidence and monitoring workflow integrator; it does not issue or certify carbon credits autonomously.

---

## 📚 Key References & Research (Slide 8)

1. **ESA Sentinel-1:** All-Weather Radar Imaging (`https://www.esa.int/`)
2. **ESA Sentinel-2:** Multispectral Imaging (`https://www.esa.int/`)
3. **NASA Earthdata:** GEDI L4A Footprint Level & L4B Gridded Aboveground Biomass Density (`https://earthdata.nasa.gov/`)
4. **UNFCCC:** REDD+ Measurement, Reporting and Verification (MRV) (`https://redd.unfccc.int/`)
5. **FAO:** MRV for Environmental Integrity (`https://www.fao.org/`)
6. **MDPI Forests (2023):** *Synergistic Use of Sentinel-1 and Sentinel-2 for Biomass Estimation* (`https://www.mdpi.com/1999-4907/14/8/1615`)
7. **ESA Business Applications:** Monitoring and Verification of Carbon Credits from Forestry

---

## 📄 License
MIT License. Open source for forest carbon conservation and environmental integrity.
