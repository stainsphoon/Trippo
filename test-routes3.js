const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
const requestPayload = {
  origin: { location: { latLng: { latitude: 37.5, longitude: 127.0 } } },
  destination: { location: { latLng: { latitude: 37.6, longitude: 127.1 } } },
  travelMode: "TRANSIT",
  languageCode: "ko"
};
fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "routes.legs.steps"
  },
  body: JSON.stringify(requestPayload)
}).then(r => r.text()).then(console.log);
