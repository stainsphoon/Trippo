import 'google.maps';
let req: google.maps.DistanceMatrixRequest = {
  origins: [],
  destinations: [],
  travelMode: google.maps.TravelMode.TRANSIT,
  transitOptions: {
    departureTime: new Date()
  }
};
