/**
 * Test Script for Data Organizer Service
 * Demonstrates extracting structured data from unstructured mediator bios
 *
 * Run: node src/scripts/test-data-organizer.js
 */

const dataOrganizer = require('../services/ai/dataOrganizer');
const logger = require('../config/logger');

// Example unstructured mediator bio
const sampleBio = `
Dr. Sarah Martinez is a highly experienced mediator based in San Francisco, California.
She earned her J.D. from Stanford Law School and holds an LL.M. in Dispute Resolution
from Harvard Law School. With over 20 years of experience, Dr. Martinez specializes in
employment law, intellectual property disputes, and complex commercial litigation.

Dr. Martinez is a member of the Federalist Society and has served on the American Bar
Association's Alternative Dispute Resolution Committee since 2015. She previously worked
at Morrison & Foerster LLP from 2005 to 2018, where she was a partner in the Labor &
Employment practice group.

She has authored numerous articles on mediation ethics and workplace conflict resolution,
including "Neutrality in the Modern Mediator" published in the Harvard Negotiation Law
Review (2021) and "AI and ADR: The Future of Mediation" in the Stanford Law Review (2023).

Dr. Martinez is admitted to practice in California and New York and speaks English and Spanish.
`;

const sampleBio2 = `
John Thompson is a retired federal judge who has transitioned into full-time mediation.
He attended Yale Law School and clerked for Justice Sandra Day O'Connor before serving
15 years on the U.S. District Court for the Southern District of New York.

Mr. Thompson is an active member of the American Constitution Society and frequently
speaks at their annual conferences on judicial ethics and access to justice. He has
mediated over 300 cases since retiring from the bench in 2019, focusing on civil rights,
environmental law, and constitutional matters.

He previously served as the Chair of the New York State Bar Association's Judicial
Section and is admitted to practice in New York, New Jersey, and Connecticut.
`;

async function testDataOrganizer() {
  console.log('\n=== Data Organizer Test ===\n');

  try {
    // Test 1: Extract mediator profile
    console.log('Test 1: Extracting structured profile from bio...\n');
    const profile1 = await dataOrganizer.extractMediatorProfile(sampleBio);
    console.log('Profile 1 (Sarah Martinez):');
    console.log(JSON.stringify(profile1, null, 2));

    // Test 2: Extract signals
    console.log('\n\nTest 2: Extracting signals (memberships, employment, publications)...\n');
    const signals1 = await dataOrganizer.extractSignals(sampleBio, 'mediator-123');
    console.log('Signals for Sarah Martinez:');
    console.log(JSON.stringify(signals1, null, 2));

    // Test 3: Extract from second bio
    console.log('\n\nTest 3: Extracting from second mediator bio...\n');
    const profile2 = await dataOrganizer.extractMediatorProfile(sampleBio2);
    console.log('Profile 2 (John Thompson):');
    console.log(JSON.stringify(profile2, null, 2));

    const signals2 = await dataOrganizer.extractSignals(sampleBio2, 'mediator-456');
    console.log('\nSignals for John Thompson:');
    console.log(JSON.stringify(signals2, null, 2));

    // Test 4: Extract firms
    console.log('\n\nTest 4: Extracting law firm names and aliases...\n');
    const firmText = 'She worked at Morrison & Foerster LLP (also known as MoFo) and Jones Day.';
    const firms = await dataOrganizer.extractFirms(firmText);
    console.log('Firms:');
    console.log(JSON.stringify(firms, null, 2));

    console.log('\n\n=== All Tests Complete ===\n');
    console.log('Key Observations:');
    console.log('1. Federalist Society membership → Conservative signal (weight: 0.7)');
    console.log('2. American Constitution Society membership → Liberal signal (weight: 0.7)');
    console.log('3. Employment history extracted with dates');
    console.log('4. Publications extracted with titles and journals');
    console.log('5. Bar admissions and languages captured\n');

  } catch (error) {
    console.error('Test failed:', error);
    logger.error('Data organizer test failed', { error: error.message });
  }
}

// Run the test
testDataOrganizer()
  .then(() => {
    console.log('Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
