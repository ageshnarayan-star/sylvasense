/**
 * SylvaSense (ORION-PS-03) Main Frontend Application Controller
 * Coordinates GIS Map, AI Engine, Change Detection, Human-in-the-Loop Review,
 * and Verification Report Generation.
 */

class SylvaSenseApp {
  constructor() {
    this.currentRegionId = "western-ghats";
    this.currentRegion = null;
    this.aiEngine = new SylvaSenseAIEngine();
    this.changeDetector = new SylvaSenseChangeDetector();
    this.reviewManager = new SylvaSenseReviewManager();
    this.reportExporter = new SylvaSenseReportExporter();
    this.mapEngine = null;
    this.aiResult = null;
    this.changeResult = null;
    this.activeReview = null;
    this.splitSliderPos = 50;
  }

  async init() {
    console.log("Initializing SylvaSense Forest-Carbon Monitoring Platform (ORION-PS-03)...");
    this.currentRegion = BENCHMARK_REGIONS[this.currentRegionId];
    this.mapEngine = new SylvaSenseMap("map");
    this.mapEngine.init(this.currentRegion);
    this.bindEvents();
    await this.runPipeline();
    this.renderReferences();
    this.renderWorkflowSteps();
    this.updateBusinessCalculator();
  }

  async runPipeline() {
    const statusBanner = document.getElementById("pipeline-status-banner");
    if (statusBanner) {
      statusBanner.classList.remove("hidden");
      statusBanner.innerText = "Executing 9-layer feature fusion pipeline (Sentinel-1 SAR + Sentinel-2 Optical)...";
    }

    const opticalInput = {
      ndvi: this.currentRegion.opticalData.meanNDVI,
      evi: this.currentRegion.opticalData.meanEVI,
      ndre: this.currentRegion.opticalData.meanNDRE,
      cloudCover: this.currentRegion.opticalData.cloudCoverT2
    };

    const sarInput = {
      vv_dB: this.currentRegion.sarData.meanVV_dB,
      vh_dB: this.currentRegion.sarData.meanVH_dB,
      polarizationRatio: this.currentRegion.sarData.polarizationRatio,
      rfdi: this.currentRegion.sarData.rfdi
    };

    this.aiResult = this.aiEngine.predict(
      opticalInput,
      sarInput,
      this.currentRegion.gediReference,
      this.currentRegion.areaHectares
    );

    this.changeResult = this.changeDetector.detect(
      this.currentRegion,
      this.currentRegion.opticalData.t1Date,
      this.currentRegion.opticalData.t2Date
    );

    if (!this.activeReview || this.activeReview.regionId !== this.currentRegion.id) {
      this.activeReview = {
        regionId: this.currentRegion.id,
        status: this.currentRegion.reviewStatus,
        reviewerName: this.currentRegion.reviewer,
        comments: this.currentRegion.reviewNotes,
        timestamp: new Date().toISOString(),
        auditHash: await this.reviewManager.computeAuditHash({
          region: this.currentRegion.id,
          ai: this.aiResult,
          change: this.changeResult
        })
      };
    }

    this.updateDashboardMetrics();
    if (this.mapEngine) {
      this.mapEngine.loadRegion(this.currentRegion);
    }
    this.updateReportPreview();

    if (statusBanner) {
      statusBanner.innerText = `Pipeline Complete: ${this.currentRegion.name} [Status: ${this.activeReview.status}]`;
      setTimeout(() => statusBanner.classList.add("hidden"), 3000);
    }
  }

