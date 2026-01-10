#!/usr/bin/env node

console.log('🧹 Clearing live show data...');

// This script helps clear any stale live show data from localStorage
// Run this in the browser console if you're still seeing phantom live shows

const clearScript = `
// Clear live show data
localStorage.removeItem('pulse_fm_live_shows');
localStorage.removeItem('pulse_fm_chat_messages');

// Clear any other cached data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('pulse_fm') || key.includes('live') || key.includes('broadcast'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => localStorage.removeItem(key));

console.log('✅ Cleared live show data. Refresh the page to see changes.');
`;

console.log('📋 Copy and paste this code in your browser console:');
console.log('');
console.log(clearScript);
console.log('');
console.log('Or just refresh the page - the app should now show no live content when nothing is actually live.');