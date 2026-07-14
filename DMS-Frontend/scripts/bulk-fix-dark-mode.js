#!/usr/bin/env node

/**
 * Comprehensive Dark Mode Fix Script
 * Automatically updates all pages to use CSS variables
 */

const fs = require('fs');
const path = require('path');

// Comprehensive color replacements
const replacements = [
  // Page titles and headings
  { from: /color:\s*['"]#111827['"]/g, to: "color: 'var(--foreground)'" },
  { from: /color:\s*['"]#171717['"]/g, to: "color: 'var(--foreground)'" },
  { from: /color:\s*['"]#000000['"]/g, to: "color: 'var(--foreground)'" },
  
  // Secondary text
  { from: /color:\s*['"]#6B7280['"]/g, to: "color: 'var(--muted-foreground)'" },
  { from: /color:\s*['"]#9CA3AF['"]/g, to: "color: 'var(--muted-foreground)'" },
  { from: /color:\s*['"]#374151['"]/g, to: "color: 'var(--foreground)'" },
  { from: /color:\s*['"]#4B5563['"]/g, to: "color: 'var(--foreground)'" },
  
  // Background colors - white/light
  { from: /backgroundColor:\s*['"]#ffffff['"]/gi, to: "backgroundColor: 'var(--card)'" },
  { from: /backgroundColor:\s*['"]white['"]/gi, to: "backgroundColor: 'var(--card)'" },
  { from: /backgroundColor:\s*['"]#F9FAFB['"]/g, to: "backgroundColor: 'var(--muted)'" },
  { from: /backgroundColor:\s*['"]#F3F4F6['"]/g, to: "backgroundColor: 'var(--muted)'" },
  
  // Borders
  { from: /border:\s*['"]1px solid #E5E7EB['"]/g, to: "border: '1px solid var(--border)'" },
  { from: /borderColor:\s*['"]#E5E7EB['"]/g, to: "borderColor: 'var(--border)'" },
  { from: /borderBottom:\s*['"]1px solid #E5E7EB['"]/g, to: "borderBottom: '1px solid var(--border)'" },
  { from: /borderTop:\s*['"]1px solid #E5E7EB['"]/g, to: "borderTop: '1px solid var(--border)'" },
  { from: /borderLeft:\s*['"]1px solid #E5E7EB['"]/g, to: "borderLeft: '1px solid var(--border)'" },
  { from: /borderRight:\s*['"]1px solid #E5E7EB['"]/g, to: "borderRight: '1px solid var(--border)'" },
  { from: /borderColor:\s*['"]#D1D5DB['"]/g, to: "borderColor: 'var(--input)'" },
  
  // Specific patterns in style objects
  { from: /style=\{\{\s*color:\s*['"]#111827['"]/g, to: "style={{ color: 'var(--foreground)'" },
  { from: /style=\{\{\s*color:\s*['"]#6B7280['"]/g, to: "style={{ color: 'var(--muted-foreground)'" },
  
  // Table row backgrounds
  { from: /backgroundColor:\s*['"]white['"]\s*}\}/g, to: "backgroundColor: 'var(--card)' }}" },
  
  // Inline style patterns
  { from: /'1px solid #E5E7EB'/g, to: "'1px solid var(--border)'" },
  { from: /"1px solid #E5E7EB"/g, to: "'1px solid var(--border)'" },
  { from: /'1px solid #D1D5DB'/g, to: "'1px solid var(--input)'" },
  { from: /"1px solid #D1D5DB"/g, to: "'1px solid var(--input)'" },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    } else {
      console.log(`⏭️  Skipped (no changes): ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist
      if (!['node_modules', '.next', 'dist', '.git'].includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src', 'app', '(dashboard)');
  
  console.log('🔍 Searching for pages to fix...\n');
  
  const files = findTsxFiles(srcDir);
  
  console.log(`📝 Found ${files.length} TSX files\n`);
  console.log('🔧 Processing files...\n');
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      fixedCount++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Complete! Fixed ${fixedCount} out of ${files.length} files`);
  console.log('='.repeat(50));
}

// Run if called directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

module.exports = { processFile, findTsxFiles };
