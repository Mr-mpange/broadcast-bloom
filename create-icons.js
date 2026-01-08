const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that can be converted to PNG
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#8b5cf6" rx="${size * 0.1}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.3}" fill="white"/>
  <polygon points="${size * 0.4},${size * 0.4} ${size * 0.4},${size * 0.6} ${size * 0.6},${size * 0.5}" fill="#8b5cf6"/>
</svg>`;

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (browsers can use SVG as PNG fallback)
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Created ${filename}`);
});

console.log('✅ Icon placeholders created!');
console.log('Note: These are SVG placeholders. For production, convert to PNG or use a proper icon generator.');