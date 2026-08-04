fetch("http://localhost:3000/app-api/compute-route", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    originLatLng: { lat: 37.5, lng: 127.0 },
    destinationLatLng: { lat: 37.6, lng: 127.1 },
    travelMode: "TRANSIT",
    lang: "ko"
  })
}).then(r=>r.text()).then(console.log);
