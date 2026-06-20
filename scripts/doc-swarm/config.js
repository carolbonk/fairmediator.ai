/**
 * Doc-swarm configuration.
 *
 * Encodes the invariants the detector enforces. Everything here is checked
 * deterministically (no AI) against the actual filesystem, so adding a rule
 * here makes the free detector catch a new class of doc drift forever.
 */

module.exports = {
  // The docs the swarm owns. Detector reads these from the repo root.
  docFiles: [
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'context.md',
    'PRODUCT_ARCHITECTURE.md',
    'PROJECT_AUDIT.md',
    'UX_FLOW.md',
    'CHANGELOG.md',
  ],

  // Docs that get linked/mentioned but must actually exist at the repo root.
  // If a doc references one of these and the file is absent → dead-link finding.
  referencedDocs: [
    'DEPLOYMENT.md',
    'WAF_INTEGRATION_GUIDE.md',
    'CODE_OF_CONDUCT.md',
    'TESTING.md',
  ],

  // Numeric facts that must agree across every doc. If two docs state
  // different values → contradiction finding.
  numericChecks: [
    {
      label: 'Security score (NN/100)',
      // matches "Security Score: 90/100", "**Security Score:** 100/100", etc.
      // (deliberately scoped to "security score" so per-category NN/100 lines don't match)
      pattern: /security\s+score[:*\s]*\(?\s*(\d{2,3})\s*\/\s*100/gi,
    },
  ],

  // "Stale gap" = a doc still describes something as missing/unbuilt, but the
  // artifact proving it shipped now exists on disk.
  staleGaps: [
    {
      name: 'frontend tests',
      stalePattern: /frontend tests not configured|zero test files|frontend has zero test|tests:\s*0|npm test just prints/i,
      resolvedIfExists: 'frontend/vitest.config.js',
    },
  ],

  // "Stale blocker" = a doc says work is blocked by X, but evidence on disk
  // shows X is resolved.
  staleBlockers: [
    {
      name: 'settlement predictor input-mapping bug',
      blockedPattern: /blocked by[^.\n]*predictor|predictor[^.\n]*blocker|gates? (this )?path'?s? launch/i,
      resolvedEvidence: {
        file: 'backend/src/ml_models/settlement_predictor/proof_of_work.json',
        contains: 'Retrained',
      },
    },
    {
      name: 'settlement predictor identical-output bug',
      blockedPattern: /identical (predictions|results)|non-discriminating|\$1\.26B/i,
      resolvedEvidence: {
        file: 'backend/src/ml_models/settlement_predictor/proof_of_work.json',
        contains: 'Retrained',
      },
    },
  ],

  // Docs that must not be empty/placeholder.
  nonEmptyDocs: [
    'automation/README.md',
    'frontend/README.md',
  ],
};
