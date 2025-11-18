/**
 * Test Script for Analysis Endpoints
 * Tests document parsing and bulk conflict checking
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api/analysis';

// Test 1: Text Analysis
async function testTextAnalysis() {
  console.log('\n=== Test 1: Text Analysis ===');

  const testText = `
    This is an employment discrimination case in San Francisco, CA.
    The plaintiff is frustrated with the wrongful termination by ABC Corporation.
    The case involves workplace harassment and violation of labor laws.
    We need urgent mediation to resolve this dispute.
    The defendant is represented by Smith & Associates Law Firm.
  `;

  try {
    const response = await axios.post(`${BASE_URL}/text`, {
      text: testText
    });

    console.log('✅ Text Analysis Success:');
    console.log('Case Type:', response.data.analysis.caseType);
    console.log('Jurisdiction:', response.data.analysis.jurisdiction);
    console.log('Opposing Parties:', response.data.analysis.opposingParties);
    console.log('Sentiment:', response.data.analysis.sentiment);
    console.log('Keywords:', response.data.analysis.keywords);
  } catch (error) {
    console.error('❌ Text Analysis Error:', error.response?.data || error.message);
  }
}

// Test 2: Document Upload (create temporary test file)
async function testDocumentUpload() {
  console.log('\n=== Test 2: Document Upload ===');

  const testContent = `
    BUSINESS DISPUTE CASE

    Location: Los Angeles, CA

    This is a commercial contract dispute between Tech Innovations Inc. and Digital Solutions LLC.
    The case involves breach of contract and partnership disagreements.

    Defendant: Digital Solutions LLC
    Respondent: John Smith, CEO

    The parties are seeking mediation to resolve this business conflict quickly.
  `;

  // Create temporary test file
  const tempFile = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(tempFile, testContent);

  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(tempFile));

    const response = await axios.post(`${BASE_URL}/document`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ Document Upload Success:');
    console.log('Case Type:', response.data.analysis.caseType);
    console.log('Jurisdiction:', response.data.analysis.jurisdiction);
    console.log('Opposing Parties:', response.data.analysis.opposingParties);

    // Clean up
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error('❌ Document Upload Error:', error.response?.data || error.message);
    // Clean up even on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// Test 3: Bulk Conflict Checker
async function testBulkConflictChecker() {
  console.log('\n=== Test 3: Bulk Conflict Checker ===');

  const testParties = `
Microsoft Corporation
Apple Inc.
Google LLC
Amazon.com
Tesla Inc.
Meta Platforms
Johnson & Johnson
Goldman Sachs
Morgan Stanley
JPMorgan Chase
  `;

  // Create temporary CSV file
  const tempFile = path.join(__dirname, 'test-parties.csv');
  fs.writeFileSync(tempFile, testParties);

  try {
    const formData = new FormData();
    formData.append('parties', fs.createReadStream(tempFile));

    const response = await axios.post(`${BASE_URL}/bulk-conflict`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ Bulk Conflict Check Success:');
    console.log('Total Parties Checked:', response.data.results.totalParties);
    console.log('Total Conflicts Found:', response.data.results.totalConflicts);
    console.log('High Severity Conflicts:', response.data.results.summary?.highSeverity || 0);
    console.log('Medium Severity Conflicts:', response.data.results.summary?.mediumSeverity || 0);

    if (response.data.results.conflicts.length > 0) {
      console.log('\nSample Conflicts:');
      response.data.results.conflicts.slice(0, 3).forEach(conflict => {
        console.log(`  - ${conflict.party} -> ${conflict.mediator.name} (${conflict.severity})`);
      });
    }

    // Clean up
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error('❌ Bulk Conflict Check Error:', error.response?.data || error.message);
    // Clean up even on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// Test 4: Enhanced Chat
async function testEnhancedChat() {
  console.log('\n=== Test 4: Enhanced Chat with Case Analysis ===');

  try {
    const response = await axios.post(`${BASE_URL}/chat-enhanced`, {
      message: 'I have an employment discrimination case in San Francisco. The defendant is a tech company. Can you recommend a mediator?',
      history: []
    });

    console.log('✅ Enhanced Chat Success:');
    console.log('Response:', response.data.message.substring(0, 200) + '...');
    console.log('Case Type:', response.data.caseAnalysis?.caseType);
    console.log('Mediators Suggested:', response.data.mediators?.length || 0);
  } catch (error) {
    console.error('❌ Enhanced Chat Error:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Analysis Endpoint Tests...\n');
  console.log('Backend URL:', BASE_URL);

  await testTextAnalysis();
  await testDocumentUpload();
  await testBulkConflictChecker();
  await testEnhancedChat();

  console.log('\n✨ All tests completed!\n');
}

runAllTests();
