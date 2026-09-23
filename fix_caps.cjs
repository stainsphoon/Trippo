const fs = require('fs');
let code = fs.readFileSync('src/services/destinationSearchService.ts', 'utf-8');

code = code.replace(
  `    capabilities: {
      weather: { status: 'verified', provider: 'google_weather' },
      holidays: { status: 'verified', provider: 'public_holidays' },
      festivals: { status: 'pending', provider: null },
      routes: { status: 'verified', provider: 'google_routes' },
      airQuality: { status: 'pending', provider: null },
    },
    status: 'active',`,
  `    capabilities: {
      weather: { status: 'pending', provider: null },
      holidays: { status: 'pending', provider: null },
      festivals: { status: 'pending', provider: null },
      routes: { status: externalId && lat && lng ? 'verified' : 'pending', provider: 'google_routes' },
      airQuality: { status: 'pending', provider: null },
    },
    status: 'provisional',
    lifecycleStatus: 'provisional',`
);

fs.writeFileSync('src/services/destinationSearchService.ts', code, 'utf-8');
