/**
 * Simple data seeder for testing FairMediator
 * Creates sample mediator profiles in MongoDB
 * 
 * Usage: node backend/src/scripts/seed-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mediator = require('../models/Mediator');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function seedMediators() {
    console.log('🌱 FairMediator Data Seeder');
    console.log('='.repeat(50));
    
    const sampleMediators = [
        {
            name: "Sarah Johnson",
            email: "sarah.johnson@mediation.com",
            currentFirm: "Independent Mediation Services",
            pastFirms: ["Wilson & Associates", "Legal Solutions Group"],
            practiceAreas: ["Intellectual Property", "Technology", "Commercial"],
            yearsExperience: 15,
            barMemberships: ["California State Bar", "New York State Bar"],
            location: {
                city: "San Francisco",
                state: "CA",
                country: "USA"
            },
            education: [
                { institution: "Stanford Law School", degree: "JD", year: 2008 },
                { institution: "UC Berkeley", degree: "BS Computer Science", year: 2005 }
            ],
            organizations: ["American Bar Association", "Silicon Valley Bar"],
            recentCases: [
                "Software licensing dispute - TechCorp vs StartupInc",
                "Patent infringement mediation",
                "Trade secret misappropriation case"
            ],
            ideologyScore: -0.5,
            ideologyLabel: "LEAN_LIBERAL",
            ideologyConfidence: 0.7,
            rating: 4.5,
            reviewCount: 28,
            isPremium: true,
            isVerified: true,
            profileCompleteness: 95
        },
        {
            name: "Michael Chen",
            email: "mchen@neutralmediators.com",
            currentFirm: "Neutral Mediators LLC",
            practiceAreas: ["Employment", "Discrimination", "Labor"],
            yearsExperience: 22,
            barMemberships: ["Illinois State Bar"],
            location: {
                city: "Chicago",
                state: "IL",
                country: "USA"
            },
            education: [
                { institution: "Northwestern Law", degree: "JD", year: 2001 },
                { institution: "University of Chicago", degree: "BA Economics", year: 1998 }
            ],
            organizations: ["National Association for Employee Rights"],
            ideologyScore: 0,
            ideologyLabel: "NEUTRAL",
            ideologyConfidence: 0.85,
            rating: 4.8,
            reviewCount: 45,
            isPremium: false,
            isVerified: true,
            profileCompleteness: 88
        },
        {
            name: "Robert Hamilton",
            email: "rhamilton@corporate-mediation.com",
            currentFirm: "Hamilton Dispute Resolution",
            pastFirms: ["BigLaw Associates", "Corporate Legal Services"],
            practiceAreas: ["Corporate", "M&A", "Securities"],
            yearsExperience: 30,
            barMemberships: ["New York State Bar", "DC Bar"],
            location: {
                city: "New York",
                state: "NY",
                country: "USA"
            },
            education: [
                { institution: "Harvard Law School", degree: "JD", year: 1993 },
                { institution: "Yale University", degree: "BA Political Science", year: 1990 }
            ],
            organizations: ["Federalist Society", "Manhattan Bar Association"],
            appointments: ["Appointed to State Mediation Board by Republican Governor"],
            ideologyScore: 1.5,
            ideologyLabel: "STRONG_CONSERVATIVE",
            ideologyConfidence: 0.8,
            rating: 4.6,
            reviewCount: 67,
            isPremium: true,
            isVerified: true,
            profileCompleteness: 92
        },
        {
            name: "Emily Rodriguez",
            email: "erodriguez@publicinterest.org",
            currentFirm: "Public Interest Mediation Center",
            practiceAreas: ["Environmental", "Civil Rights", "Consumer Protection"],
            yearsExperience: 12,
            barMemberships: ["California State Bar"],
            location: {
                city: "Los Angeles",
                state: "CA",
                country: "USA"
            },
            education: [
                { institution: "UCLA Law", degree: "JD", year: 2011 },
                { institution: "UC Santa Barbara", degree: "BA Environmental Studies", year: 2008 }
            ],
            organizations: ["ACLU", "Sierra Club Legal Defense"],
            publications: [
                "Environmental Justice in Mediation",
                "Community-Centered Dispute Resolution"
            ],
            ideologyScore: -1.8,
            ideologyLabel: "STRONG_LIBERAL",
            ideologyConfidence: 0.9,
            rating: 4.7,
            reviewCount: 34,
            isPremium: false,
            isVerified: true,
            profileCompleteness: 85
        },
        {
            name: "David Park",
            email: "dpark@techmediation.io",
            currentFirm: "Tech Mediation Group",
            practiceAreas: ["Technology", "Data Privacy", "Cybersecurity"],
            yearsExperience: 8,
            barMemberships: ["Washington State Bar"],
            location: {
                city: "Seattle",
                state: "WA",
                country: "USA"
            },
            education: [
                { institution: "University of Washington Law", degree: "JD", year: 2015 },
                { institution: "MIT", degree: "BS Computer Science", year: 2012 }
            ],
            organizations: ["Tech Law Association", "Cybersecurity Legal Council"],
            ideologyScore: 0.2,
            ideologyLabel: "NEUTRAL",
            ideologyConfidence: 0.65,
            rating: 4.3,
            reviewCount: 19,
            isPremium: true,
            isVerified: true,
            profileCompleteness: 78
        }
    ];
    
    try {
        // Clear existing data (be careful in production!)
        console.log('🗑️  Clearing existing mediators...');
        await Mediator.deleteMany({});
        
        // Insert sample data
        console.log(`📝 Inserting ${sampleMediators.length} sample mediators...`);
        const result = await Mediator.insertMany(sampleMediators);
        
        console.log(`✅ Successfully inserted ${result.length} mediators!`);
        console.log('\nSample mediators added:');
        sampleMediators.forEach(med => {
            console.log(`  - ${med.name} (${med.ideologyLabel}) - ${med.practiceAreas.join(', ')}`);
        });
        
        console.log('\n✅ Seeding complete! You can now test the application.');
    } catch (error) {
        console.error('\n❌ Error:', error);
        console.log('Make sure MongoDB is running and .env is configured correctly.');
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the seeder
connectDB().then(() => seedMediators());
