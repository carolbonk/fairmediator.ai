const mongoose = require('mongoose');

async function checkData() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    await mongoose.connect(uri);

    const Mediator = mongoose.model('Mediator', new mongoose.Schema({}, { strict: false }));

    const mediators = await Mediator.find({}).select('name donorHistory affiliations ideologyScore');
    console.log('📊 Total mediators:', mediators.length);
    console.log('\n' + '='.repeat(80));
    console.log('DONATION DATA COVERAGE:');
    console.log('='.repeat(80) + '\n');

    let withDonations = 0;
    let withAffiliations = 0;
    let withIdeology = 0;
    let totalDonations = 0;

    mediators.forEach(m => {
      const donations = m.donorHistory?.length || 0;
      const affs = m.affiliations?.length || 0;
      const ideology = m.ideologyScore !== undefined && m.ideologyScore !== null;

      if (donations > 0) withDonations++;
      if (affs > 0) withAffiliations++;
      if (ideology) withIdeology++;
      totalDonations += donations;

      const donationEmoji = donations > 0 ? '💰' : '  ';
      const affEmoji = affs > 0 ? '🏢' : '  ';
      const ideoEmoji = ideology ? '📊' : '  ';

      console.log(`${donationEmoji}${affEmoji}${ideoEmoji} ${m.name.padEnd(40)} | ${donations.toString().padStart(2)} donations | ${affs.toString().padStart(2)} affiliations`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ Mediators with donations:    ${withDonations}/${mediators.length} (${Math.round(withDonations/mediators.length*100)}%)`);
    console.log(`✅ Mediators with affiliations: ${withAffiliations}/${mediators.length} (${Math.round(withAffiliations/mediators.length*100)}%)`);
    console.log(`✅ Mediators with ideology:     ${withIdeology}/${mediators.length} (${Math.round(withIdeology/mediators.length*100)}%)`);
    console.log(`📈 Total donations recorded:    ${totalDonations}`);
    console.log(`📈 Avg donations per mediator:  ${(totalDonations/mediators.length).toFixed(1)}`);

    // Sample 3 mediators with donations for quality check
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE DONATION RECORDS (Quality Check):');
    console.log('='.repeat(80) + '\n');

    const mediatorsWithDonations = mediators.filter(m => m.donorHistory && m.donorHistory.length > 0);
    const samples = mediatorsWithDonations.slice(0, 3);

    samples.forEach(m => {
      console.log(`\n${m.name}:`);
      m.donorHistory.slice(0, 3).forEach((donation, idx) => {
        console.log(`  ${idx + 1}. $${donation.amount} to ${donation.recipient || 'N/A'} (${donation.date || 'No date'})`);
        if (donation.committee_name) console.log(`     Committee: ${donation.committee_name}`);
      });
      if (m.donorHistory.length > 3) {
        console.log(`  ... and ${m.donorHistory.length - 3} more donations`);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

checkData();
