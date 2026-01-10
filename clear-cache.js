#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing development cache...');

// Directories to clear
const cacheDirs = [
  'node_modules/.vite',
  'node_modules/.cache',
  'dist'
];

// Clear cache directories
cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ Cleared ${dir}`);
  } else {
    console.log(`⏭️  ${dir} doesn't exist, skipping`);
  }
});

console.log('✨ Cache cleared! Run "npm run dev" to start fresh.');