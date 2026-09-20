/**
 * SylvaSense (ORION-PS-03) Universal Node.js Backend Server & REST API
 * Zero external dependencies: uses native Node.js http, fs, path, url, crypto
 * Deployable to Vercel, Replit, Docker, Render, and Localhost
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Ingest benchmark data
const { BENCHMARK_REGIONS, RESEARCH_REFERENCES } = require('./public/js/benchmark_data.js');

// Ingest AI & Pipeline modules
const SylvaSenseAIEngine = require('./public/js/ai_model.js');
const SylvaSenseChangeDetector = require('./public/js/change_detection.js');
const SylvaSenseReviewManager = require('./public/js/human_review.js');
const SylvaSenseReportExporter = require('./public/js/export_report.js');

const aiEngine = new SylvaSenseAIEngine();
const changeDetector = new SylvaSenseChangeDetector();
const reviewManager = new SylvaSenseReviewManager();
const reportExporter = new SylvaSenseReportExporter();

/**
 * Universal Request Handler (Supports HTTP server and Vercel Serverless)
 */
async function requestHandler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Helper for JSON responses
  const sendJSON = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify(data, null, 2));
  };

  // Helper to parse JSON body
  const getBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });

  // REST API Routes
  if (pathname.startsWith('/api/')) {
    // 1. Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJSON(200, {
        status: 'healthy',
        service: 'SylvaSense Forest-Carbon Monitoring Platform',
        problemStatement: 'ORION-PS-03',
        version: '2.4.0',
        runtimes: {
          node: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      });
    }

    // 2. Regions list
    if (pathname === '/api/aoi/regions' && req.method === 'GET') {
      const regionsList = Object.values(BENCHMARK_REGIONS).map(r => ({
        id: r.id,
        name: r.name,
        country: r.country,
        biome: r.biome,
        areaHectares: r.areaHectares,
        coordinates: r.coordinates
      }));
      return sendJSON(200, { count: regionsList.length, regions: regionsList });
    }

    // 3. Region detail
    if (pathname.startsWith('/api/aoi/region/') && req.method === 'GET') {
      const regionId = pathname.replace('/api/aoi/region/', '');
      const region = BENCHMARK_REGIONS[regionId];
      if (!region) return sendJSON(404, { error: 'Region not found' });
      return sendJSON(200, region);
    }

    // 4. Run 9-Layer Pipeline
    if (pathname === '/api/pipeline/run' && req.method === 'POST') {
      const body = await getBody();
      const regionId = body.regionId || 'western-ghats';
      const region = BENCHMARK_REGIONS[regionId] || BENCHMARK_REGIONS['western-ghats'];

      const opticalInput = {
        ndvi: body.ndvi ?? region.opticalData.meanNDVI,
        evi: body.evi ?? region.opticalData.meanEVI,
        ndre: body.ndre ?? region.opticalData.meanNDRE,
        cloudCover: body.cloudCover ?? region.opticalData.cloudCoverT2
      };

      const sarInput = {
        vv_dB: body.vv_dB ?? region.sarData.meanVV_dB,
        vh_dB: body.vh_dB ?? region.sarData.meanVH_dB,
        polarizationRatio: body.polarizationRatio ?? region.sarData.polarizationRatio,
        rfdi: body.rfdi ?? region.sarData.rfdi
      };

      const aiEst = aiEngine.predict(opticalInput, sarInput, region.gediReference, region.areaHectares);
      const chgDetect = changeDetector.detect(region, body.t1Date, body.t2Date);

      return sendJSON(200, {
        pipeline: "SylvaSense 9-Layer Remote Sensing Pipeline",
        region: region.name,
        opticalProcessed: opticalInput,
        sarProcessed: sarInput,
        aiEstimation: aiEst,
        changeDetection: chgDetect
      });
    }

    // 5. Submit Human Review
    if (pathname === '/api/review/submit' && req.method === 'POST') {
      const body = await getBody();
      const review = await reviewManager.submitReview(body);
      return sendJSON(200, { success: true, review });
    }

    // 6. Verification Report Payload
    if (pathname === '/api/export/report' && req.method === 'GET') {
      const regionId = parsedUrl.searchParams.get('regionId') || 'western-ghats';
      const region = BENCHMARK_REGIONS[regionId] || BENCHMARK_REGIONS['western-ghats'];
      const aiEst = aiEngine.predict(
        { ndvi: region.opticalData.meanNDVI, evi: region.opticalData.meanEVI, cloudCover: region.opticalData.cloudCoverT2 },
        { vv_dB: region.sarData.meanVV_dB, vh_dB: region.sarData.meanVH_dB, polarizationRatio: region.sarData.polarizationRatio },
        region.gediReference,
        region.areaHectares
      );
      const chgDetect = changeDetector.detect(region);
      const report = reportExporter.generateReportPayload(region, aiEst, chgDetect, {
        reviewerName: region.reviewer,
        status: region.reviewStatus,
        comments: region.reviewNotes,
        timestamp: new Date().toISOString()
      });
      return sendJSON(200, report);
    }

    // 7. Research References
    if (pathname === '/api/references' && req.method === 'GET') {
      return sendJSON(200, { references: RESEARCH_REFERENCES });
    }

    return sendJSON(404, { error: 'Endpoint not found' });
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
}

// Start Server if run directly
if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`SylvaSense (ORION-PS-03) Forest-Carbon Monitoring Platform`);
    console.log(`Server listening on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

// Export for Vercel Serverless
module.exports = requestHandler;
