# SylvaSense (ORION-PS-03) Python FastAPI Backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import datetime
import os

app = FastAPI(
    title="SylvaSense Forest-Carbon Monitoring API",
    description="Dual-Spectral SAR & Optical Feature Fusion Backend (ORION-PS-03)",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint serving the frontend UI directly
@app.get("/")
def get_root():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "index.html"),
        os.path.join(os.path.dirname(__file__), "..", "public", "index.html"),
        os.path.join(os.path.dirname(__file__), "index.html"),
        "index.html",
        "public/index.html"
    ]
    for c in candidates:
        if os.path.exists(c):
            return FileResponse(os.path.abspath(c))
    return HTMLResponse("<h1>SylvaSense Backend Running</h1><p>Visit /api/health</p>")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SylvaSense Python FastAPI Engine",
        "problemStatement": "ORION-PS-03",
        "timestamp": datetime.datetime.utcnow().isoformat()
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
        "regionId": req.regionId,
        "biomassEstimates": {
            "p10": biomass_p10,
            "p50": biomass_p50,
            "p90": biomass_p90,
            "unit": "Mg/ha"
        },
        "carbonStock": {
            "totalBiomassTonnes": total_biomass,
            "carbonStock_tCO2e": carbon_stock_tco2e
        },
        "densityProxy": {
            "canopyCoverPct": 84.5,
            "stemsPerHectareProxy": 480
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
