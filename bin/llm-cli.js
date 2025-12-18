#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Resolve the package root directory (where package.json is)
const packageRoot = path.join(__dirname, '..');
// Change working directory to package root so that relative paths in the code work
process.chdir(packageRoot);

// Find tsx executable in node_modules/.bin
const tsxPath = 'tsx';//path.join(__dirname, 'node_modules', '.bin', 'tsx');
const entryPath = path.join(packageRoot, 'src', 'index.ts');

// Check if tsx exists, if not, try global tsx
// const fs = require('fs');
// if (!fs.existsSync(tsxPath)) {
//     console.error('Error: tsx not found in node_modules/.bin. Please ensure tsx is installed.');
//     process.exit(1);
// }

const child = spawn(tsxPath, [entryPath], { stdio: 'inherit' });

child.on('error', (err) => {
    console.error('Failed to start tsx:', err);
    process.exit(1);
});

child.on('close', (code) => {
    process.exit(code);
});
