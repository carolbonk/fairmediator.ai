/**
 * Dependencies Fixer
 * Automatically updates outdated dependencies
 */

const { execSync } = require('child_process');
const path = require('path');

class DependenciesFixer {
  /**
   * Fix a dependency issue
   */
  async fix(issue, options = {}) {
    const dryRun = options.dryRun || false;

    try {
      if (!issue.fix) {
        return {
          success: false,
          error: 'No fix available for this issue'
        };
      }

      const dir =
        issue.location === 'backend'
          ? path.join(__dirname, '../../../')
          : path.join(__dirname, '../../../../frontend');

      if (issue.fix.type === 'npm-update') {
        if (dryRun) {
          return {
            success: true,
            dryRun: true,
            command: issue.fix.command,
            message: `Would run: ${issue.fix.command} in ${issue.location}`,
            updateType: issue.updateType,
            versions: `${issue.currentVersion} → ${issue.latestVersion}`
          };
        }

        // Only auto-fix patch updates (safest)
        if (issue.updateType !== 'patch') {
          return {
            success: false,
            error: `${issue.updateType} update requires manual review`
          };
        }

        // Run the update command
        execSync(issue.fix.command, {
          cwd: dir,
          stdio: 'pipe'
        });

        return {
          success: true,
          message: `Updated ${issue.package} from ${issue.currentVersion} to ${issue.latestVersion}`,
          command: issue.fix.command
        };
      }

      return {
        success: false,
        error: `Unknown fix type: ${issue.fix.type}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fix all dependency issues in a batch
   */
  async fixBatch(issues, options = {}) {
    const results = [];

    for (const issue of issues) {
      const result = await this.fix(issue, options);
      results.push({ issue, result });
    }

    return results;
  }
}

module.exports = new DependenciesFixer();
