#!/usr/bin/env node

/**
 * SRE Agent CLI
 * Command-line interface for running SRE agent
 *
 * Usage:
 *   npm run sre:scan                 # Scan for issues only
 *   npm run sre:fix                  # Scan and auto-fix
 *   npm run sre:fix -- --dry-run     # Preview fixes without applying
 */

const SREAgent = require('./agent');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  fix: args.includes('--fix') || process.argv.includes('sre:fix'),
  scanOnly: args.includes('--scan-only') || process.argv.includes('sre:scan')
};

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    SRE AGENT v1.0                          ║
║            Automated Issue Detection & Fixing              ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    const agent = new SREAgent();

    if (options.scanOnly) {
      // Scan only mode
      console.log('🔍 Running in scan-only mode (no fixes will be applied)\n');

      const issues = await agent.scan();
      const classified = agent.classify();

      console.log('\n' + '='.repeat(60));
      console.log('📊 SCAN RESULTS');
      console.log('='.repeat(60));
      console.log(`\n✅ Auto-fixable: ${classified.autoFixable.length}`);
      console.log(`⏸️  Needs review: ${classified.needsReview.length}`);
      console.log(`❌ Manual only: ${classified.manualOnly.length}`);
      console.log('\n💡 Run "npm run sre:fix" to apply auto-fixes');
      console.log('   Run "npm run sre:fix -- --dry-run" to preview changes\n');

    } else if (options.fix || options.dryRun) {
      // Fix mode
      if (options.dryRun) {
        console.log('🔄 Running in DRY RUN mode (no changes will be applied)\n');
      } else {
        console.log('🔧 Running in FIX mode (changes will be applied)\n');
      }

      await agent.run({
        dryRun: options.dryRun,
        backup: !options.dryRun
      });

    } else {
      // Default: scan and fix
      console.log('🔧 Running full scan and fix\n');
      await agent.run({ backup: true });
    }

    console.log('✅ SRE Agent completed successfully\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ SRE Agent failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run
main();
