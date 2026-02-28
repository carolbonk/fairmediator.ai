/**
 * Oracle Cloud Always Free Resource Monitor
 * Tracks CPU, RAM, Storage, and Bandwidth to prevent exceeding free tier limits
 *
 * Always Free Limits:
 * - CPU: 4 ARM cores (Ampere A1)
 * - RAM: 24GB
 * - Block Storage: 200GB
 * - Bandwidth: 10TB/month (340GB/day average)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../../config/logger');
const os = require('os');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// Always Free Limits
const ORACLE_LIMITS = {
  CPU_CORES: 4,              // Maximum ARM cores
  RAM_GB: 24,                // Maximum RAM in GB
  STORAGE_GB: 200,           // Maximum block storage in GB
  BANDWIDTH_GB_MONTHLY: 10240, // 10TB in GB
  BANDWIDTH_GB_DAILY: 340    // ~10TB ÷ 30 days
};

// Alert thresholds
const THRESHOLDS = {
  WARNING: 0.70,   // 70%
  ALERT: 0.85,     // 85%
  CRITICAL: 0.95   // 95%
};

/**
 * Get current CPU usage (percentage)
 */
async function getCPUUsage() {
  try {
    const cpus = os.cpus();
    const numCores = cpus.length;

    // Calculate average CPU usage across all cores
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / numCores;
    const total = totalTick / numCores;
    const usage = 100 - ~~(100 * idle / total);

    return {
      cores: numCores,
      usagePercent: usage,
      limit: ORACLE_LIMITS.CPU_CORES,
      available: ORACLE_LIMITS.CPU_CORES - numCores,
      status: getStatus(numCores / ORACLE_LIMITS.CPU_CORES)
    };
  } catch (error) {
    logger.error('Failed to get CPU usage', { error: error.message });
    return { cores: 0, usagePercent: 0, error: error.message };
  }
}

/**
 * Get current RAM usage
 */
async function getRAMUsage() {
  try {
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;

    const totalGB = totalRAM / (1024 ** 3);
    const usedGB = usedRAM / (1024 ** 3);
    const freeGB = freeRAM / (1024 ** 3);
    const usagePercent = (usedGB / totalGB) * 100;

    return {
      totalGB: Math.round(totalGB * 100) / 100,
      usedGB: Math.round(usedGB * 100) / 100,
      freeGB: Math.round(freeGB * 100) / 100,
      usagePercent: Math.round(usagePercent * 100) / 100,
      limit: ORACLE_LIMITS.RAM_GB,
      available: ORACLE_LIMITS.RAM_GB - totalGB,
      status: getStatus(totalGB / ORACLE_LIMITS.RAM_GB)
    };
  } catch (error) {
    logger.error('Failed to get RAM usage', { error: error.message });
    return { totalGB: 0, usedGB: 0, error: error.message };
  }
}

/**
 * Get disk storage usage
 */
async function getStorageUsage() {
  try {
    // Try to get disk usage from df command (Linux/Unix)
    const { stdout } = await execAsync('df -BG / | tail -1');
    const parts = stdout.trim().split(/\s+/);

    const totalGB = parseInt(parts[1]);
    const usedGB = parseInt(parts[2]);
    const availableGB = parseInt(parts[3]);
    const usagePercent = parseInt(parts[4]);

    return {
      totalGB,
      usedGB,
      availableGB,
      usagePercent,
      limit: ORACLE_LIMITS.STORAGE_GB,
      available: ORACLE_LIMITS.STORAGE_GB - totalGB,
      status: getStatus(totalGB / ORACLE_LIMITS.STORAGE_GB)
    };
  } catch (error) {
    // Fallback for non-Linux systems
    logger.warn('Could not get disk usage via df command', { error: error.message });
    return {
      totalGB: 0,
      usedGB: 0,
      availableGB: 0,
      usagePercent: 0,
      error: 'Disk monitoring only available on Linux/Unix',
      status: 'UNKNOWN'
    };
  }
}

/**
 * Get network bandwidth usage (requires external tracking)
 * This is a placeholder - actual implementation would need to track via:
 * 1. Oracle Cloud API
 * 2. iptables/nftables packet counting
 * 3. vnstat or similar network monitoring tool
 */
