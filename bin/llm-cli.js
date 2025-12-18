#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Resolve the package root directory (where package.json is)
const packageRoot = path.join(__dirname, '..');
// Find tsx executable in node_modules/.bin
const tsxPath = 'tsx';//path.join(__dirname, 'node_modules', '.bin', 'tsx');
const entryPath = path.join(packageRoot, 'src', 'index.ts');

const child = spawn(tsxPath, [entryPath], { stdio: 'inherit' });

child.on('error', (err) => {
    console.error('Failed to start tsx:', err);
    process.exit(1);
});

child.on('close', (code) => {
    process.exit(code);
});
