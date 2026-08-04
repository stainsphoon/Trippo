require('dotenv').config();
const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GEMINI_API_KEY || "";
console.log("API Key:", apiKey.substring(0, 5) + "...");

const fetch = require('node-fetch'); // we can use node's native fetch in v18+ but let's just write async function

async function testTransit() {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
  const requestPayload = {
    origin: { location: { latLng: { latitude: 35.681236, longitude: 139.767125 } } },
    destination: { location: { latLng: { latitude: 35.667345, longitude: 139.742312 } } },
    travelMode: "TRANSIT",
    languageCode: "ko"
  };

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.staticDuration,routes.localizedValues"
  };

  const res = await globalThis.fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestPayload)
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testTransit();
