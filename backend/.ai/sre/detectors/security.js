/**
 * Security Detector
 * Detects security vulnerabilities using npm audit
 */

const { execSync } = require('child_process');
const path = require('path');

class SecurityDetector {
  /**
   * Detect security vulnerabilities
   */
  async detect() {
    const issues = [];

    try {
      // Run npm audit in both backend and frontend
      const backendIssues = await this.auditDirectory(
        path.join(__dirname, '../../../'),
        'backend'
      );
      const frontendIssues = await this.auditDirectory(
        path.join(__dirname, '../../../../frontend'),
        'frontend'
      );

      issues.push(...backendIssues, ...frontendIssues);
    } catch (error) {
      console.error('   ⚠️  Error running security detector:', error.message);
    }

    return issues;
  }

  /**
   * Run npm audit in a specific directory
   */
  async auditDirectory(dir, label) {
    const issues = [];

    try {
      const result = execSync('npm audit --json', {
        cwd: dir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const audit = JSON.parse(result);

      // npm audit returns vulnerabilities
      if (audit.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
          const issue = {
            id: `security-${label}-${pkg}`,
            type: 'security',
            category: 'security',
            severity: vuln.severity || 'unknown',
            title: `${vuln.severity} vulnerability in ${pkg}`,
            description: vuln.via[0]?.title || vuln.via[0] || 'Security vulnerability detected',
            package: pkg,
            currentVersion: vuln.range || 'unknown',
            location: label,
            autoFixable: vuln.fixAvailable ? true : false,
            fix: vuln.fixAvailable
              ? {
                  type: 'npm-audit-fix',
                  command: vuln.fixAvailable.name
                    ? `npm update ${vuln.fixAvailable.name}`
                    : 'npm audit fix',
                  breaking: vuln.fixAvailable.isSemVerMajor || false
                }
              : null,
            metadata: {
              cwe: vuln.via[0]?.cwe || [],
              cvss: vuln.via[0]?.cvss || null,
              url: vuln.via[0]?.url || null
            }
          };

          // Only auto-fix non-breaking changes
          if (issue.fix && issue.fix.breaking) {
            issue.autoFixable = 'review';
          }

          issues.push(issue);
        }
      }
    } catch (error) {
      // npm audit exits with non-zero if vulnerabilities found
      // Try to parse the output anyway
      try {
        const audit = JSON.parse(error.stdout || '{}');
        if (audit.vulnerabilities) {
          // Same logic as above
          for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
            const issue = {
              id: `security-${label}-${pkg}`,
              type: 'security',
              category: 'security',
              severity: vuln.severity || 'unknown',
              title: `${vuln.severity} vulnerability in ${pkg}`,
              description: vuln.via[0]?.title || vuln.via[0] || 'Security vulnerability detected',
              package: pkg,
              currentVersion: vuln.range || 'unknown',
              location: label,
              autoFixable: vuln.fixAvailable && !vuln.fixAvailable.isSemVerMajor,
              fix: vuln.fixAvailable
                ? {
                    type: 'npm-audit-fix',
                    command: vuln.fixAvailable.name
                      ? `npm update ${vuln.fixAvailable.name}`
                      : 'npm audit fix'
                  }
                : null
            };

            issues.push(issue);
          }
        }
      } catch (parseError) {
        console.error(`   ⚠️  Could not parse npm audit output for ${label}`);
      }
    }

    return issues;
  }
}

module.exports = new SecurityDetector();
