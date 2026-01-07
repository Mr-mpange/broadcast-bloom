// Simple script to create placeholder icons for PWA
// Run this in Node.js or copy to browser console

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

function createPlaceholderIcon(size) {
  // Create a simple SVG icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#8b5cf6"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="none" stroke="white" stroke-width="${size/20}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/6}" fill="none" stroke="white" stroke-width="${size/20}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/8}" fill="none" stroke="white" stroke-width="${size/20}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/40}" fill="white"/>
      ${size >= 128 ? `<text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/8}" font-weight="bold">PULSE</text>` : ''}
      ${size >= 128 ? `<text x="${size/2}" y="${size*0.85}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/10}" font-weight="bold">FM</text>` : ''}
    </svg>
  `;
  
  return svg;
}

// Instructions for creating icons
console.log('=== PWA Icon Creation Instructions ===');
console.log('');
console.log('Option 1: Use the HTML generator');
console.log('1. Open generate-icons.html in your browser');
console.log('2. Download all generated icons');
console.log('3. Place them in the public/icons/ folder');
console.log('');
console.log('Option 2: Create simple placeholder icons');
console.log('Copy the SVG code below and convert to PNG files:');
console.log('');

sizes.forEach(size => {
  console.log(`=== ${size}x${size} Icon ===`);
  console.log(createPlaceholderIcon(size));
  console.log('');
});

console.log('Option 3: Use online tools');
console.log('- PWA Builder: https://www.pwabuilder.com/imageGenerator');
console.log('- Favicon Generator: https://favicon.io/');
console.log('- App Icon Generator: https://appicon.co/');
console.log('');
console.log('Required icon files:');
sizes.forEach(size => {
  console.log(`- public/icons/icon-${size}x${size}.png`);
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPlaceholderIcon, sizes };
}