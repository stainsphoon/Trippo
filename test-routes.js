const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
const requestPayload = {
  origin: { placeId: "ChIJVSqON3bzImARUTDmWTxZGRc" },
  destination: { placeId: "ChIJD8r0e6GMGGARJv8yvQ7oegk" },
  travelMode: "TRANSIT",
  languageCode: "ko"
};
fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
  },
  body: JSON.stringify(requestPayload)
}).then(r => r.text()).then(console.log);
