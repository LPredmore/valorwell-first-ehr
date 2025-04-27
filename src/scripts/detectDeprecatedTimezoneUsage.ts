
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detect components using deprecated timezone utilities
 */
export const detectDeprecatedTimezoneUsage = () => {
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
      name: 'Direct DateTime manipulation',
      pattern: /new\s+Date\(\)\.toLocaleString\([^)]*\)/g,
      severity: 'MEDIUM'
    },
    {
      name: 'Old TimeZoneContext import',
      pattern: /from\s+['"](\.\.\/)*packages\/core\/contexts\/TimeZoneContext['"]/g,
      severity: 'HIGH'
    },
    {
      name: 'Clinician Availability Fields',
      pattern: /availability_(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/g,
      severity: 'HIGH'
    },
    {
      name: 'convertClinicianDataToAvailabilityBlocks usage',
      pattern: /convertClinicianDataToAvailabilityBlocks/g,
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

  const scanDir = (dir: string, results: FileMatch[] = []): FileMatch[] => {
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
        scanDir(filePath, results);
      } else if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) && 
                !file.endsWith('.d.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        const fileMatches: FileMatch = {
          file: filePath.substring(SRC_PATH.length + 1),
          matches: []
        };
        
        for (const { name, pattern, severity } of DEPRECATED_PATTERNS) {
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
  };

  const generateReport = (results: FileMatch[]): void => {
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
  };

  // Run the detection
  try {
    const results = scanDir(SRC_PATH);
    generateReport(results);
  } catch (error) {
    console.error('Error running detection:', error);
    process.exit(1);
  }
};
