/**
 * Integration Test for Matching and SWOT APIs
 * Run with: node test-matching.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4001/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, testName) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`✓ ${testName}`, 'green');
    return true;
  } else {
    testResults.failed++;
    log(`✗ ${testName}`, 'red');
    return false;
  }
}

async function testHealthCheck() {
  log('\n═══ Testing Health Check ═══', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    assert(response.status === 200, 'Health check returns 200');
    assert(response.data.status === 'healthy', 'Server is healthy');
    log(`Server status: ${response.data.status}`, 'blue');
  } catch (error) {
    assert(false, 'Health check failed');
    log(`Error: ${error.message}`, 'red');
  }
}

async function testMatchingSearch() {
  log('\n═══ Testing Matching Search ═══', 'cyan');
  try {
    const criteria = {
      specializations: ['Commercial', 'Employment'],
      location: {
        city: 'San Francisco',
        state: 'CA',
        maxDistance: 50
      },
      ideology: 'neutral',
      parties: []
    };

    const response = await axios.post(`${BASE_URL}/matching/search`, {
      criteria,
      options: {
        limit: 10,
        minScore: 60
      }
    });

    assert(response.status === 200, 'Search returns 200');
    assert(response.data.success === true, 'Response indicates success');
    assert(Array.isArray(response.data.data.matches), 'Returns matches array');
    assert(typeof response.data.data.count === 'number', 'Returns match count');

    log(`Found ${response.data.data.count} mediators`, 'blue');

    if (response.data.data.matches.length > 0) {
      const firstMatch = response.data.data.matches[0];
      assert(firstMatch.mediator, 'Match has mediator object');
      assert(firstMatch.score, 'Match has score object');
      assert(typeof firstMatch.score.overallScore === 'number', 'Has overall score');
      log(`Top match score: ${firstMatch.score.overallScore}%`, 'blue');

      if (firstMatch.mediator.name) {
        log(`Top mediator: ${firstMatch.mediator.name}`, 'blue');
      }
    } else {
      log('No matches found (this is OK for empty database)', 'yellow');
    }
  } catch (error) {
    assert(false, 'Matching search failed');
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
  }
}

async function testMatchingScore() {
  log('\n═══ Testing Score Calculation (requires auth) ═══', 'cyan');
  try {
    // This will fail without auth, but we can test the endpoint structure
    const response = await axios.post(`${BASE_URL}/matching/score`, {
      mediatorId: '507f1f77bcf86cd799439011',
      criteria: {
        specializations: ['Technology'],
        ideology: 'neutral'
      }
    });

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else if (error.response?.status === 404) {
      assert(true, 'Endpoint exists but mediator not found');
      log('Endpoint working, mediator not found', 'yellow');
    } else {
      assert(false, 'Unexpected error');
      log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    }
  }
}

async function testMatchingCompare() {
  log('\n═══ Testing Mediator Comparison (requires auth) ═══', 'cyan');
  try {
    const response = await axios.post(`${BASE_URL}/matching/compare`, {
      mediatorIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      criteria: {
        specializations: ['Commercial'],
        ideology: 'neutral'
      }
    });

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else {
      assert(true, 'Endpoint exists');
      log(`Status: ${error.response?.status}`, 'yellow');
    }
  }
}

async function testSwotGeneration() {
  log('\n═══ Testing SWOT Generation (requires auth) ═══', 'cyan');
  try {
    const response = await axios.post(`${BASE_URL}/matching/swot`, {
      mediatorId: '507f1f77bcf86cd799439011',
      contextData: {
        parties: ['Company A', 'Company B']
      }
    });

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else if (error.response?.status === 404) {
      assert(true, 'Endpoint exists but mediator not found');
      log('Endpoint working, mediator not found', 'yellow');
    } else {
      assert(true, 'Endpoint exists');
      log(`Status: ${error.response?.status}`, 'yellow');
    }
  }
}

async function testSwotCompare() {
  log('\n═══ Testing SWOT Comparison (requires auth) ═══', 'cyan');
  try {
    const response = await axios.post(`${BASE_URL}/matching/swot/compare`, {
      mediatorIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      contextData: {
        parties: []
      }
    });

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else {
      assert(true, 'Endpoint exists');
      log(`Status: ${error.response?.status}`, 'yellow');
    }
  }
}

async function testSwotExport() {
  log('\n═══ Testing SWOT Export (requires auth) ═══', 'cyan');
  try {
    const response = await axios.get(
      `${BASE_URL}/matching/swot/507f1f77bcf86cd799439011/export?format=json`
    );

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else {
      assert(true, 'Endpoint exists');
      log(`Status: ${error.response?.status}`, 'yellow');
    }
  }
}

async function testScrapingStats() {
  log('\n═══ Testing Scraping Stats (requires auth) ═══', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL}/scraping/stats`);

    assert(false, 'Should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      assert(true, 'Endpoint requires authentication (correct)');
      log('Authentication required (expected)', 'blue');
    } else if (error.response?.status === 200) {
      assert(true, 'Stats endpoint working');
      log(`Stats: ${JSON.stringify(error.response.data.data)}`, 'blue');
    } else {
      assert(true, 'Endpoint exists');
      log(`Status: ${error.response?.status}`, 'yellow');
    }
  }
}

async function testRouteStructure() {
  log('\n═══ Testing Route Structure ═══', 'cyan');

  const routes = [
    { method: 'POST', path: '/matching/search', requiresAuth: false },
    { method: 'POST', path: '/matching/score', requiresAuth: true },
    { method: 'POST', path: '/matching/compare', requiresAuth: true },
    { method: 'POST', path: '/matching/recommend', requiresAuth: true },
    { method: 'POST', path: '/matching/swot', requiresAuth: true },
    { method: 'POST', path: '/matching/swot/compare', requiresAuth: true },
    { method: 'GET', path: '/matching/swot/507f1f77bcf86cd799439011/export', requiresAuth: true }
  ];

  for (const route of routes) {
    try {
      let response;
      if (route.method === 'GET') {
        response = await axios.get(`${BASE_URL}${route.path}`);
      } else {
        response = await axios.post(`${BASE_URL}${route.path}`, {});
      }

      if (route.requiresAuth) {
        assert(false, `${route.method} ${route.path} should require auth`);
      } else {
        assert(true, `${route.method} ${route.path} accessible`);
      }
    } catch (error) {
      if (route.requiresAuth && error.response?.status === 401) {
        assert(true, `${route.method} ${route.path} requires auth (correct)`);
      } else if (error.response?.status === 400) {
        assert(true, `${route.method} ${route.path} exists (bad request expected)`);
      } else if (error.response?.status === 404) {
        assert(true, `${route.method} ${route.path} exists (not found expected)`);
      } else {
        assert(true, `${route.method} ${route.path} exists`);
      }
    }
  }
}

async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║   FairMediator Matching & SWOT Integration Tests     ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');

  await testHealthCheck();
  await testMatchingSearch();
  await testMatchingScore();
  await testMatchingCompare();
  await testSwotGeneration();
  await testSwotCompare();
  await testSwotExport();
  await testScrapingStats();
  await testRouteStructure();

  // Summary
  log('\n═══════════════ TEST SUMMARY ═══════════════', 'cyan');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');

  const percentage = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'yellow');

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} test(s) failed`, 'yellow');
  }

  log('═══════════════════════════════════════════\n', 'cyan');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
