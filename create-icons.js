#!/usr/bin/env node

// Simple script to create basic colored PNG icons without external dependencies
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple PNG data for a 192x192 colored square
// This is a minimal PNG file in base64 format
const createSimplePNG = (size, color = '4F46E5') => {
  // This is a minimal PNG header + data for a solid color square
  // In a real scenario, you'd use a proper image library
  // For now, we'll create SVG files that browsers can use
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#${color}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          fill="white" font-family="Arial" font-size="${size/6}">SH</text>
  </svg>`;
};

const publicDir = path.join(__dirname, 'public');

// Create SVG icons (browsers can use these as PNG alternatives)
const icon192 = createSimplePNG(192);
const icon512 = createSimplePNG(512);
const badge = createSimplePNG(96, 'FF6B35');

// Write SVG files that browsers will accept as icons
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);
fs.writeFileSync(path.join(publicDir, 'badge.svg'), badge);

// Create fallback data URLs for PNG-like usage
const dataUrl192 = `data:image/svg+xml;base64,${Buffer.from(icon192).toString('base64')}`;
const dataUrl512 = `data:image/svg+xml;base64,${Buffer.from(icon512).toString('base64')}`;
const dataUrlBadge = `data:image/svg+xml;base64,${Buffer.from(badge).toString('base64')}`;

// Create JavaScript file with icon data
const iconData = `// Auto-generated icon data
export const ICONS = {
  icon192: '${dataUrl192}',
  icon512: '${dataUrl512}',
  badge: '${dataUrlBadge}',
};
`;

fs.writeFileSync(path.join(publicDir, 'icon-data.js'), iconData);

console.log('Icons created successfully!');
console.log('- icon-192.svg');
console.log('- icon-512.svg');  
console.log('- badge.svg');
console.log('- icon-data.js');