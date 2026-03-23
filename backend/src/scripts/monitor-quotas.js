#!/usr/bin/env node
/**
 * Free Tier Quota Monitor Script
 * Checks all service quotas and Oracle Cloud resources
 * Can be run via cron: 0 6,18 * * * node /path/to/monitor-quotas.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:5001';
const REPORTS_DIR = path.join(__dirname, '../../../logs/quota-reports');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Make HTTP request
 */
function request(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get status emoji and color
 */
function getStatusDisplay(percent) {
  if (percent >= 95) return { emoji: '🔴', color: colors.red, label: 'CRITICAL' };
  if (percent >= 85) return { emoji: '🟧', color: colors.yellow, label: 'ALERT' };
  if (percent >= 70) return { emoji: '⚠️', color: colors.yellow, label: 'WARNING' };
  return { emoji: '✅', color: colors.green, label: 'OK' };
}

/**
 * Fetch quota status
 */
async function fetchQuotaStatus() {
  try {
    const data = await request(`${API_BASE}/api/monitoring/quota-status`);
    return data;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to fetch quota status: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Fetch Oracle Cloud status
 */
async function fetchOracleCloudStatus() {
  try {
    const data = await request(`${API_BASE}/api/monitoring/oracle-cloud`);
    return data;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to fetch Oracle Cloud status: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Generate markdown report
 */
function generateReport(quotaData, oracleData, timestamp) {
  const lines = [];

  lines.push('# Free Tier Quota Report');
  lines.push(`**Timestamp:** ${timestamp}`);

  let overallStatus = 'HEALTHY';
  const alerts = [];

  // API Services section
  if (quotaData && quotaData.services) {
    lines.push('');
    lines.push('## API Services');
    lines.push('');
    lines.push('| Service | Daily Usage | Daily Limit | % Used | Status | Next Reset |');
    lines.push('|---------|-------------|-------------|--------|--------|------------|');

    for (const [key, service] of Object.entries(quotaData.services)) {
      const percent = service.percent || 0;
      const status = getStatusDisplay(percent);
      const nextReset = service.nextReset ? new Date(service.nextReset).toLocaleString() : 'N/A';

      lines.push(`| ${service.name} | ${service.used} / ${service.limit} | ${service.limit} | ${percent}% | ${status.emoji} ${status.label} | ${nextReset} |`);

      if (percent >= 70) {
        alerts.push({ service: service.name, percent, type: 'API', status: status.label });
        if (percent >= 85) overallStatus = 'WARNING';
        if (percent >= 95) overallStatus = 'CRITICAL';
      }
    }
  }

  // Oracle Cloud section
  if (oracleData && oracleData.usage) {
    lines.push('');
    lines.push('## Oracle Cloud Always Free Resources');
    lines.push('');
    lines.push('| Resource | Allocated | Used | Available | % Used | Status |');
    lines.push('|----------|-----------|------|-----------|--------|--------|');

    const { cpu, ram, storage, bandwidth } = oracleData.usage;

    if (cpu) {
      const percent = (cpu.cores / cpu.limit) * 100;
      const status = getStatusDisplay(percent);
      lines.push(`| CPU | ${cpu.cores} cores | ${cpu.usagePercent}% active | ${cpu.available} cores | ${Math.round(percent)}% | ${status.emoji} ${status.label} |`);

      if (percent >= 70) {
        alerts.push({ service: 'Oracle CPU', percent, type: 'Infrastructure', status: status.label });
        if (percent >= 95) overallStatus = 'CRITICAL';
      }
    }

    if (ram) {
      const percent = (ram.totalGB / ram.limit) * 100;
      const status = getStatusDisplay(percent);
      lines.push(`| RAM | ${ram.totalGB}GB | ${ram.usedGB}GB | ${ram.freeGB}GB | ${Math.round(percent)}% | ${status.emoji} ${status.label} |`);

      if (percent >= 70) {
        alerts.push({ service: 'Oracle RAM', percent, type: 'Infrastructure', status: status.label });
        if (percent >= 95) overallStatus = 'CRITICAL';
      }
    }

    if (storage && storage.totalGB > 0) {
      const percent = storage.usagePercent || 0;
      const status = getStatusDisplay(percent);
      lines.push(`| Storage | ${storage.totalGB}GB | ${storage.usedGB}GB | ${storage.availableGB}GB | ${percent}% | ${status.emoji} ${status.label} |`);

      if (percent >= 70) {
        alerts.push({ service: 'Oracle Storage', percent, type: 'Infrastructure', status: status.label });
        if (percent >= 95) overallStatus = 'CRITICAL';
      }
    }

    if (bandwidth && bandwidth.monthlyLimit > 0) {
      const percent = bandwidth.usagePercent || 0;
      const status = getStatusDisplay(percent);
      lines.push(`| Bandwidth (Month) | ${bandwidth.monthlyLimit}GB | ${bandwidth.monthlyGB}GB | ${bandwidth.monthlyLimit - bandwidth.monthlyGB}GB | ${Math.round(percent)}% | ${status.emoji} ${status.label} |`);

      if (percent >= 70) {
        alerts.push({ service: 'Oracle Bandwidth', percent, type: 'Infrastructure', status: status.label });
        if (percent >= 95) overallStatus = 'CRITICAL';
      }
    }
  }

  // Alerts section
  lines.push('');
  lines.push('## 🚨 Alerts');
  lines.push('');

  if (alerts.length === 0) {
    lines.push('✅ All services within safe limits (< 70%)');
  } else {
    alerts.forEach(alert => {
      const { emoji } = getStatusDisplay(alert.percent);
      lines.push(`- ${emoji} **${alert.service}** ${alert.status}: ${Math.round(alert.percent)}% of limit`);
    });
  }

  // Recommendations
  if (alerts.length > 0) {
    lines.push('');
    lines.push('## 💡 Recommendations');
    lines.push('');

    alerts.forEach(alert => {
      if (alert.service.includes('HuggingFace')) {
        lines.push('**HuggingFace:**');
        lines.push('- Reduce AI-powered scraping frequency');
        lines.push('- Use cached ideology scores where possible');
        lines.push('');
      }
      if (alert.service.includes('Resend')) {
        lines.push('**Resend:**');
        lines.push('- Batch email notifications');
        lines.push('- Delay non-critical emails to next day');
        lines.push('');
      }
      if (alert.service.includes('Scraping')) {
        lines.push('**Scraping:**');
        lines.push('- Pause automated scraping until tomorrow');
        lines.push('- Prioritize high-value mediator profiles only');
        lines.push('');
      }
      if (alert.service.includes('Axiom')) {
        lines.push('**Axiom:**');
        lines.push('- Reduce log verbosity (only warn/error/security)');
        lines.push('- Clean up redundant log statements');
        lines.push('');
      }
      if (alert.service.includes('Oracle CPU') || alert.service.includes('Oracle RAM')) {
        lines.push('**Oracle Cloud Compute:**');
        lines.push('- Review Docker resource allocation in docker-compose.yml');
        lines.push('- Scale down non-essential services');
        lines.push('- Consider using MongoDB Atlas instead of local MongoDB');
        lines.push('');
      }
      if (alert.service.includes('Oracle Storage')) {
        lines.push('**Oracle Cloud Storage:**');
        lines.push('- Clean old logs: `find /var/log -name "*.log" -mtime +7 -delete`');
        lines.push('- Clean Docker: `docker system prune -a --volumes -f`');
        lines.push('- Remove unused Docker images');
        lines.push('');
      }
      if (alert.service.includes('Oracle Bandwidth')) {
        lines.push('**Oracle Cloud Bandwidth:**');
        lines.push('- Review traffic patterns for unusual spikes');
        lines.push('- Enable gzip compression for API responses');
        lines.push('- Optimize image/asset delivery');
        lines.push('');
      }
    });
  }

  lines.push('');
  lines.push(`**Overall Status:** ${overallStatus}`);

  return { report: lines.join('\n'), overallStatus, alerts };
}

/**
 * Print console summary
 */
function printSummary(quotaData, oracleData, overallStatus, alerts) {
  console.log('');
  console.log('================================');
  console.log(`QUOTA MONITOR - ${new Date().toLocaleString()}`);
  console.log('================================');
  console.log('');

  if (quotaData && quotaData.services) {
    console.log('API Services:');
    for (const [key, service] of Object.entries(quotaData.services)) {
      const percent = service.percent || 0;
      const status = getStatusDisplay(percent);
      console.log(`  ${status.emoji} ${service.name}: ${status.color}${percent}%${colors.reset} (${service.used}/${service.limit})`);
    }
    console.log('');
  }

  if (oracleData && oracleData.usage) {
    console.log('Oracle Cloud:');
    const { cpu, ram, storage, bandwidth } = oracleData.usage;

    if (cpu) {
      const percent = (cpu.cores / cpu.limit) * 100;
      const status = getStatusDisplay(percent);
      console.log(`  ${status.emoji} CPU: ${status.color}${Math.round(percent)}%${colors.reset} (${cpu.cores} cores allocated, ${cpu.usagePercent}% active)`);
    }

    if (ram) {
      const percent = (ram.totalGB / ram.limit) * 100;
      const status = getStatusDisplay(percent);
      console.log(`  ${status.emoji} RAM: ${status.color}${Math.round(percent)}%${colors.reset} (${ram.usedGB}GB / ${ram.totalGB}GB)`);
    }

    if (storage && storage.totalGB > 0) {
      const status = getStatusDisplay(storage.usagePercent);
      console.log(`  ${status.emoji} Storage: ${status.color}${storage.usagePercent}%${colors.reset} (${storage.usedGB}GB / ${storage.totalGB}GB)`);
    }

    if (bandwidth && bandwidth.monthlyLimit > 0) {
      const status = getStatusDisplay(bandwidth.usagePercent || 0);
      console.log(`  ${status.emoji} Bandwidth: ${status.color}${Math.round(bandwidth.usagePercent || 0)}%${colors.reset} (${bandwidth.monthlyGB}GB / ${bandwidth.monthlyLimit}GB)`);
    }
    console.log('');
  }

  const statusColor = overallStatus === 'CRITICAL' ? colors.red :
                      overallStatus === 'WARNING' ? colors.yellow :
                      colors.green;

  console.log(`Overall Status: ${statusColor}${overallStatus}${colors.reset}`);
  console.log('');

  if (alerts.length > 0) {
    console.log(`⚠️  ${alerts.length} service(s) require attention`);
  } else {
    console.log('✅ All systems within safe limits');
  }
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Ensure reports directory exists
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    // Fetch data
    console.log(`${colors.gray}Fetching quota data from ${API_BASE}...${colors.reset}`);
    const quotaData = await fetchQuotaStatus();
    const oracleData = await fetchOracleCloudStatus();

    if (!quotaData && !oracleData) {
      console.error(`${colors.red}❌ Backend not running at ${API_BASE}${colors.reset}`);
      console.log(`${colors.yellow}Start backend: cd backend && npm start${colors.reset}`);
      process.exit(1);
    }

    // Generate report
    const timestamp = new Date().toISOString();
    const { report, overallStatus, alerts } = generateReport(quotaData, oracleData, timestamp);

    // Save report
    const filename = `quota-report-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split(':').slice(0, 2).join('-')}.md`;
    const reportPath = path.join(REPORTS_DIR, filename);
    await fs.writeFile(reportPath, report);

    // Print summary
    printSummary(quotaData, oracleData, overallStatus, alerts);

    console.log(`${colors.gray}Full report saved: ${reportPath}${colors.reset}`);
    console.log('');

    // Exit with code based on status
    if (overallStatus === 'CRITICAL') {
      process.exit(2); // Critical status
    } else if (overallStatus === 'WARNING') {
      process.exit(1); // Warning status
    } else {
      process.exit(0); // Healthy
    }

  } catch (error) {
    console.error(`${colors.red}❌ Quota monitor failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(3);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
