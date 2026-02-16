/**
 * Code Quality Detector
 * Detects code quality issues: console.log, unused imports, formatting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class CodeQualityDetector {
  /**
   * Detect code quality issues
   */
  async detect() {
    const issues = [];

    // 1. Find console.log statements (production code only, not scripts)
    const consoleLogIssues = await this.detectConsoleLogs();
    issues.push(...consoleLogIssues);

    // 2. Find ESLint violations (if ESLint is configured)
    const eslintIssues = await this.detectESLintViolations();
    issues.push(...eslintIssues);

    return issues;
  }

  /**
   * Detect console.log statements in production code
   */
  async detectConsoleLogs() {
    const issues = [];
    const projectRoot = path.join(__dirname, '../../..');

    try {
      // Search in frontend src (excluding logger.js and test files)
      const frontendFiles = await glob('frontend/src/**/*.{js,jsx}', {
        cwd: projectRoot,
        ignore: [
          '**/logger.js',
          '**/sentry.js',
          '**/*.test.js',
          '**/*.spec.js',
          '**/test/**',
          '**/__tests__/**'
        ]
      });

      for (const file of frontendFiles) {
        const filePath = path.join(projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip commented lines
          if (line.trim().startsWith('//')) return;

          // Check for console.log
          if (line.includes('console.log')) {
            issues.push({
              id: `console-log-${file}-${index + 1}`,
              type: 'code-quality',
              category: 'logging',
              severity: 'low',
              title: `console.log in ${file}`,
              description: `Found console.log at line ${index + 1}`,
              file: file,
              line: index + 1,
              content: line.trim(),
              autoFixable: true,
              fix: {
                type: 'replace-logger',
                file: filePath,
                line: index + 1,
                oldContent: line,
                newContent: line.replace('console.log', 'logger.debug')
              }
            });
          }
        });
      }

      // Search in backend services (excluding scripts)
      const backendFiles = await glob('backend/src/services/**/*.js', {
        cwd: projectRoot,
        ignore: ['**/*.test.js', '**/*.spec.js']
      });

      for (const file of backendFiles) {
        const filePath = path.join(projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.trim().startsWith('//')) return;

          if (line.includes('console.log')) {
            issues.push({
              id: `console-log-${file}-${index + 1}`,
              type: 'code-quality',
              category: 'logging',
              severity: 'low',
              title: `console.log in ${file}`,
              description: `Found console.log at line ${index + 1}`,
              file: file,
              line: index + 1,
              content: line.trim(),
              autoFixable: false, // Backend needs proper logger setup first
              fix: null
            });
          }
        });
      }
    } catch (error) {
      console.error('   ⚠️  Error detecting console.log:', error.message);
    }

    return issues;
  }

  /**
   * Detect ESLint violations
   */
  async detectESLintViolations() {
    const issues = [];

    try {
      const projectRoot = path.join(__dirname, '../../..');
      const frontendDir = path.join(projectRoot, 'frontend');

      // Check if ESLint is configured
      if (
        !fs.existsSync(path.join(frontendDir, '.eslintrc.json')) &&
        !fs.existsSync(path.join(frontendDir, '.eslintrc.js'))
      ) {
        return issues;
      }

      // Run ESLint
      const result = execSync('npm run lint -- --format json', {
        cwd: frontendDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const eslintResults = JSON.parse(result);

      for (const fileResult of eslintResults) {
        if (fileResult.messages.length === 0) continue;

        for (const message of fileResult.messages) {
          // Skip warnings, only handle errors
          if (message.severity !== 2) continue;

          issues.push({
            id: `eslint-${fileResult.filePath}-${message.line}-${message.column}`,
            type: 'code-quality',
            category: 'eslint',
            severity: 'medium',
            title: `ESLint: ${message.ruleId}`,
            description: message.message,
            file: fileResult.filePath,
            line: message.line,
            column: message.column,
            rule: message.ruleId,
            autoFixable: message.fix != null,
            fix: message.fix
              ? {
                  type: 'eslint-fix',
                  command: 'npm run lint:fix',
                  location: 'frontend'
                }
              : null
          });
        }
      }
    } catch (error) {
      // ESLint not configured or no violations, skip
    }

    return issues;
  }
}

module.exports = new CodeQualityDetector();
