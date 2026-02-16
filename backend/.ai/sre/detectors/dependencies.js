/**
 * Dependencies Detector
 * Detects outdated dependencies using npm outdated
 */

const { execSync } = require('child_process');
const path = require('path');

class DependenciesDetector {
  /**
   * Detect outdated dependencies
   */
  async detect(config = {}) {
    const issues = [];
    const maxAgeDays = config.maxAgeDays || 180;

    try {
      // Check both backend and frontend
      const backendIssues = await this.checkDirectory(
        path.join(__dirname, '../../../'),
        'backend',
        config
      );
      const frontendIssues = await this.checkDirectory(
        path.join(__dirname, '../../../../frontend'),
        'frontend',
        config
      );

      issues.push(...backendIssues, ...frontendIssues);
    } catch (error) {
      console.error('   ⚠️  Error running dependencies detector:', error.message);
    }

    return issues;
  }

  /**
   * Check outdated dependencies in a directory
   */
  async checkDirectory(dir, label, config) {
    const issues = [];

    try {
      const result = execSync('npm outdated --json', {
        cwd: dir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // npm outdated exits with 0 if nothing is outdated
      if (!result || result.trim() === '') {
        return issues;
      }

      const outdated = JSON.parse(result);

      for (const [pkg, info] of Object.entries(outdated)) {
        const updateType = this.getUpdateType(info.current, info.latest);

        const issue = {
          id: `dependency-${label}-${pkg}`,
          type: 'dependency',
          category: 'dependencies',
          severity: updateType === 'major' ? 'high' : updateType === 'minor' ? 'medium' : 'low',
          title: `Outdated dependency: ${pkg}`,
          description: `${pkg} is outdated: ${info.current} → ${info.latest}`,
          package: pkg,
          currentVersion: info.current,
          wantedVersion: info.wanted,
          latestVersion: info.latest,
          updateType,
          location: label,
          autoFixable: updateType === 'patch' || (config.autoUpdateTypes?.includes(updateType) ?? false),
          fix: {
            type: 'npm-update',
            command: `npm update ${pkg}${updateType === 'major' ? `@latest` : ''}`
          }
        };

        // Major updates need review
        if (updateType === 'major') {
          issue.autoFixable = 'review';
        }

        issues.push(issue);
      }
    } catch (error) {
      // npm outdated exits with non-zero if outdated packages found
      // Try to parse the output
      try {
        if (error.stdout) {
          const outdated = JSON.parse(error.stdout);

          for (const [pkg, info] of Object.entries(outdated)) {
            const updateType = this.getUpdateType(info.current, info.latest);

            const issue = {
              id: `dependency-${label}-${pkg}`,
              type: 'dependency',
              category: 'dependencies',
              severity: updateType === 'major' ? 'high' : updateType === 'minor' ? 'medium' : 'low',
              title: `Outdated dependency: ${pkg}`,
              description: `${pkg} is outdated: ${info.current} → ${info.latest}`,
              package: pkg,
              currentVersion: info.current,
              latestVersion: info.latest,
              updateType,
              location: label,
              autoFixable: updateType === 'patch',
              fix: {
                type: 'npm-update',
                command: `npm update ${pkg}`
              }
            };

            if (updateType === 'major') {
              issue.autoFixable = 'review';
            }

            issues.push(issue);
          }
        }
      } catch (parseError) {
        // Could not parse, skip
      }
    }

    return issues;
  }

  /**
   * Determine update type (major, minor, patch)
   */
  getUpdateType(current, latest) {
    const currentParts = current.replace(/^[^0-9]*/, '').split('.').map(Number);
    const latestParts = latest.replace(/^[^0-9]*/, '').split('.').map(Number);

    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    if (latestParts[2] > currentParts[2]) return 'patch';

    return 'none';
  }
}

module.exports = new DependenciesDetector();
