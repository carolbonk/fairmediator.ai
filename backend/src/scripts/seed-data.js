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
            phone: "+1 (415) 555-0123",
            website: "https://sarahjohnsonmediation.com",
            lawFirm: "Independent Mediation Services",
            currentEmployer: "Independent Mediation Services",
            previousEmployers: ["Wilson & Associates", "Legal Solutions Group"],
            specializations: ["Intellectual Property", "Technology", "Commercial"],
            yearsExperience: 15,
            barAdmissions: ["California State Bar", "New York State Bar"],
            certifications: ["Certified Mediator - ABA", "Technology Mediation Specialist"],
            location: {
                city: "San Francisco",
                state: "CA",
                country: "USA"
            },
            ideologyScore: -2,
            biasIndicators: {
                politicalAffiliations: ["American Bar Association", "Silicon Valley Bar"],
                publicStatements: [{
                    statement: "Technology should be accessible to all",
                    source: "TechLaw Conference 2023",
                    date: new Date("2023-05-15"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "American Bar Association",
                role: "Member",
                startDate: new Date("2008-01-01"),
                isCurrent: true
            }],
            cases: [{
                caseNumber: "CV-2023-001",
                caseName: "TechCorp vs StartupInc",
                parties: ["TechCorp", "StartupInc"],
                role: "mediator",
                outcome: "Settlement reached",
                date: new Date("2023-06-20"),
                court: "Superior Court of California"
            }],
            sources: [{
                url: "https://example.com/sarah-johnson",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Technology", "IP", "Commercial", "Experienced"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 95,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Michael Chen",
            email: "mchen@neutralmediators.com",
            phone: "+1 (312) 555-0456",
            lawFirm: "Neutral Mediators LLC",
            currentEmployer: "Neutral Mediators LLC",
            specializations: ["Employment", "Discrimination", "Labor"],
            yearsExperience: 22,
            barAdmissions: ["Illinois State Bar"],
            certifications: ["Labor Relations Mediator", "Employment Law Specialist"],
            location: {
                city: "Chicago",
                state: "IL",
                country: "USA"
            },
            ideologyScore: 0,
            biasIndicators: {
                politicalAffiliations: ["National Association for Employee Rights"]
            },
            affiliations: [{
                type: "organization",
                name: "National Association for Employee Rights",
                role: "Board Member",
                startDate: new Date("2010-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/michael-chen",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Employment", "Labor", "Neutral", "Experienced"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 88,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Robert Hamilton",
            email: "rhamilton@corporate-mediation.com",
            phone: "+1 (212) 555-0789",
            website: "https://hamiltondisputeresolution.com",
            lawFirm: "Hamilton Dispute Resolution",
            currentEmployer: "Hamilton Dispute Resolution",
            previousEmployers: ["BigLaw Associates", "Corporate Legal Services"],
            specializations: ["Corporate", "M&A", "Securities"],
            yearsExperience: 30,
            barAdmissions: ["New York State Bar", "DC Bar"],
            certifications: ["Securities Mediator", "Corporate Dispute Specialist"],
            location: {
                city: "New York",
                state: "NY",
                country: "USA"
            },
            ideologyScore: 5,
            biasIndicators: {
                politicalAffiliations: ["Federalist Society", "Manhattan Bar Association"],
                publicStatements: [{
                    statement: "Business efficiency and regulatory reduction are paramount",
                    source: "Corporate Law Review",
                    date: new Date("2022-11-10"),
                    sentiment: "conservative"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Federalist Society",
                role: "Member",
                startDate: new Date("1995-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/robert-hamilton",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Corporate", "M&A", "Conservative", "Highly Experienced"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 92,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Emily Rodriguez",
            email: "erodriguez@publicinterest.org",
            phone: "+1 (310) 555-0234",
            lawFirm: "Public Interest Mediation Center",
            currentEmployer: "Public Interest Mediation Center",
            specializations: ["Environmental", "Civil Rights", "Consumer Protection"],
            yearsExperience: 12,
            barAdmissions: ["California State Bar"],
            certifications: ["Environmental Mediation Specialist", "Civil Rights Mediator"],
            location: {
                city: "Los Angeles",
                state: "CA",
                country: "USA"
            },
            ideologyScore: -6,
            biasIndicators: {
                politicalAffiliations: ["ACLU", "Sierra Club Legal Defense"],
                publicStatements: [{
                    statement: "Environmental justice is social justice",
                    source: "Environmental Law Journal",
                    date: new Date("2023-03-22"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "ACLU",
                role: "Volunteer Mediator",
                startDate: new Date("2015-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/emily-rodriguez",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Environmental", "Civil Rights", "Progressive", "Public Interest"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 85,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "David Park",
            email: "dpark@techmediation.io",
            phone: "+1 (206) 555-0567",
            website: "https://techmediation.io",
            lawFirm: "Tech Mediation Group",
            currentEmployer: "Tech Mediation Group",
            specializations: ["Technology", "Data Privacy", "Cybersecurity"],
            yearsExperience: 8,
            barAdmissions: ["Washington State Bar"],
            certifications: ["Cybersecurity Law Specialist", "Data Privacy Mediator"],
            location: {
                city: "Seattle",
                state: "WA",
                country: "USA"
            },
            ideologyScore: 1,
            biasIndicators: {
                politicalAffiliations: ["Tech Law Association", "Cybersecurity Legal Council"]
            },
            affiliations: [{
                type: "organization",
                name: "Tech Law Association",
                role: "Member",
                startDate: new Date("2015-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/david-park",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Technology", "Cybersecurity", "Data Privacy", "Tech-Savvy"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 78,
                lastVerified: new Date(),
                needsReview: false
            }
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
            const ideologyLabel = med.ideologyScore < -4 ? 'STRONG_LIBERAL' :
                                 med.ideologyScore < -1 ? 'LEAN_LIBERAL' :
                                 med.ideologyScore <= 1 ? 'NEUTRAL' :
                                 med.ideologyScore <= 4 ? 'LEAN_CONSERVATIVE' : 'STRONG_CONSERVATIVE';
            console.log(`  - ${med.name} (${ideologyLabel}, Score: ${med.ideologyScore}) - ${med.specializations.join(', ')}`);
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
