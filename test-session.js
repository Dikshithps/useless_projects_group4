const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log("🧪 Testing POWER CUT Backend Game Flow...");

  // 1. Start session Level 1
  const startRes = await post('http://localhost:3000/api/game/start', { level: 1 });
  console.log("✅ Game Started:", {
    sessionId: startRes.sessionId,
    target: startRes.target.name,
    roomObjectCount: startRes.roomObjects.length
  });

  // Verify target is NEVER in room objects
  const targetInRoom = startRes.roomObjects.some(o => o.id === startRes.target.id || o.name.toLowerCase() === startRes.target.name.toLowerCase());
  console.log("🎯 Target Non-Existence Check:", targetInRoom ? "❌ FAILED (Target found in room!)" : "✅ PASSED (Target IS NOT in the room!)");

  // 2. Simulate Wrong Clicks
  const click1 = await post(`http://localhost:3000/api/game/${startRes.sessionId}/click`, { objectId: 'sofa', objectName: 'Comfy Sofa' });
  console.log("🖱️ Click 1 response:", click1.message);

  const click2 = await post(`http://localhost:3000/api/game/${startRes.sessionId}/click`, { objectId: 'tv', objectName: 'Flickering TV' });
  console.log("🖱️ Click 2 response:", click2.message);

  // 3. Flashlight
  const flash = await post(`http://localhost:3000/api/game/${startRes.sessionId}/flashlight`, {});
  console.log("🔦 Flashlight use count:", flash.flashlightUses);

  // 4. Finish Session
  const finishRes = await post(`http://localhost:3000/api/game/${startRes.sessionId}/finish`, { searchDuration: 20.0 });
  console.log("📊 Results:", {
    targetName: finishRes.results.targetName,
    objectsFound: finishRes.results.objectsFound,
    uselessnessScore: finishRes.results.uselessnessScore,
    ratingStars: finishRes.results.ratingStars,
    verdict: finishRes.results.verdict
  });

  console.log("🎉 Test completed successfully!");
}

runTest();
