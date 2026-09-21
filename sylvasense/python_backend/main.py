# SylvaSense (ORION-PS-03) Standalone Self-Contained Python FastAPI Application
# Dual-Spectral SAR and Optical Feature Fusion Platform for Forest-Carbon MRV
import os
import gzip
import base64
import datetime
from typing import Optional
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI(
    title="SylvaSense Forest-Carbon Monitoring Platform",
    description="ORION-PS-03 - Dual-Spectral SAR and Optical Feature Fusion Backend",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_EMBEDDED_GZIP_B64 = "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"
_CACHED_HTML = None

def get_html_content():
    global _CACHED_HTML
    if _CACHED_HTML is None:
        local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
        if os.path.exists(local_path):
            with open(local_path, "r", encoding="utf-8") as f:
                _CACHED_HTML = f.read()
        else:
            _CACHED_HTML = gzip.decompress(base64.b64decode(_EMBEDDED_GZIP_B64)).decode("utf-8")
    return _CACHED_HTML

@app.get("/", response_class=HTMLResponse)
@app.get("/index.html", response_class=HTMLResponse)
def serve_root():
    return HTMLResponse(content=get_html_content(), status_code=200)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SylvaSense Forest-Carbon Monitoring Platform",
        "problemStatement": "ORION-PS-03",
        "runtime": "Python FastAPI (Vercel Serverless Ready)",
        "version": "2.4.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

class PipelineRequest(BaseModel):
    regionId: Optional[str] = "western-ghats"
    ndvi: Optional[float] = 0.81
    evi: Optional[float] = 0.58
    cloudCover: Optional[float] = 14.2
    vv_dB: Optional[float] = -9.8
    vh_dB: Optional[float] = -14.6
    areaHectares: Optional[int] = 12450

@app.post("/api/pipeline/run")
def run_pipeline(req: PipelineRequest):
    optical_weight = 0.45
    sar_weight = 0.55
    raw_agb = (req.ndvi * 180 * optical_weight) + (abs(req.vh_dB) * 16.5 * sar_weight)
    
    biomass_p50 = round(raw_agb, 1)
    biomass_p10 = round(biomass_p50 * 0.88, 1)
    biomass_p90 = round(biomass_p50 * 1.12, 1)
    
    total_biomass = round(biomass_p50 * req.areaHectares)
    carbon_stock_tco2e = round(total_biomass * 0.47 * 3.667)
    
    return {
        "pipeline": "SylvaSense 9-Layer Remote Sensing Pipeline",
        "regionId": req.regionId,
        "biomassEstimates": {
            "p10LowerBound": biomass_p10,
            "p50Median": biomass_p50,
            "p90UpperBound": biomass_p90,
            "unit": "Mg/ha (tonnes/ha)"
        },
        "carbonStock": {
            "totalBiomassTonnes": total_biomass,
            "carbonStock_tCO2e": carbon_stock_tco2e,
            "carbonFraction": 0.47,
            "co2ConversionRatio": 3.667
        },
        "densityProxy": {
            "canopyCoverPct": 84.5,
            "densityProxyStemsHa": 480
        },
        "status": "APPROVED"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
