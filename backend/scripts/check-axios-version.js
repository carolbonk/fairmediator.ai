#!/usr/bin/env node

/**
 * Security script to prevent installation of vulnerable axios versions
 * Blocks axios versions 1.14.1 and 0.30.4 due to known vulnerabilities
 */

const BLOCKED_VERSIONS = ['1.14.1', '0.30.4'];
const PACKAGE_NAME = 'axios';

function checkPackageLock() {
  const fs = require('fs');
  const path = require('path');

  const lockFiles = [
    'package-lock.json',
    'frontend/package-lock.json',
    'backend/package-lock.json'
  ];

  let foundVulnerable = false;

  for (const lockFile of lockFiles) {
    const lockPath = path.join(process.cwd(), lockFile);

    if (!fs.existsSync(lockPath)) {
      continue;
    }

    try {
      const lockContent = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

      // Check both old and new package-lock.json formats
      const packages = lockContent.packages || {};
      const dependencies = lockContent.dependencies || {};

      // Check packages format (npm 7+)
      for (const [pkgPath, pkgData] of Object.entries(packages)) {
        if (pkgPath.includes(PACKAGE_NAME) && pkgData.version) {
          if (BLOCKED_VERSIONS.includes(pkgData.version)) {
            console.error(`\n❌ SECURITY BLOCK: Found vulnerable ${PACKAGE_NAME}@${pkgData.version} in ${lockFile}`);
            console.error(`   This version is blocked due to security vulnerabilities.`);
            console.error(`   Allowed version: 1.13.5\n`);
            foundVulnerable = true;
          }
        }
      }

      // Check dependencies format (npm 6 and below)
      function checkDeps(deps, prefix = '') {
        for (const [name, data] of Object.entries(deps)) {
          if (name === PACKAGE_NAME && data.version) {
            if (BLOCKED_VERSIONS.includes(data.version)) {
              console.error(`\n❌ SECURITY BLOCK: Found vulnerable ${PACKAGE_NAME}@${data.version} in ${lockFile}`);
              console.error(`   This version is blocked due to security vulnerabilities.`);
              console.error(`   Allowed version: 1.13.5\n`);
              foundVulnerable = true;
            }
          }
          if (data.dependencies) {
            checkDeps(data.dependencies, `${prefix}${name}/`);
          }
        }
      }

      checkDeps(dependencies);

    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse ${lockFile}: ${error.message}`);
    }
  }

  if (foundVulnerable) {
    console.error('Installation blocked. Please run: npm install axios@1.13.5\n');
    process.exit(1);
  }
}

function checkNodeModules() {
  const fs = require('fs');
  const path = require('path');

  const nodeModulesPaths = [
    'node_modules/axios/package.json',
    'frontend/node_modules/axios/package.json',
    'backend/node_modules/axios/package.json'
  ];

  let foundVulnerable = false;

  for (const modulePath of nodeModulesPaths) {
    const fullPath = path.join(process.cwd(), modulePath);

    if (fs.existsSync(fullPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        if (BLOCKED_VERSIONS.includes(pkg.version)) {
          console.error(`\n❌ SECURITY BLOCK: Found vulnerable ${PACKAGE_NAME}@${pkg.version} installed`);
          console.error(`   Location: ${modulePath}`);
          console.error(`   This version must be removed immediately.`);
          console.error(`   Run: npm install axios@1.13.5\n`);
          foundVulnerable = true;
        }
      } catch (error) {
        // Skip if can't read
      }
    }
  }

  if (foundVulnerable) {
    process.exit(1);
  }
}

// Run checks
console.log('🔒 Checking for blocked axios versions...');
checkPackageLock();
checkNodeModules();
console.log('✅ No blocked axios versions detected.\n');
