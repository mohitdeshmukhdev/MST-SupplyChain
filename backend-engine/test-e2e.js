const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("🚀 Starting Zero-Mock Backend E2E Tests...\n");

  try {
    // 1. Health Check
    console.log("1️⃣  Testing GET /health ...");
    const health = await request('GET', '/health');
    console.log(`Response Status: ${health.status}`);
    if (health.status !== 200 || health.data.api !== 'up') {
      throw new Error("Health check failed!");
    }
    console.log("✅ Health check passed!\n");

    // 2. Carbon Factors
    console.log("2️⃣  Testing GET /api/carbon/factors ...");
    const factors = await request('GET', '/api/carbon/factors');
    console.log(`Response Status: ${factors.status}`);
    if (!factors.data || !factors.data.DIESEL_TRUCK_HGV) {
      throw new Error("Failed to fetch DEFRA factors!");
    }
    console.log("✅ DEFRA factors fetched successfully!\n");

    console.log("🎉 All preliminary E2E tests passed! The backend is healthy and ready for the frontend.");
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    process.exit(1);
  }
}

runTests();
