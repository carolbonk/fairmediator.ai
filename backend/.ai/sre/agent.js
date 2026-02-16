/**
 * SRE Agent - Automated Issue Detection and Fixing
 *
 * Orchestrates detection, classification, and automated fixing of common issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const securityDetector = require('./detectors/security');
const dependenciesDetector = require('./detectors/dependencies');
const codeQualityDetector = require('./detectors/codeQuality');
const securityFixer = require('./fixers/security');
const dependenciesFixer = require('./fixers/dependencies');
const codeQualityFixer = require('./fixers/codeQuality');
const reporter = require('./reporter');

class SREAgent {
  constructor(config = null) {
    this.config = config || this.loadConfig();
    this.issues = [];
    this.fixes = [];
    this.errors = [];
  }

  /**
   * Load configuration
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      autoFix: { enabled: true, dryRun: false, createBackup: true },
      detectors: {
        security: { enabled: true },
        dependencies: { enabled: true },
        codeQuality: { enabled: true }
      }
    };
  }

  /**
   * Main execution: Scan for issues
   */
  async scan() {
    console.log('\n🔍 SRE Agent: Starting scan...\n');

    const detectors = [];

    // Security vulnerabilities
    if (this.config.detectors.security?.enabled) {
      console.log('📡 Running security detector...');
      detectors.push(
        securityDetector.detect().then(issues => {
          console.log(`   Found ${issues.length} security issues`);
          return issues;
        })
      );
    }

    // Outdated dependencies
    if (this.config.detectors.dependencies?.enabled) {
      console.log('📡 Running dependencies detector...');
      detectors.push(
        dependenciesDetector.detect(this.config.detectors.dependencies).then(issues => {
          console.log(`   Found ${issues.length} dependency issues`);
          return issues;
        })
      );
    }

    // Code quality
    if (this.config.detectors.codeQuality?.enabled) {
      console.log('📡 Running code quality detector...');
      detectors.push(
        codeQualityDetector.detect().then(issues => {
          console.log(`   Found ${issues.length} code quality issues`);
          return issues;
        })
      );
    }

    // Wait for all detectors to complete
    const results = await Promise.all(detectors);
    this.issues = results.flat();

    console.log(`\n✅ Scan complete: ${this.issues.length} total issues found\n`);

    return this.issues;
  }

  /**
   * Classify issues as auto-fixable or needs review
   */
  classify() {
    const classified = {
      autoFixable: [],
      needsReview: [],
      manualOnly: []
    };

    for (const issue of this.issues) {
      if (issue.autoFixable === true) {
        classified.autoFixable.push(issue);
      } else if (issue.autoFixable === 'review') {
        classified.needsReview.push(issue);
      } else {
        classified.manualOnly.push(issue);
      }
    }

    return classified;
  }

  /**
   * Apply automatic fixes
   */
  async fix(options = {}) {
    const dryRun = options.dryRun ?? this.config.autoFix.dryRun;
    const createBackup = options.backup ?? this.config.autoFix.createBackup;

    if (dryRun) {
      console.log('\n🔄 DRY RUN MODE - No changes will be applied\n');
    }

    const classified = this.classify();

    console.log('\n🔧 Applying automatic fixes...\n');
    console.log(`📊 Auto-fixable: ${classified.autoFixable.length}`);
    console.log(`⏸️  Needs review: ${classified.needsReview.length}`);
    console.log(`❌ Manual only: ${classified.manualOnly.length}\n`);

    // Create backup if enabled
    if (createBackup && !dryRun) {
      this.createBackup();
    }

    // Apply fixes for auto-fixable issues
    for (const issue of classified.autoFixable) {
      try {
        let result;

        switch (issue.type) {
          case 'security':
            result = await securityFixer.fix(issue, { dryRun });
            break;
          case 'dependency':
            result = await dependenciesFixer.fix(issue, { dryRun });
            break;
          case 'code-quality':
            result = await codeQualityFixer.fix(issue, { dryRun });
            break;
          default:
            console.log(`   ⏭️  No fixer available for: ${issue.type}`);
            continue;
        }

        if (result.success) {
          this.fixes.push({ issue, result });
          console.log(`   ✅ Fixed: ${issue.title}`);
        } else {
          this.errors.push({ issue, error: result.error });
          console.log(`   ❌ Failed: ${issue.title} - ${result.error}`);
        }
      } catch (error) {
        this.errors.push({ issue, error: error.message });
        console.log(`   ❌ Error fixing ${issue.title}: ${error.message}`);
      }
    }

    console.log(`\n✅ Applied ${this.fixes.length} fixes`);
    if (this.errors.length > 0) {
      console.log(`⚠️  ${this.errors.length} fixes failed`);
    }

    return {
      fixed: this.fixes,
      errors: this.errors,
      needsReview: classified.needsReview,
      manualOnly: classified.manualOnly
    };
  }

  /**
   * Create git backup before applying fixes
   */
  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const branchName = `sre-backup-${timestamp}`;

      execSync(`git add -A`, { stdio: 'pipe' });
      execSync(`git commit -m "SRE Agent backup before auto-fixes"`, { stdio: 'pipe' });

      console.log(`📦 Created backup commit\n`);
    } catch (error) {
      console.log(`⚠️  Could not create backup: ${error.message}\n`);
    }
  }

  /**
   * Generate report
   */
  async generateReport(results) {
    return reporter.generate({
      issues: this.issues,
      fixes: results.fixed,
      errors: results.errors,
      needsReview: results.needsReview,
      manualOnly: results.manualOnly,
      config: this.config
    });
  }

  /**
   * Main entry point
   */
  async run(options = {}) {
    const startTime = Date.now();

    try {
      // 1. Scan for issues
      await this.scan();

      // 2. Apply fixes if enabled
      let results = null;
      if (this.config.autoFix.enabled) {
        results = await this.fix(options);
      } else {
        const classified = this.classify();
        results = {
          fixed: [],
          errors: [],
          needsReview: classified.needsReview,
          manualOnly: classified.manualOnly
        };
      }

      // 3. Generate report
      const report = await this.generateReport(results);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️  Completed in ${duration}s\n`);

      return {
        issues: this.issues,
        results,
        report
      };
    } catch (error) {
      console.error('\n❌ SRE Agent failed:', error.message);
      throw error;
    }
  }
}

module.exports = SREAgent;
