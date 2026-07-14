#!/usr/bin/env node

/**
 * Automated script to replace hard-coded colors with CSS variables
 * for dark/light theme support
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mapping from hard-coded values to CSS variables
const COLOR_REPLACEMENTS = {
  // Background colors
  "backgroundColor: '#ffffff'": "backgroundColor: 'var(--card)'",
  "backgroundColor: '#FFFFFF'": "backgroundColor: 'var(--card)'",
  "backgroundColor: 'white'": "backgroundColor: 'var(--card)'",
  "bg-white": "",  // Remove Tailwind class, handle separately
  "backgroundColor: '#F9FAFB'": "backgroundColor: 'var(--muted)'",
  "backgroundColor: '#F3F4F6'": "backgroundColor: 'var(--muted)'",
  
  // Text colors
  "color: '#111827'": "color: 'var(--foreground)'",
  "color: '#171717'": "color: 'var(--foreground)'",
  "color: '#000000'": "color: 'var(--foreground)'",
  "color: '#6B7280'": "color: 'var(--muted-foreground)'",
  "color: '#9CA3AF'": "color: 'var(--muted-foreground)'",
  "color: '#374151'": "color: 'var(--foreground)'",
  "color: '#4B5563'": "color: 'var(--foreground)'",
  
  // Border colors
  "border: '1px solid #E5E7EB'": "border: '1px solid var(--border)'",
  "borderColor: '#E5E7EB'": "borderColor: 'var(--border)'",
  "borderColor: '#D1D5DB'": "borderColor: 'var(--input)'",
  "borderBottom: '1px solid #E5E7EB'": "borderBottom: '1px solid var(--border)'",
  "borderTop: '1px solid #E5E7EB'": "borderTop: '1px solid var(--border)'",
  "borderRight: '1px solid #E5E7EB'": "borderRight: '1px solid var(--border)'",
  "borderLeft: '1px solid #E5E7EB'": "borderLeft: '1px solid var(--border)'",
  
  // Input colors
  "'1px solid #D1D5DB'": "'1px solid var(--input)'",
};

function replaceColors(content) {
  let modified = content;
  
  for (const [oldColor, newColor] of Object.entries(COLOR_REPLACEMENTS)) {
    // Create regex to handle both single and double quotes
    const regex = new RegExp(oldColor.replace(/'/g, "['\"]"), 'g');
    modified = modified.replace(regex, newColor);
  }
  
  return modified;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = replaceColors(content);
    
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  // Find all TSX files
  const files = glob.sync('**/*.tsx', {
    cwd: srcDir,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
    ],
  });
  
  console.log(`\nFound ${files.length} TSX files to process...\n`);
  
  let updatedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\n✨ Done! Updated ${updatedCount} files.`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { replaceColors, processFile };
