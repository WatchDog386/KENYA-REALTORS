const fs = require('fs');
let code = fs.readFileSync('src/pages/ApplicationForm.tsx', 'utf8');

// We are going to replace the ApplicationForm with a fully updated version that handles unit apps.
// Alternatively, since the file is large, we can just replace what's needed.
