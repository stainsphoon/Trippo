const fs = require('fs');
const mapData = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf-8'));
const index = mapData.sources.indexOf('../server.ts');
if (index !== -1) {
    fs.writeFileSync('server.ts', mapData.sourcesContent[index], 'utf-8');
    console.log('Recovered server.ts!');
}