  updateDashboardMetrics() {
    const reg = this.currentRegion;
    const ai = this.aiResult;
    const chg = this.changeResult;

    const badgeName = document.getElementById("active-region-name");
    if (badgeName) badgeName.innerText = reg.name;
    const badgeBiome = document.getElementById("active-region-biome");
    if (badgeBiome) badgeBiome.innerText = `${reg.country} · ${reg.biome}`;

    const kpiBio = document.getElementById("kpi-biomass");
    if (kpiBio) kpiBio.innerText = `${ai.biomassEstimates.p50Median} Mg/ha`;
    const kpiBioBounds = document.getElementById("kpi-biomass-bounds");
    if (kpiBioBounds) kpiBioBounds.innerText = `[P10: ${ai.biomassEstimates.p10LowerBound} - P90: ${ai.biomassEstimates.p90UpperBound}] (±${ai.biomassEstimates.uncertaintyMarginPct}%)`;

    const kpiCarbon = document.getElementById("kpi-carbon");
    if (kpiCarbon) kpiCarbon.innerText = `${(ai.carbonStock.total_tCO2e / 1000000).toFixed(2)}M tCO₂e`;
    const kpiCarbonTonnes = document.getElementById("kpi-biomass-tonnes");
    if (kpiCarbonTonnes) kpiCarbonTonnes.innerText = `${(ai.carbonStock.totalBiomassTonnes / 1000).toLocaleString()} kt dry biomass (${reg.areaHectares.toLocaleString()} ha)`;

    const kpiDensity = document.getElementById("kpi-density");
    if (kpiDensity) kpiDensity.innerText = `${ai.densityProxy.canopyCoverPct}%`;
    const kpiStems = document.getElementById("kpi-stems");
    if (kpiStems) kpiStems.innerText = `~${ai.densityProxy.densityProxyStemsHa} stems/ha stand proxy`;

    const kpiLoss = document.getElementById("kpi-forest-loss");
    if (kpiLoss) kpiLoss.innerText = `${chg.summary.deforestedHectares} ha`;
    const kpiLossDesc = document.getElementById("kpi-forest-loss-desc");
    if (kpiLossDesc) kpiLossDesc.innerText = `${chg.summary.degradedHectares} ha degraded · ${chg.summary.totalAlertsCount} alerts flagged`;

    const kpiCloud = document.getElementById("kpi-cloud-gap");
    if (kpiCloud) kpiCloud.innerText = `${reg.sarData.penetrationEfficiency}%`;
    const kpiCloudArea = document.getElementById("kpi-cloud-area");
    if (kpiCloudArea) kpiCloudArea.innerText = `${reg.opticalData.cloudGapAreaHa.toLocaleString()} ha optical gap filled by SAR`;

    const kpiQuality = document.getElementById("kpi-quality-score");
    if (kpiQuality) kpiQuality.innerText = `${ai.featureWeights.effectiveQualityScore}/100`;

    const statusBadge = document.getElementById("kpi-review-badge");
    if (statusBadge) {
      statusBadge.innerText = this.activeReview.status.replace(/_/g, " ");
      statusBadge.className = `px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
        this.activeReview.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
        this.activeReview.status === 'FLAGGED_FOR_INSPECTION' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
        'bg-sky-950 text-sky-300 border border-sky-500/30'
      }`;
    }

    const satBanner = document.getElementById("sar-saturation-banner");
    if (satBanner) {
      if (ai.limitations.saturationWarning) satBanner.classList.remove("hidden");
      else satBanner.classList.add("hidden");
    }

    this.renderAlertsTable();
    this.updateReviewForm();
  }

