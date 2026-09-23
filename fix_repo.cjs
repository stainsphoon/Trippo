const fs = require('fs');
let code = fs.readFileSync('src/services/DestinationSearchRepository.ts', 'utf-8');

code = code.replace(
  `isImeComposing?: boolean`,
  `isImeComposing?: boolean,
    explicit?: boolean`
);

code = code.replace(
  `isImeComposing: boolean = false`,
  `isImeComposing: boolean = false,
    explicit: boolean = false`
);

code = code.replace(
  `const cacheKey = \`\${language}:\${limit}:\${trimmed}:\${isImeComposing}\`;`,
  `const cacheKey = \`\${language}:\${limit}:\${trimmed}:\${isImeComposing}:\${explicit}\`;`
);

code = code.replace(
  `isImeComposing=\${isImeComposing}\`;`,
  `isImeComposing=\${isImeComposing}&explicit=\${explicit}\`;`
);

fs.writeFileSync('src/services/DestinationSearchRepository.ts', code, 'utf-8');
