/**
 * SRE Reporter
 * Generates reports for scan and fix operations
 */

const fs = require('fs');
const path = require('path');

class Reporter {
  /**
   * Generate a comprehensive report
   */
  generate(data) {
    const {
      issues = [],
      fixes = [],
      errors = [],
      needsReview = [],
      manualOnly = [],
      config = {}
    } = data;

    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: this.generateSummary(issues, fixes, errors, needsReview, manualOnly),
      issues: this.categorizeIssues(issues),
      fixes: fixes.map(f => this.formatFix(f)),
      errors: errors.map(e => this.formatError(e)),
      needsReview: needsReview.map(i => this.formatIssue(i)),
      manualOnly: manualOnly.map(i => this.formatIssue(i)),
      recommendations: this.generateRecommendations(issues, fixes, needsReview)
    };

    // Write report to file
    this.writeReport(report);

    // Print console summary
    this.printConsoleSummary(report);

    return report;
  }

  /**
   * Generate summary statistics
   */
  generateSummary(issues, fixes, errors, needsReview, manualOnly) {
    return {
      total_issues: issues.length,
      auto_fixed: fixes.length,
      fix_errors: errors.length,
      needs_review: needsReview.length,
      manual_only: manualOnly.length,
      by_severity: this.countBySeverity(issues),
      by_category: this.countByCategory(issues)
    };
  }

  /**
   * Count issues by severity
   */
  countBySeverity(issues) {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0
    };

    for (const issue of issues) {
      const severity = issue.severity || 'unknown';
      counts[severity] = (counts[severity] || 0) + 1;
    }

    return counts;
  }

  /**
   * Count issues by category
   */
  countByCategory(issues) {
    const counts = {};

    for (const issue of issues) {
      const category = issue.category || 'unknown';
      counts[category] = (counts[category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Categorize issues
   */
  categorizeIssues(issues) {
    return {
      security: issues.filter(i => i.type === 'security'),
      dependencies: issues.filter(i => i.type === 'dependency'),
      code_quality: issues.filter(i => i.type === 'code-quality')
    };
  }

  /**
   * Format fix for report
   */
  formatFix(fix) {
    return {
      id: fix.issue.id,
      title: fix.issue.title,
      type: fix.issue.type,
      severity: fix.issue.severity,
      applied: fix.result.success,
      message: fix.result.message
    };
  }

  /**
   * Format error for report
   */
  formatError(error) {
    return {
      id: error.issue.id,
      title: error.issue.title,
      error: error.error
    };
  }

  /**
   * Format issue for report
   */
  formatIssue(issue) {
    return {
      id: issue.id,
      title: issue.title,
      type: issue.type,
      severity: issue.severity,
      description: issue.description
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(issues, fixes, needsReview) {
    const recommendations = [];

    if (needsReview.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Review and manually apply fixes',
        details: `${needsReview.length} issues need human review before applying fixes`
      });
    }

    const securityIssues = issues.filter(i => i.type === 'security' && !fixes.find(f => f.issue.id === i.id));
    if (securityIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Address security vulnerabilities',
        details: `${securityIssues.length} security issues remain unfixed`
      });
    }

    const majorUpdates = needsReview.filter(i => i.updateType === 'major');
    if (majorUpdates.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Plan major dependency updates',
        details: `${majorUpdates.length} packages have major version updates available`
      });
    }

    return recommendations;
  }

  /**
   * Write report to file
   */
  writeReport(report) {
    try {
      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const filename = `sre-report-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

      console.log(`\n📄 Report saved: ${filepath}\n`);
    } catch (error) {
      console.error('⚠️  Could not write report file:', error.message);
    }
  }

  /**
   * Print console summary
   */
  printConsoleSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SRE AGENT REPORT');
    console.log('='.repeat(60));

    const { summary } = report;

    console.log('\n📈 Summary:');
    console.log(`   Total issues found: ${summary.total_issues}`);
    console.log(`   Auto-fixed: ${summary.auto_fixed}`);
    console.log(`   Failed fixes: ${summary.fix_errors}`);
    console.log(`   Needs review: ${summary.needs_review}`);
    console.log(`   Manual only: ${summary.manual_only}`);

    if (summary.total_issues > 0) {
      console.log('\n🔍 By Severity:');
      for (const [severity, count] of Object.entries(summary.by_severity)) {
        if (count > 0) {
          const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
          console.log(`   ${emoji} ${severity}: ${count}`);
        }
      }

      console.log('\n📦 By Category:');
      for (const [category, count] of Object.entries(summary.by_category)) {
        if (count > 0) {
          console.log(`   • ${category}: ${count}`);
        }
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of report.recommendations) {
        const emoji = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : '🟡';
        console.log(`   ${emoji} ${rec.action}`);
        console.log(`      ${rec.details}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

module.exports = new Reporter();
