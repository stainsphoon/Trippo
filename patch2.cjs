const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch 1: Line 5545
code = code.replace(
  'fetchPublicHolidays(countryCodeClean, startDate, endDate),',
  'fetchPublicHolidays(countryCodeClean, startDate, endDate).catch(e => { console.error("[Holiday API Error]", e); return { provider: "Fallback", status: "error", rawCount: 0, normalizedCount: 0, filteredCount: 0, items: [] }; }),'
);

// Patch 2: Line 5546
code = code.replace(
  'fetchEventsAndFestivals({\n          cityName: name,\n          countryCode: countryCodeClean,\n          startDate,\n          endDate,\n          ai,\n          cityId: placeId,\n          cacheId,\n          cacheHit: false\n        })\n      ]);',
  'fetchEventsAndFestivals({\n          cityName: name,\n          countryCode: countryCodeClean,\n          startDate,\n          endDate,\n          ai,\n          cityId: placeId,\n          cacheId,\n          cacheHit: false\n        }).catch(e => { console.error("[Event API Error]", e); return { provider: "Fallback", rawCount: 0, normalizedCount: 0, dateFilteredCount: 0, locationFilteredCount: 0, categoryFilteredCount: 0, festivals: [], publicEvents: [], industryEvents: [], events: [], status: "error" }; })\n      ]);'
);


// Patch 3: Line 5776 (Fallback block)
code = code.replace(
  'fetchPublicHolidays(countryCodeClean, startDate, endDate),',
  'fetchPublicHolidays(countryCodeClean, startDate, endDate).catch(e => { console.error("[Holiday API Error]", e); return { provider: "Fallback", status: "error", rawCount: 0, normalizedCount: 0, filteredCount: 0, items: [] }; }),'
);

code = code.replace(
  'fetchEventsAndFestivals({\n          cityName: name,\n          countryCode: countryCodeClean,\n          startDate,\n          endDate,\n          ai,\n          cityId: placeId,\n          cacheId,\n          cacheHit: false\n        })\n      ]);',
  'fetchEventsAndFestivals({\n          cityName: name,\n          countryCode: countryCodeClean,\n          startDate,\n          endDate,\n          ai,\n          cityId: placeId,\n          cacheId,\n          cacheHit: false\n        }).catch(e => { console.error("[Event API Error]", e); return { provider: "Fallback", rawCount: 0, normalizedCount: 0, dateFilteredCount: 0, locationFilteredCount: 0, categoryFilteredCount: 0, festivals: [], publicEvents: [], industryEvents: [], events: [], status: "error" }; })\n      ]);'
);


fs.writeFileSync('server.ts', code);
console.log("PATCHED server.ts");
