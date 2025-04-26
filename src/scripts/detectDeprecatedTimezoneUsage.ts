
/**
 * Detect Deprecated Timezone Usage Script
 * 
 * This script can be used to identify components still using deprecated timezone utilities.
 * To use, run:
 *   npx ts-node src/scripts/detectDeprecatedTimezoneUsage.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_PATH = path.join(__dirname, '..');

// Patterns for deprecated imports
const DEPRECATED_PATTERNS = [
  {
    name: 'Deprecated timeZoneUtils import',
    pattern: /from\s+['"](\.\.\/)*utils\/timeZoneUtils['"]/g,
    severity: 'HIGH'
  },
  {
    name: 'Deprecated timeZoneDeprecated import',
    pattern: /from\s+['"](\.\.\/)*utils\/timeZoneDeprecated['"]/g,
    severity: 'HIGH'
  },
  {
    name: 'Deprecated timezoneOptions import',
    pattern: /from\s+['"](\.\.\/)*utils\/timezoneOptions['"]/g,
    severity: 'HIGH'
  },
  {
    name: 'Deprecated core/utils/time import',
    pattern: /from\s+['"](\.\.\/)*packages\/core\/utils\/time['"]/g,
    severity: 'HIGH'
  },
  {
    name: 'Old TimeZoneContext import',
    pattern: /from\s+['"](\.\.\/)*packages\/core\/contexts\/TimeZoneContext['"]/g,
    severity: 'HIGH'
  },
  {
    name: 'Old TimeZoneContext import from index',
    pattern: /import\s+{\s*.*useTimeZone.*}\s+from\s+['"](\.\.\/)*packages\/core\/contexts['"]/g,
    severity: 'MEDIUM'
  },
  {
    name: 'getUserTimeZone direct usage',
    pattern: /getUserTimeZone\(/g,
    excludeFiles: ['timeZoneService.ts'],
    severity: 'MEDIUM'
  },
  {
    name: 'formatTime12Hour direct usage',
    pattern: /formatTime12Hour\(/g,
    excludeFiles: ['timeZoneService.ts'],
    severity: 'MEDIUM'
  },
  {
    name: 'formatTimeInUserTimeZone direct usage',
    pattern: /formatTimeInUserTimeZone\(/g,
    excludeFiles: ['timeZoneService.ts'],
    severity: 'MEDIUM'
  },
  {
    name: 'convertDateTimeBetweenTimeZones direct usage',
    pattern: /convertDateTimeBetweenTimeZones\(/g,
    excludeFiles: ['timeZoneService.ts'],
    severity: 'MEDIUM'
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

function scanDir(dir: string, results: FileMatch[] = []): FileMatch[] {
  // Skip node_modules
  if (dir.includes('node_modules')) {
    return results;
  }

  // Skip build output directories
  if (dir.includes('dist') || dir.includes('.next') || dir.includes('out')) {
    return results;
  }

  // Check if directory exists
  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      scanDir(filePath, results);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) && 
              !file.endsWith('.d.ts')) {
      // Check TypeScript and JavaScript files except type declarations
      const fileName = path.basename(file);
      
      // Skip the deprecated files themselves
      if (['timeZoneUtils.ts', 'timeZoneDeprecated.ts', 'timezoneOptions.ts'].includes(fileName)) {
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const fileMatches: FileMatch = {
        file: filePath.substring(SRC_PATH.length + 1),
        matches: []
      };
      
      for (const { name, pattern, excludeFiles, severity } of DEPRECATED_PATTERNS) {
        // Skip excluded files
        if (excludeFiles && excludeFiles.includes(fileName)) {
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
  console.log('\n=== DEPRECATED TIMEZONE USAGE REPORT ===\n');
  
  if (results.length === 0) {
    console.log('✅ No deprecated timezone usage found!');
    return;
  }
  
  console.log(`Found ${results.length} files with deprecated timezone usage:\n`);
  
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
  console.log(`Total files with deprecated usage: ${results.length}`);
  console.log(`High severity issues: ${highSeverityCount}`);
  console.log(`Medium severity issues: ${mediumSeverityCount}`);
  
  if (highSeverityCount > 0) {
    console.log(`\n❌ MIGRATION INCOMPLETE: ${highSeverityCount} high severity issues found.`);
    console.log('Please fix these issues by using the TimeZoneService and TimeZoneContext properly.');
  } else if (mediumSeverityCount > 0) {
    console.log(`\n⚠️ MIGRATION ALMOST COMPLETE: ${mediumSeverityCount} medium severity issues found.`);
    console.log('Consider migrating these to TimeZoneService methods for better consistency.');
  }
}

// Run the detection
try {
  const results = scanDir(SRC_PATH);
  generateReport(results);
} catch (error) {
  console.error('Error running detection:', error);
  process.exit(1);
}

console.log('\nTo run this detection script:');
console.log('  npx ts-node src/scripts/detectDeprecatedTimezoneUsage.ts');
