
/**
 * TimeZone Audit Script
 * 
 * This script can be used to identify non-compliant timezone usage in the codebase.
 * To use, run:
 *   npx ts-node src/scripts/timeZoneAudit.ts
 * 
 * Note: This requires ts-node to be installed. Install with:
 *   npm install -g ts-node
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_PATH = path.join(__dirname, '..');

// Patterns to look for
const PATTERNS = [
  {
    name: 'Direct Luxon Import',
    pattern: /import\s+{[^}]*?DateTime[^}]*?}\s+from\s+['"]luxon['"]/g,
    excludeFiles: ['timeZoneService.ts'],
    severity: 'HIGH'
  },
  {
    name: 'Direct date-fns Import',
    pattern: /import\s+.*\s+from\s+['"]date-fns['"]/g,
    excludeFiles: [],
    severity: 'HIGH'
  },
  {
    name: 'Direct date-fns-tz Import',
    pattern: /import\s+.*\s+from\s+['"]date-fns-tz['"]/g,
    excludeFiles: [],
    severity: 'HIGH'
  },
  {
    name: 'Native Date Timezone Methods',
    pattern: /\.(getTimezoneOffset|toLocaleDateString|toLocaleTimeString|toLocaleString)\(/g,
    excludeFiles: [],
    severity: 'MEDIUM'
  },
  {
    name: 'Deprecated Timezone Utils Import',
    pattern: /from\s+['"](\.\.\/)*packages\/core\/utils\/time['"]/g,
    excludeFiles: ['index.ts'],
    severity: 'MEDIUM'
  },
  {
    name: 'Moment.js Usage',
    pattern: /import\s+.*\s+from\s+['"]moment['"]/g,
    excludeFiles: [],
    severity: 'HIGH'
  },
  {
    name: 'DateTime Constructor',
    pattern: /new\s+DateTime\(/g,
    excludeFiles: [],
    severity: 'HIGH'
  }
];

interface FileMatch {
  file: string;
  matches: {
    pattern: string;
    line: string;
    lineNumber: number;
    severity: string;
  }[];
}

function scanDir(dir: string, results: FileMatch[] = [], depth = 0): FileMatch[] {
  // Skip node_modules
  if (dir.includes('node_modules')) {
    return results;
  }

  // Skip build output directories
  if (dir.includes('dist') || dir.includes('.next') || dir.includes('out')) {
    return results;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      scanDir(filePath, results, depth + 1);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) && 
              !file.endsWith('.d.ts')) {
      // Check TypeScript and JavaScript files except type declarations
      const fileName = path.basename(file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const fileMatches: FileMatch = {
        file: filePath.substring(SRC_PATH.length + 1),
        matches: []
      };
      
      for (const { name, pattern, excludeFiles, severity } of PATTERNS) {
        // Skip excluded files
        if (excludeFiles.includes(fileName)) {
          continue;
        }
        
        // Reset regex lastIndex
        pattern.lastIndex = 0;
        
        // Check each line for the pattern
        lines.forEach((line, lineNumber) => {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            fileMatches.matches.push({
              pattern: name,
              line: line.trim(),
              lineNumber: lineNumber + 1,
              severity
            });
          }
        });
      }
      
      if (fileMatches.matches.length > 0) {
        results.push(fileMatches);
      }
    }
  }
  
  return results;
}

function generateReport(results: FileMatch[]): void {
  console.log('\n=== TIMEZONE COMPLIANCE AUDIT REPORT ===\n');
  
  if (results.length === 0) {
    console.log('✅ No timezone compliance issues found!');
    return;
  }
  
  console.log(`Found ${results.length} files with potential timezone compliance issues:\n`);
  
  let highSeverityCount = 0;
  let mediumSeverityCount = 0;
  
  results.forEach(fileMatch => {
    console.log(`📁 ${fileMatch.file}`);
    
    fileMatch.matches.forEach(match => {
      if (match.severity === 'HIGH') {
        highSeverityCount++;
        console.log(`  ❌ [HIGH] Line ${match.lineNumber}: ${match.pattern}`);
      } else {
        mediumSeverityCount++;
        console.log(`  ⚠️ [MEDIUM] Line ${match.lineNumber}: ${match.pattern}`);
      }
      console.log(`     ${match.line}`);
    });
    
    console.log('');
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total files with issues: ${results.length}`);
  console.log(`High severity issues: ${highSeverityCount}`);
  console.log(`Medium severity issues: ${mediumSeverityCount}`);
  
  if (highSeverityCount > 0) {
    console.log(`\n❌ COMPLIANCE FAILURE: ${highSeverityCount} high severity issues found.`);
    console.log('Please fix these issues by using the TimeZoneService methods instead.');
  } else if (mediumSeverityCount > 0) {
    console.log(`\n⚠️ COMPLIANCE WARNING: ${mediumSeverityCount} medium severity issues found.`);
    console.log('Consider migrating these to TimeZoneService methods for better consistency.');
  }
}

// Run the audit
try {
  const results = scanDir(SRC_PATH);
  generateReport(results);
} catch (error) {
  console.error('Error running timezone compliance audit:', error);
  process.exit(1);
}
