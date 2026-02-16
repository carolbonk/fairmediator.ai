/**
 * Security Fixer
 * Automatically fixes security vulnerabilities
 */

const { execSync } = require('child_process');
const path = require('path');

class SecurityFixer {
  /**
   * Fix a security issue
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

      if (issue.fix.type === 'npm-audit-fix') {
        if (dryRun) {
          return {
            success: true,
            dryRun: true,
            command: issue.fix.command,
            message: `Would run: ${issue.fix.command} in ${issue.location}`
          };
        }

        // Run the fix command
        execSync(issue.fix.command, {
          cwd: dir,
          stdio: 'pipe'
        });

        return {
          success: true,
          message: `Fixed ${issue.package} vulnerability`,
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
   * Fix all security issues in a batch
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

module.exports = new SecurityFixer();
