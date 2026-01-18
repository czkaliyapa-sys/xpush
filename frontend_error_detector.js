#!/usr/bin/env node

/**
 * FRONTEND ERROR DETECTION SCRIPT
 * Identifies potential React/JavaScript errors and anti-patterns
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FRONTEND ERROR DETECTION ANALYSIS');
console.log('====================================');
console.log('Analyzing React components for common errors...\n');

// Configuration
const SRC_DIR = './src';
const EXTERNAL_COMPONENTS_DIR = './src/external_components';

const errorPatterns = [
  {
    name: 'Undefined State Initialization',
    pattern: /useState\(undefined\)/g,
    severity: 'HIGH',
    description: 'Initializing state with undefined can cause unexpected behavior'
  },
  {
    name: 'Null Dereference Risk',
    pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?![^(]*\))/g,
    severity: 'MEDIUM',
    description: 'Potential null/undefined property access without checks'
  },
  {
    name: 'Missing Error Boundaries',
    pattern: /try\s*\{/g,
    severity: 'LOW',
    description: 'Components with async operations should have error boundaries'
  },
  {
    name: 'Uncontrolled Components',
    pattern: /<input[^>]*>/g,
    severity: 'MEDIUM',
    description: 'Input elements without controlled values or onChange handlers'
  },
  {
    name: 'Missing Keys in Lists',
    pattern: /map\([^)]*\)\s*=>\s*<[a-zA-Z]/g,
    severity: 'HIGH',
    description: 'Array.map() without proper key props can cause rendering issues'
  },
  {
    name: 'Direct DOM Manipulation',
    pattern: /document\.|getElementById|querySelector/g,
    severity: 'MEDIUM',
    description: 'Direct DOM access bypasses React\'s virtual DOM benefits'
  },
  {
    name: 'Missing Dependencies in useEffect',
    pattern: /useEffect\(\s*\([^)]*\)/g,
    severity: 'HIGH',
    description: 'useEffect without dependency array or missing dependencies'
  },
  {
    name: 'Console Logs in Production',
    pattern: /console\.(log|warn|error)/g,
    severity: 'LOW',
    description: 'Console statements should be removed or conditional for production'
  }
];

const antiPatterns = [
  {
    name: 'Nested Ternary Operators',
    pattern: /\?[^:]*:[^?]*/g,
    severity: 'MEDIUM',
    description: 'Deeply nested ternary operators reduce readability'
  },
  {
    name: 'Large Inline Functions',
    pattern: /onClick=\{\([^)]*\)\s*=>\s*{[^}]{100,}/g,
    severity: 'LOW',
    description: 'Large inline functions should be extracted for better readability'
  },
  {
    name: 'Magic Numbers',
    pattern: /[^a-zA-Z0-9](\d{2,})[^a-zA-Z0-9]/g,
    severity: 'LOW',
    description: 'Numbers without explanation reduce code maintainability'
  }
];

let totalFiles = 0;
let filesWithIssues = 0;
let totalIssues = 0;

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    let fileIssues = [];
    
    // Check for error patterns
    errorPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        fileIssues.push({
          type: 'ERROR_PATTERN',
          pattern: pattern.name,
          severity: pattern.severity,
          count: matches.length,
          description: pattern.description
        });
        totalIssues += matches.length;
      }
    });
    
    // Check for anti-patterns
    antiPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        fileIssues.push({
          type: 'ANTI_PATTERN',
          pattern: pattern.name,
          severity: pattern.severity,
          count: matches.length,
          description: pattern.description
        });
        totalIssues += matches.length;
      }
    });
    
    totalFiles++;
    
    if (fileIssues.length > 0) {
      filesWithIssues++;
      console.log(`📄 ${relativePath}`);
      fileIssues.forEach(issue => {
        const severityEmoji = issue.severity === 'HIGH' ? '🔴' : 
                             issue.severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`   ${severityEmoji} ${issue.type}: ${issue.pattern} (${issue.count} occurrences)`);
        console.log(`      ${issue.description}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'build', 'dist', '.git'].includes(entry.name)) {
          walkDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        analyzeFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error walking directory ${dir}:`, error.message);
  }
}

// Analyze source directories
console.log('📁 Scanning src/ directory...');
walkDirectory(SRC_DIR);

console.log('📁 Scanning src/external_components/ directory...');
walkDirectory(EXTERNAL_COMPONENTS_DIR);

// Summary
console.log('\n📊 ANALYSIS SUMMARY');
console.log('===================');
console.log(`Total files analyzed: ${totalFiles}`);
console.log(`Files with issues: ${filesWithIssues}`);
console.log(`Total issues found: ${totalIssues}`);
console.log(`Health score: ${totalFiles > 0 ? Math.round(((totalFiles - filesWithIssues) / totalFiles) * 100) : 0}%`);

if (filesWithIssues === 0) {
  console.log('\n✅ EXCELLENT! No significant frontend errors detected.');
  console.log('Your React components appear to follow good practices.');
} else {
  console.log('\n⚠️  Some potential issues were found.');
  console.log('Review the flagged patterns and consider refactoring where appropriate.');
}

// Specific recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Add error boundaries for components with async operations');
console.log('2. Ensure all mapped lists have proper key props');
console.log('3. Review state initialization - avoid undefined values');
console.log('4. Extract large inline functions to named functions');
console.log('5. Add proper null/undefined checks for object property access');
console.log('6. Consider removing console.logs from production code');
console.log('7. Validate controlled component patterns for form inputs');