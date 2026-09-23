const fs = require('fs');
let code = fs.readFileSync('src/services/DestinationSearchRepository.ts', 'utf-8');

code = code.replace(
  `autocomplete(
    query: string,
    language?: 'ko' | 'en',
    limit?: number,
    isImeComposing?: boolean,
    explicit?: boolean
  )`,
  `autocomplete(
    query: string,
    language?: 'ko' | 'en',
    limit?: number,
    isImeComposing?: boolean,
    explicit?: boolean
  )`
); // just checking format, let me fix calls

// In GooglePlaceInput, need to ensure the explicit flag is passed when they hit "enter" or search button.
