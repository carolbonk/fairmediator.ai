/**
 * Code Quality Fixer
 * Automatically fixes code quality issues
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class CodeQualityFixer {
  /**
   * Fix a code quality issue
   */
  async fix(issue, options = {}) {
    const dryRun = options.dryRun || false;

    try {
      if (issue.category === 'logging' && issue.fix?.type === 'replace-logger') {
        return await this.fixConsoleLog(issue, dryRun);
      }

      if (issue.category === 'eslint' && issue.fix?.type === 'eslint-fix') {
        return await this.fixESLint(issue, dryRun);
      }

      return {
        success: false,
        error: `No fixer for category: ${issue.category}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fix console.log by replacing with logger
   */
  async fixConsoleLog(issue, dryRun) {
    try {
      const { file, oldContent, newContent } = issue.fix;

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          message: `Would replace console.log with logger in ${issue.file}`,
          change: {
            file: issue.file,
            line: issue.line,
            old: oldContent.trim(),
            new: newContent.trim()
          }
        };
      }

      // Read file
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // Replace the line
      lines[issue.line - 1] = newContent;

      // Check if logger import exists
      const hasLoggerImport = content.includes("import logger from");

      // Add logger import if missing
      if (!hasLoggerImport) {
        // Find the last import statement
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }

        if (lastImportIndex !== -1) {
          // Determine the correct path based on file location
          const depth = file.split('/src/')[1].split('/').length - 1;
          const relativePath = '../'.repeat(depth) + 'utils/logger';

          lines.splice(lastImportIndex + 1, 0, `import logger from '${relativePath}';`);
        }
      }

      // Write file
      fs.writeFileSync(file, lines.join('\n'), 'utf8');

      return {
        success: true,
        message: `Replaced console.log with logger in ${issue.file}:${issue.line}`,
        file: issue.file,
        line: issue.line
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fix ESLint violations
   */
  async fixESLint(issue, dryRun) {
    try {
      const dir = path.join(__dirname, '../../../../frontend');

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          message: `Would run: npm run lint:fix in frontend`,
          command: issue.fix.command
        };
      }

      // Run ESLint fix
      execSync(issue.fix.command, {
        cwd: dir,
        stdio: 'pipe'
      });

      return {
        success: true,
        message: `Fixed ESLint violations`,
        command: issue.fix.command
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CodeQualityFixer();
