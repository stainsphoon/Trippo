const fs = require('fs');

// First modify destinationSearchService.ts to remove or bypass the mapping store check
let serviceCode = fs.readFileSync('src/services/destinationSearchService.ts', 'utf-8');

serviceCode = serviceCode.replace(
  'const mappedId = googlePlaceIdMappingStore.get(externalId);',
  `const mappedId = params.skipCache ? undefined : googlePlaceIdMappingStore.get(externalId);`
);

serviceCode = serviceCode.replace(
  'export async function resolveDestinationDetails(\n  params: {\n    provider?: string;\n    externalId: string;\n    language?: \'ko\' | \'en\';\n    googleApiKey?: string;\n    pendingAlias?: string;\n  }',
  `export async function resolveDestinationDetails(\n  params: {\n    provider?: string;\n    externalId: string;\n    language?: 'ko' | 'en';\n    googleApiKey?: string;\n    pendingAlias?: string;\n    skipCache?: boolean;\n  }`
);

fs.writeFileSync('src/services/destinationSearchService.ts', serviceCode, 'utf-8');

