const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const originalRoute = `  // Admin Cleaner Endpoint to reset database state for E2E testing
  app.post('/app-api/destinations/admin-clear', async (req, res) => {`;

const newRoute = `  // Admin Cleaner Endpoint to reset database state for E2E testing
  if (process.env.NODE_ENV !== "production") {
    app.post('/app-api/destinations/admin-clear', async (req, res) => {`;

code = code.replace(originalRoute, newRoute);

// Find the end of the route and close the block
const originalEnd = `      return res.status(500).json({ error: err.message });
    }
  });`;

const newEnd = `      return res.status(500).json({ error: err.message });
    }
  });
  }`;

code = code.replace(originalEnd, newEnd);

fs.writeFileSync('server.ts', code, 'utf-8');