async function getBandwidthUsage() {
  try {
    // Check if we have a bandwidth tracking file
    const trackingFile = '/var/log/oracle-bandwidth.json';

    try {
      const data = await fs.readFile(trackingFile, 'utf-8');
      const bandwidth = JSON.parse(data);

      const usagePercent = (bandwidth.monthlyGB / ORACLE_LIMITS.BANDWIDTH_GB_MONTHLY) * 100;

      return {
        dailyGB: bandwidth.dailyGB || 0,
        monthlyGB: bandwidth.monthlyGB || 0,
        dailyLimit: ORACLE_LIMITS.BANDWIDTH_GB_DAILY,
        monthlyLimit: ORACLE_LIMITS.BANDWIDTH_GB_MONTHLY,
        usagePercent: Math.round(usagePercent * 100) / 100,
        status: getStatus(bandwidth.monthlyGB / ORACLE_LIMITS.BANDWIDTH_GB_MONTHLY),
        lastUpdated: bandwidth.lastUpdated
      };
    } catch (readError) {
      // File doesn't exist - bandwidth tracking not set up
      return {
        dailyGB: 0,
        monthlyGB: 0,
        dailyLimit: ORACLE_LIMITS.BANDWIDTH_GB_DAILY,
        monthlyLimit: ORACLE_LIMITS.BANDWIDTH_GB_MONTHLY,
        usagePercent: 0,
        status: 'NOT_TRACKED',
        warning: 'Bandwidth tracking not configured. Install vnstat or configure iptables monitoring.'
      };
    }
  } catch (error) {
    logger.error('Failed to get bandwidth usage', { error: error.message });
    return { dailyGB: 0, monthlyGB: 0, error: error.message };
  }
}

/**
 * Get status based on usage percentage
 */
function getStatus(ratio) {
  if (ratio >= 1.0) return 'EXCEEDED';
  if (ratio >= THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (ratio >= THRESHOLDS.ALERT) return 'ALERT';
  if (ratio >= THRESHOLDS.WARNING) return 'WARNING';
  return 'OK';
}

/**
 * Get complete Oracle Cloud resource dashboard
 */
async function getResourceDashboard() {
  const [cpu, ram, storage, bandwidth] = await Promise.all([
    getCPUUsage(),
    getRAMUsage(),
    getStorageUsage(),
    getBandwidthUsage()
  ]);

  const criticalAlerts = [];

  if (cpu.status === 'CRITICAL' || cpu.status === 'EXCEEDED') {
    criticalAlerts.push(`CPU: ${cpu.cores}/${cpu.limit} cores allocated`);
  }
  if (ram.status === 'CRITICAL' || ram.status === 'EXCEEDED') {
    criticalAlerts.push(`RAM: ${ram.totalGB}GB/${ram.limit}GB allocated`);
  }
  if (storage.status === 'CRITICAL' || storage.status === 'EXCEEDED') {
    criticalAlerts.push(`Storage: ${storage.totalGB}GB/${storage.limit}GB used`);
  }
  if (bandwidth.status === 'CRITICAL' || bandwidth.status === 'EXCEEDED') {
    criticalAlerts.push(`Bandwidth: ${bandwidth.monthlyGB}GB/${bandwidth.monthlyLimit}GB this month`);
  }

  return {
    timestamp: new Date().toISOString(),
    limits: ORACLE_LIMITS,
    usage: {
      cpu,
      ram,
      storage,
      bandwidth
    },
    alerts: {
      critical: criticalAlerts,
      hasCritical: criticalAlerts.length > 0
    },
    summary: {
      withinLimits: criticalAlerts.length === 0,
      message: criticalAlerts.length === 0
        ? 'All resources within Oracle Cloud Always Free limits'
        : `⚠️  ${criticalAlerts.length} resource(s) at or exceeding limits`
    }
  };
}

/**
 * Check if safe to deploy/scale
 */
async function isSafeToDeploy() {
  const dashboard = await getResourceDashboard();

  if (dashboard.alerts.hasCritical) {
    return {
      safe: false,
      reason: dashboard.summary.message,
      alerts: dashboard.alerts.critical
    };
  }

  return {
    safe: true,
    message: 'Safe to deploy - all resources within limits'
  };
}

module.exports = {
  getCPUUsage,
  getRAMUsage,
  getStorageUsage,
  getBandwidthUsage,
  getResourceDashboard,
  isSafeToDeploy,
  ORACLE_LIMITS,
  THRESHOLDS
};
