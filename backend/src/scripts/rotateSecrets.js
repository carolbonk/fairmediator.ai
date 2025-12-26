/**
 * Automated Secret Rotation Script
 * Rotate JWT secrets and other sensitive credentials
 *
 * Usage: node src/scripts/rotateSecrets.js [--dry-run]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRETS_TO_ROTATE = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET'
];

const ROTATION_SCHEDULE = {
  JWT_SECRET: 90, // days
  JWT_REFRESH_SECRET: 90,
  SESSION_SECRET: 180
};

/**
 * Generate a cryptographically secure random secret
 * @param {number} length - Length in bytes (default 32)
 * @returns {string} Hex string
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if secret needs rotation based on last rotation date
 * @param {string} secretName - Name of the secret
 * @param {Date} lastRotation - Last rotation date
 * @returns {boolean}
 */
function needsRotation(secretName, lastRotation) {
  if (!lastRotation) return true;

  const daysSinceRotation = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
  const rotationInterval = ROTATION_SCHEDULE[secretName];

  return daysSinceRotation >= rotationInterval;
}

/**
 * Rotate secrets
 * @param {boolean} dryRun - If true, only show what would be rotated
 */
async function rotateSecrets(dryRun = false) {
  console.log('🔐 Secret Rotation Tool');
  console.log('='.repeat(50));

  // Load rotation history
  const historyPath = path.join(__dirname, '../../.secret-rotation-history.json');
  let rotationHistory = {};

  try {
    if (fs.existsSync(historyPath)) {
      rotationHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (error) {
    console.warn('⚠️  Could not load rotation history');
  }

  const newSecrets = {};
  const toRotate = [];

  // Check each secret
  for (const secretName of SECRETS_TO_ROTATE) {
    const lastRotation = rotationHistory[secretName]
      ? new Date(rotationHistory[secretName].lastRotated)
      : null;

    const needs = needsRotation(secretName, lastRotation);

    if (needs) {
      toRotate.push(secretName);
      newSecrets[secretName] = generateSecret();

      console.log(`✅ ${secretName}: Needs rotation`);
      if (lastRotation) {
        const daysSince = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   Last rotated: ${daysSince} days ago`);
      } else {
        console.log(`   Last rotated: Never`);
      }
    } else {
      const daysSince = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`⏭️  ${secretName}: Not due for rotation (${daysSince} days ago)`);
    }
  }

  if (toRotate.length === 0) {
    console.log('\n✨ No secrets need rotation at this time');
    return;
  }

  console.log('\n' + '='.repeat(50));

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('\nThe following secrets would be rotated:');
    toRotate.forEach(name => {
      console.log(`  - ${name}`);
    });
    return;
  }

  console.log('\n🔄 Rotating secrets...\n');

  // Generate new .env file content
  console.log('New secrets generated:');
  console.log('─'.repeat(50));
  for (const [name, value] of Object.entries(newSecrets)) {
    console.log(`${name}=${value}`);

    // Update rotation history
    rotationHistory[name] = {
      lastRotated: new Date().toISOString(),
      rotatedBy: process.env.USER || 'automation'
    };
  }
  console.log('─'.repeat(50));

  // Save rotation history
  try {
    fs.writeFileSync(historyPath, JSON.stringify(rotationHistory, null, 2));
    console.log('\n✅ Rotation history updated');
  } catch (error) {
    console.error('❌ Failed to save rotation history:', error.message);
  }

  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Update your .env file with the new secrets above');
  console.log('2. Update your production environment variables (Render, AWS, etc.)');
  console.log('3. Restart your application servers');
  console.log('4. Monitor logs for any authentication issues');
  console.log('5. Users will need to log in again (JWTs invalidated)');

  console.log('\n📝 Recommended: Keep a backup of old secrets for 24-48 hours');
}

// Run the script
const isDryRun = process.argv.includes('--dry-run');
rotateSecrets(isDryRun).catch(error => {
  console.error('❌ Secret rotation failed:', error);
  process.exit(1);
});
