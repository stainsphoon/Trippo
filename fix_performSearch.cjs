const fs = require('fs');
let code = fs.readFileSync('src/components/GooglePlaceInput.tsx', 'utf-8');

code = code.replace(
  `const performSearch = (query: string) => {`,
  `const performSearch = (query: string, explicit = false) => {`
);

code = code.replace(
  `const res = await destinationSearchRepository.autocomplete(trimmed, lang, 5, isImeComposing);`,
  `const res = await destinationSearchRepository.autocomplete(trimmed, lang, 5, isImeComposing, explicit);`
);

// We should also find where it says "return performSearch(inputValue, true)" etc.
code = code.replace(
  `performSearch(val);`,
  `performSearch(val, true);`
);

code = code.replace(
  `onClick={() => performSearch(inputValue)}`,
  `onClick={() => performSearch(inputValue, true)}`
);

fs.writeFileSync('src/components/GooglePlaceInput.tsx', code, 'utf-8');
