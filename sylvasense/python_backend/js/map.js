/**
 * SylvaSense (ORION-PS-03) Interactive Map & Geospatial Layer Engine
 * Powered by Leaflet GIS with Optical vs SAR Split Swipe & Biomass Heatmaps
 */

class SylvaSenseMap {
  constructor(containerId = "map") {
    this.containerId = containerId;
    this.map = null;
    this.currentRegion = null;
    this.aoiLayer = null;
    this.alertsLayer = null;
    this.biomassLayer = null;
    this.densityLayer = null;
    this.cloudGapLayer = null;
    this.baseLayers = {};
    this.activeOverlay = "biomass"; // biomass, density, alerts, cloudgap, none
    this.viewMode = "split"; // standard, split, sar_only, optical_only
    this.splitDividerRatio = 0.5; // 50% split
  }

  init(regionData) {
    if (this.map) {
      this.map.remove();
    }

    const coords = regionData ? regionData.coordinates : [13.5152, 75.0934];
    const zoom = regionData ? regionData.defaultZoom : 13;

    // Initialize Leaflet Map
    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView(coords, zoom);

    // Attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: '<span class="text-xs text-emerald-400 font-mono">SylvaSense GIS Engine | Sentinel-1 & 2</span>'
    }).addTo(this.map);

    // Base Layer: OpenStreetMap (Guaranteed global availability & fast rendering)
    this.baseLayers.osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '&copy; OpenStreetMap | SylvaSense' }
    ).addTo(this.map);

    // Satellite Layer: ESRI World Imagery
    this.baseLayers.satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    );

    // Dark carto layer for high-contrast thematic views
    this.baseLayers.dark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    );

    this.alertsLayer = L.layerGroup().addTo(this.map);
    this.biomassLayer = L.layerGroup().addTo(this.map);
    this.densityLayer = L.layerGroup();
    this.cloudGapLayer = L.layerGroup();

    if (regionData) {
      this.loadRegion(regionData);
    }

    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 150);
    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 600);
  }

  loadRegion(regionData) {
    this.currentRegion = regionData;
    this.map.setView(regionData.coordinates, regionData.defaultZoom);

    // Render AOI Bounding Box
    if (this.aoiLayer) {
      this.map.removeLayer(this.aoiLayer);
    }

    const bounds = regionData.bounds;
    this.aoiLayer = L.rectangle(bounds, {
      color: "#10b981",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#059669",
      fillOpacity: 0.05
    }).addTo(this.map);

    this.aoiLayer.bindTooltip(`<b>${regionData.name}</b><br>Area: ${regionData.areaHectares.toLocaleString()} ha`, {
      permanent: false,
      direction: 'top'
    });

    // Render alerts
    this.renderAlerts(regionData.changeDetection.alerts);

    // Render synthetic biomass grid
    this.renderBiomassGrid(regionData);

    // Render cloud-gap penetration layer
    this.renderCloudGapLayer(regionData);
  }

  /**
   * Render Change Detection Alert Polygons
   */
  renderAlerts(alerts) {
    this.alertsLayer.clearLayers();

    if (!alerts || alerts.length === 0) return;

    alerts.forEach(alert => {
      const color = alert.type === "Deforestation" ? "#ef4444" : 
                    alert.type === "Degradation" ? "#f59e0b" : "#06b6d4";

      const radius = Math.max(120, Math.sqrt(alert.areaHa * 10000) * 0.8);

      const circle = L.circle([alert.lat, alert.lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.45,
        radius: radius,
        weight: 2
      });

      const popupContent = `
        <div class="p-2 font-sans text-slate-100 min-w-[220px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-2">
            <span class="text-xs font-bold font-mono text-slate-400">${alert.id}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              alert.type === 'Deforestation' ? 'bg-red-900/80 text-red-300' :
              alert.type === 'Degradation' ? 'bg-amber-900/80 text-amber-300' : 'bg-cyan-900/80 text-cyan-300'
            }">${alert.type}</span>
          </div>
          <p class="text-xs text-slate-300 font-medium mb-1.5">${alert.reason}</p>
          <div class="grid grid-cols-2 gap-1 text-[11px] bg-slate-900/60 p-2 rounded">
            <span class="text-slate-400">Affected Area:</span>
            <span class="font-bold text-right text-emerald-400">${alert.areaHa} ha</span>
            <span class="text-slate-400">Severity:</span>
            <span class="font-bold text-right text-slate-200">${alert.severity}</span>
            <span class="text-slate-400">Confidence:</span>
            <span class="font-bold text-right text-slate-200">${alert.confidence}%</span>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent, { className: 'sylva-leaflet-popup' });
      this.alertsLayer.addLayer(circle);
    });
  }

  /**
   * Render dynamic AI Biomass Grid / Heatmap representation
   */
  renderBiomassGrid(regionData) {
    this.biomassLayer.clearLayers();
    this.densityLayer.clearLayers();

    const bounds = regionData.bounds;
    const latMin = bounds[0][0];
    const latMax = bounds[1][0];
    const lonMin = bounds[0][1];
    const lonMax = bounds[1][1];

    const latStep = (latMax - latMin) / 6;
    const lonStep = (lonMax - lonMin) / 6;
    const baseBiomass = regionData.aiEstimation.biomassP50;

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const cellLat = latMin + i * latStep;
        const cellLon = lonMin + j * lonStep;

        // Pseudo-spatial variation simulating natural forest biomass distribution
        const noise = Math.sin(i * 1.5) * Math.cos(j * 1.7) * 45;
        const cellBiomass = Math.max(40, Math.round(baseBiomass + noise));
        const cellDensity = Math.min(96, Math.max(30, Math.round(cellBiomass * 0.28 + 15)));

        // Color mapping for biomass (Yellow-Green to Deep Emerald)
        let bioColor = "#fef08a"; // low biomass
        let fillOp = 0.35;
        if (cellBiomass > 300) { bioColor = "#064e3b"; fillOp = 0.55; }
        else if (cellBiomass > 240) { bioColor = "#047857"; fillOp = 0.48; }
        else if (cellBiomass > 180) { bioColor = "#10b981"; fillOp = 0.42; }
        else if (cellBiomass > 120) { bioColor = "#34d399"; fillOp = 0.38; }

        const rectBounds = [
          [cellLat, cellLon],
          [cellLat + latStep, cellLon + lonStep]
        ];

        // Biomass Cell
        const bioRect = L.rectangle(rectBounds, {
          color: bioColor,
          weight: 0.5,
          fillColor: bioColor,
          fillOpacity: fillOp
        });

        bioRect.bindTooltip(`
          <div class="text-xs">
            <b>Biomass Density:</b> ${cellBiomass} Mg/ha<br>
            <b>Canopy Cover:</b> ${cellDensity}%<br>
            <span class="text-slate-400">Sensor: Sentinel-1/2 AI Fusion</span>
          </div>
        `, { sticky: true });

        this.biomassLayer.addLayer(bioRect);
      }
    }
  }

  /**
   * Render Cloud-Gap Demonstration Layer (Slide 2 & 4: SAR penetrates optical cloud gaps)
   */
  renderCloudGapLayer(regionData) {
    this.cloudGapLayer.clearLayers();
    if (!regionData.opticalData.cloudGapAreaHa) return;

    const bounds = regionData.bounds;
    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLon = (bounds[0][1] + bounds[1][1]) / 2;

    // Cloud simulation zone where Sentinel-2 is blinded by cloud, but Sentinel-1 SAR sees through
    const cloudCircle = L.circle([centerLat + 0.02, centerLon - 0.02], {
      color: "#94a3b8",
      fillColor: "#cbd5e1",
      fillOpacity: 0.4,
      radius: 2200,
      dashArray: "4, 8",
      weight: 2
    });

    cloudCircle.bindPopup(`
      <div class="p-2 text-xs text-slate-200">
        <div class="font-bold text-sky-400 mb-1">☁️ Optical Cloud Gap Zone (${regionData.opticalData.cloudGapAreaHa} ha)</div>
        <p class="text-slate-300">Optical Sentinel-2 is 100% occluded by tropical cloud/fog here.</p>
        <p class="text-emerald-400 font-semibold mt-1">✓ Sentinel-1 C-Band SAR successfully penetrates, monitoring structural biomass continuously.</p>
      </div>
    `);

    this.cloudGapLayer.addLayer(cloudCircle);
  }

  /**
   * Layer Toggle Controller
   */
  setLayer(layerName) {
    this.activeOverlay = layerName;

    if (layerName === "biomass") {
      this.map.addLayer(this.biomassLayer);
      if (this.map.hasLayer(this.densityLayer)) this.map.removeLayer(this.densityLayer);
      if (this.map.hasLayer(this.cloudGapLayer)) this.map.removeLayer(this.cloudGapLayer);
    } else if (layerName === "density") {
      if (this.map.hasLayer(this.biomassLayer)) this.map.removeLayer(this.biomassLayer);
      this.map.addLayer(this.densityLayer);
      if (this.map.hasLayer(this.cloudGapLayer)) this.map.removeLayer(this.cloudGapLayer);
    } else if (layerName === "cloudgap") {
      this.map.addLayer(this.biomassLayer);
      this.map.addLayer(this.cloudGapLayer);
    } else if (layerName === "alerts") {
      // alerts are always on top
    } else if (layerName === "none") {
      if (this.map.hasLayer(this.biomassLayer)) this.map.removeLayer(this.biomassLayer);
      if (this.map.hasLayer(this.cloudGapLayer)) this.map.removeLayer(this.cloudGapLayer);
    }
  }

  toggleAlerts(show) {
    if (show) {
      if (!this.map.hasLayer(this.alertsLayer)) this.map.addLayer(this.alertsLayer);
    } else {
      if (this.map.hasLayer(this.alertsLayer)) this.map.removeLayer(this.alertsLayer);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SylvaSenseMap;
}


window.addEventListener('resize', () => {
  if (window.sylvaApp && window.sylvaApp.mapEngine && window.sylvaApp.mapEngine.map) {
    window.sylvaApp.mapEngine.map.invalidateSize();
  }
});