  renderAlertsTable() {
    const listContainer = document.getElementById("alerts-table-body");
    if (!listContainer) return;
    const alerts = this.changeResult?.alertsList || [];
    if (alerts.length === 0) {
      listContainer.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">No disturbance alerts detected.</td></tr>`;
      return;
    }
    listContainer.innerHTML = alerts.map(alt => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 text-xs">
        <td class="py-2.5 px-3 font-mono font-bold text-slate-300">${alt.id}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
            alt.type === 'Deforestation' ? 'bg-red-950 text-red-400 border border-red-800/40' :
            alt.type === 'Degradation' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
            'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
          }">${alt.type}</span>
        </td>
        <td class="py-2.5 px-3 font-medium text-slate-300">${alt.areaHa} ha</td>
        <td class="py-2.5 px-3 text-slate-400">${alt.reason}</td>
        <td class="py-2.5 px-3 font-bold text-right text-emerald-400">${alt.confidence}%</td>
      </tr>
    `).join("");
  }

  updateReviewForm() {
    const nameInput = document.getElementById("reviewer-name-input");
    const notesInput = document.getElementById("reviewer-notes-input");
    const statusSelect = document.getElementById("reviewer-status-select");
    const hashDisplay = document.getElementById("audit-hash-display");

    if (nameInput) nameInput.value = this.activeReview.reviewerName || "";
    if (notesInput) notesInput.value = this.activeReview.comments || "";
    if (statusSelect) statusSelect.value = this.activeReview.status || "APPROVED";
    if (hashDisplay) hashDisplay.innerText = this.activeReview.auditHash || "";
  }

  updateReportPreview() {
    const reportContainer = document.getElementById("evidence-report-view");
    if (!reportContainer) return;
    const payload = this.reportExporter.generateReportPayload(
      this.currentRegion,
      this.aiResult,
      this.changeResult,
      this.activeReview
    );
    reportContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-700/80 rounded-xl p-6 md:p-8 shadow-2xl font-sans text-slate-200 max-w-4xl mx-auto printable-report">
        <div class="flex flex-wrap items-center justify-between border-b border-slate-700 pb-5 mb-6 gap-4">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <span class="text-2xl">🌲</span>
              <h2 class="text-2xl font-black text-white">SylvaSense</h2>
              <span class="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded border border-emerald-500/40 font-mono">ORION-PS-03</span>
            </div>
            <p class="text-xs text-slate-400">Forest-Carbon MRV Verification Evidence Report (UNFCCC REDD+ / VVB Standards)</p>
          </div>
          <div class="text-right">
            <div class="text-xs font-mono text-slate-400">REPORT ID: <span class="text-emerald-400 font-bold">${payload.documentMetadata.reportId}</span></div>
            <div class="text-xs text-slate-400 mt-1">Generated: ${new Date(payload.documentMetadata.generatedAt).toLocaleString()}</div>
            <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              <span class="w-2 h-2 rounded-full ${payload.humanReviewSignOff.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}"></span>
              Audit Hash: ${payload.documentMetadata.cryptographicHash.slice(0, 16)}...
            </div>
          </div>
        </div>
        <div class="mb-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 border-l-2 border-emerald-500 pl-2">1. Area of Interest (AOI)</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded border border-slate-800 text-xs">
            <div><span class="text-slate-500 block">Project Name:</span><b class="text-slate-200">${payload.projectArea.name}</b></div>
            <div><span class="text-slate-500 block">Biome:</span><b class="text-slate-200">${payload.projectArea.biome}</b></div>
            <div><span class="text-slate-500 block">Monitored Area:</span><b class="text-emerald-400 font-bold">${payload.projectArea.totalAreaHectares.toLocaleString()} ha</b></div>
            <div><span class="text-slate-500 block">Centroid:</span><b class="font-mono text-slate-300">${payload.projectArea.coordinates[0].toFixed(4)}, ${payload.projectArea.coordinates[1].toFixed(4)}</b></div>
          </div>
        </div>
        <div class="mb-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 border-l-2 border-emerald-500 pl-2">2. AI Biomass & Uncertainty Quantification</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded border border-emerald-500/30 text-xs">
            <div><span class="text-slate-400 block mb-1">Median Biomass (P50):</span><span class="text-xl font-black text-emerald-400">${payload.aiBiomassAndDensity.biomassDensity.p50MedianEstimateMgHa}</span><span class="text-slate-400 text-[10px] block">Mg / ha</span></div>
            <div><span class="text-slate-400 block mb-1">Uncertainty Bounds:</span><span class="text-xs font-mono font-bold text-slate-200">[P10: ${payload.aiBiomassAndDensity.biomassDensity.p10LowerConfidenceMgHa} - P90: ${payload.aiBiomassAndDensity.biomassDensity.p90UpperConfidenceMgHa}]</span><span class="text-slate-400 text-[10px] block">±${payload.aiBiomassAndDensity.biomassDensity.uncertaintyMarginPct}% spread</span></div>
            <div><span class="text-slate-400 block mb-1">Total Carbon Stock:</span><span class="text-xl font-black text-white">${(payload.aiBiomassAndDensity.carbonStock.totalCarbonStock_tCO2e / 1000000).toFixed(2)}M</span><span class="text-slate-400 text-[10px] block">tCO₂e</span></div>
            <div><span class="text-slate-400 block mb-1">Canopy Cover:</span><span class="text-xl font-black text-sky-400">${payload.aiBiomassAndDensity.forestStructure.standCanopyCoverPct}%</span><span class="text-slate-400 text-[10px] block">~${payload.aiBiomassAndDensity.forestStructure.estimatedStemDensityProxyStemsHa} stems/ha</span></div>
          </div>
        </div>
        <div class="mb-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 border-l-2 border-emerald-500 pl-2">3. Bi-Temporal MRV Disturbance Accounting</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded border border-slate-800 text-xs">
            <div><span class="text-slate-500 block">Deforestation:</span><b class="text-red-400">${payload.temporalChangeAnalysis.deforestationHa} ha</b></div>
            <div><span class="text-slate-500 block">Degradation:</span><b class="text-amber-400">${payload.temporalChangeAnalysis.degradationHa} ha</b></div>
            <div><span class="text-slate-500 block">Stable Canopy:</span><b class="text-emerald-400">${payload.temporalChangeAnalysis.stableForestHa.toLocaleString()} ha</b></div>
            <div><span class="text-slate-500 block">Net Impact:</span><b class="text-slate-200">${payload.temporalChangeAnalysis.netCarbonEmissions_tCO2e.toLocaleString()} tCO₂e</b></div>
          </div>
        </div>
        <div class="border-t border-slate-700 pt-5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 border-l-2 border-emerald-500 pl-2">4. Human-in-the-Loop Auditor Sign-Off</h3>
          <div class="bg-slate-950/80 p-4 rounded border border-slate-800 text-xs">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div><span class="font-bold text-slate-200">${payload.humanReviewSignOff.reviewerName}</span> <span class="text-slate-400">(${payload.humanReviewSignOff.organization})</span></div>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase ${payload.humanReviewSignOff.status === "APPROVED" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-amber-950 text-amber-300 border border-amber-500/40"}">${payload.humanReviewSignOff.status}</span>
            </div>
            <p class="text-slate-300 italic mb-2">"${payload.humanReviewSignOff.auditorComments}"</p>
            <div class="font-mono text-[10px] text-slate-500 break-all bg-slate-900 p-2 rounded">SHA-256: ${payload.humanReviewSignOff.cryptographicProof}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderWorkflowSteps() {
    const stepsContainer = document.getElementById("workflow-steps-container");
    if (!stepsContainer) return;
    const steps = [
      { num: "01", title: "Region & Period Selection", desc: "User defines AOI via interactive map or selects benchmark sites. Configures baseline (T1) and monitoring (T2) periods.", tech: "Leaflet GIS · GeoJSON" },
      { num: "02", title: "Imagery Acquisition", desc: "Platform queries and retrieves Copernicus Sentinel-1 C-band SAR and Sentinel-2 optical imagery with NASA GEDI validation data.", tech: "Copernicus API · GEDI L4A/L4B" },
      { num: "03", title: "Feature Processing & Co-Registration", desc: "Optical reflectance bands preprocessed (NDVI, EVI, NDRE). SAR calibrated to sigma-0, Lee speckle filtered, polarization ratios aligned to 10m grid.", tech: "Rasterio · Lee Speckle Filter" },
      { num: "04", title: "AI Feature Fusion Estimation", desc: "Dual-branch neural encoder merges optical canopy reflectance and SAR volumetric backscatter into a unified latent feature space to estimate biomass and stand density.", tech: "Dual-Branch CNN / Attention" },
      { num: "05", title: "Temporal Change Detection", desc: "Pixel-wise and parcel-level differencing across dates. Detects deforestation, forest degradation, stable forest, and regrowth.", tech: "Bi-Temporal Differencing" },
      { num: "06", title: "Dashboard Review & Split-Screen Inspection", desc: "Interactive visualization with side-by-side Optical vs SAR swipe split, biomass density heatmaps, quantile confidence bands, and alert exploration.", tech: "Split-Screen Leaflet · Heatmaps" },
      { num: "07", title: "Evidence Export & Audit Sign-Off", desc: "Generates audit-grade MRV verification report in printable PDF and JSON/GeoJSON packages, complete with SHA-256 cryptographic provenance hash.", tech: "Verification-Oriented PDF · JSON" }
    ];
    stepsContainer.innerHTML = steps.map(s => `
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div class="flex items-center gap-2 mb-2">
          <span class="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs border border-emerald-500/30">${s.num}</span>
          <h4 class="text-sm font-bold text-slate-100">${s.title}</h4>
        </div>
        <p class="text-xs text-slate-400 mb-3 leading-relaxed">${s.desc}</p>
        <div class="text-[10px] font-mono text-emerald-400/80 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/60 inline-block">${s.tech}</div>
      </div>
    `).join("");
  }

  renderReferences() {
    const refContainer = document.getElementById("references-table-body");
    if (!refContainer) return;
    refContainer.innerHTML = RESEARCH_REFERENCES.map(ref => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 text-xs">
        <td class="py-2.5 px-3 font-mono font-bold text-emerald-400">${ref.num}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200"><a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 transition">${ref.title} ↗</a></td>
        <td class="py-2.5 px-3 text-slate-400">${ref.organization}</td>
        <td class="py-2.5 px-3 text-slate-400 leading-relaxed">${ref.summary}</td>
      </tr>
    `).join("");
  }

  updateBusinessCalculator() {
    const hectaresSlider = document.getElementById("calc-hectares");
    const reportSlider = document.getElementById("calc-reports");
    const subRevenueEl = document.getElementById("calc-sub-rev");
    const reportRevenueEl = document.getElementById("calc-report-rev");
    const totalRevenueEl = document.getElementById("calc-total-rev");
    if (!hectaresSlider) return;
    const hectares = parseInt(hectaresSlider.value, 10);
    const reports = parseInt(reportSlider?.value || 2, 10);
    const subRev = Math.round(hectares * 0.25);
    const reportRev = reports * 1800;
    const totalRev = subRev + reportRev;
    const hectaresDisplay = document.getElementById("calc-hectares-display");
    const reportsDisplay = document.getElementById("calc-reports-display");
    if (hectaresDisplay) hectaresDisplay.innerText = `${hectares.toLocaleString()} ha`;
    if (reportsDisplay) reportsDisplay.innerText = `${reports} reports/yr`;
    if (subRevenueEl) subRevenueEl.innerText = `$${subRev.toLocaleString()}/yr`;
    if (reportRevenueEl) reportRevenueEl.innerText = `$${reportRev.toLocaleString()}/yr`;
    if (totalRevenueEl) totalRevenueEl.innerText = `$${totalRev.toLocaleString()}/yr`;
  }

  bindEvents() {
    const regionSelect = document.getElementById("region-selector");
    if (regionSelect) {
      regionSelect.addEventListener("change", async (e) => {
        this.currentRegionId = e.target.value;
        this.currentRegion = BENCHMARK_REGIONS[this.currentRegionId];
        await this.runPipeline();
      });
    }

    const tabButtons = document.querySelectorAll(".nav-tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    });

    const layerButtons = document.querySelectorAll(".map-layer-btn");
    layerButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        layerButtons.forEach(b => b.classList.remove("active-layer", "bg-emerald-600", "text-white"));
        btn.classList.add("active-layer", "bg-emerald-600", "text-white");
        const layer = btn.getAttribute("data-layer");
        this.mapEngine.setLayer(layer);
      });
    });

    const alertToggle = document.getElementById("toggle-alerts-checkbox");
    if (alertToggle) {
      alertToggle.addEventListener("change", (e) => {
        this.mapEngine.toggleAlerts(e.target.checked);
      });
    }

    const splitSlider = document.getElementById("split-swipe-slider");
    if (splitSlider) {
      splitSlider.addEventListener("input", (e) => {
        const val = e.target.value;
        this.splitSliderPos = val;
        const divider = document.getElementById("split-divider-line");
        const sarPanel = document.getElementById("split-sar-overlay");
        if (divider) divider.style.left = `${val}%`;
        if (sarPanel) sarPanel.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
      });
    }

    const reviewForm = document.getElementById("human-review-form");
    if (reviewForm) {
      reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const reviewerName = document.getElementById("reviewer-name-input").value;
        const notes = document.getElementById("reviewer-notes-input").value;
        const status = document.getElementById("reviewer-status-select").value;
        this.activeReview = await this.reviewManager.submitReview({
          regionId: this.currentRegion.id,
          reviewerName,
          comments: notes,
          status
        });
        this.updateDashboardMetrics();
        this.updateReportPreview();
        const toast = document.getElementById("review-toast");
        if (toast) { toast.classList.remove("hidden"); setTimeout(() => toast.classList.add("hidden"), 3000); }
      });
    }

    const btnDownloadJson = document.getElementById("btn-download-json");
    if (btnDownloadJson) {
      btnDownloadJson.addEventListener("click", () => {
        const payload = this.reportExporter.generateReportPayload(this.currentRegion, this.aiResult, this.changeResult, this.activeReview);
        this.reportExporter.downloadJSON(payload);
      });
    }

    const btnDownloadGeoJson = document.getElementById("btn-download-geojson");
    if (btnDownloadGeoJson) {
      btnDownloadGeoJson.addEventListener("click", () => {
        this.reportExporter.downloadGeoJSON(this.currentRegion, this.changeResult);
      });
    }

    const btnPrintPdf = document.getElementById("btn-print-pdf");
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener("click", () => window.print());
    }

    const calcHa = document.getElementById("calc-hectares");
    const calcRep = document.getElementById("calc-reports");
    if (calcHa) calcHa.addEventListener("input", () => this.updateBusinessCalculator());
    if (calcRep) calcRep.addEventListener("input", () => this.updateBusinessCalculator());
  }

  switchTab(tabId) {
    const views = document.querySelectorAll(".tab-view-panel");
    views.forEach(v => v.classList.add("hidden"));
    const target = document.getElementById(`view-${tabId}`);
    if (target) target.classList.remove("hidden");
    const btns = document.querySelectorAll(".nav-tab-btn");
    btns.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("border-emerald-500", "text-emerald-400", "bg-slate-800/80");
        btn.classList.remove("border-transparent", "text-slate-400");
      } else {
        btn.classList.remove("border-emerald-500", "text-emerald-400", "bg-slate-800/80");
        btn.classList.add("border-transparent", "text-slate-400");
      }
    });
    if (tabId === "dashboard" && this.mapEngine && this.mapEngine.map) {
      setTimeout(() => this.mapEngine.map.invalidateSize(), 200);
    }
  }
}

window.sylvaApp = new SylvaSenseApp();
window.addEventListener("DOMContentLoaded", () => {
  window.sylvaApp.init();
});