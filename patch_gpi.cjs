const fs = require('fs');
let code = fs.readFileSync('src/components/GooglePlaceInput.tsx', 'utf8');

code = code.replace(/onPointerDown=\{\(e\) => \{\s*e.preventDefault\(\);\s*onSelect\(recSearchItem\);\s*\}\}/g,
  "onPointerDown={(e) => { e.preventDefault(); }}\n          onClick={() => onSelect(recSearchItem)}");

code = code.replace(/onPointerDown=\{\(e\) => \{\s*e.preventDefault\(\);\s*onSelect\(altSearchItem\);\s*\}\}/g,
  "onPointerDown={(e) => { e.preventDefault(); }}\n                  onClick={() => onSelect(altSearchItem)}");

code = code.replace(/onPointerDown=\{\(e\) => \{\s*e.preventDefault\(\);\s*handleSelect\(item\);\s*\}\}/g,
  "onPointerDown={(e) => { e.preventDefault(); }}\n                        onClick={() => handleSelect(item)}");

code = code.replace(/onPointerDown=\{\(e\) => \{\s*e.preventDefault\(\);\s*handleSelectPopularTag\(tag\);\s*\}\}/g,
  "onPointerDown={(e) => { e.preventDefault(); }}\n                      onClick={() => handleSelectPopularTag(tag)}");

fs.writeFileSync('src/components/GooglePlaceInput.tsx', code);
console.log("PATCHED GooglePlaceInput.tsx");
