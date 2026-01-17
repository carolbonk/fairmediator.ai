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
        },
        {
            name: "Jennifer Martinez",
            email: "jmartinez@familymediation.com",
            phone: "+1 (512) 555-0890",
            lawFirm: "Family First Mediation",
            currentEmployer: "Family First Mediation",
            specializations: ["Family Law", "Divorce", "Child Custody"],
            yearsExperience: 18,
            barAdmissions: ["Texas State Bar"],
            certifications: ["Family Mediation Specialist", "Child Welfare Advocate"],
            location: {
                city: "Austin",
                state: "TX",
                country: "USA"
            },
            ideologyScore: -3,
            biasIndicators: {
                politicalAffiliations: ["Texas Family Law Association"]
            },
            affiliations: [{
                type: "organization",
                name: "National Family Mediators",
                role: "Board Member",
                startDate: new Date("2012-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/jennifer-martinez",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Family Law", "Divorce", "Child Custody", "Compassionate"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 82,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "William Thompson",
            email: "wthompson@realestatemediation.com",
            phone: "+1 (305) 555-0123",
            lawFirm: "Thompson Real Estate Dispute Resolution",
            currentEmployer: "Thompson Real Estate Dispute Resolution",
            previousEmployers: ["Miami Land Title Company"],
            specializations: ["Real Estate", "Construction", "Property Disputes"],
            yearsExperience: 25,
            barAdmissions: ["Florida State Bar"],
            certifications: ["Real Estate Mediation Certified", "Construction Law Specialist"],
            location: {
                city: "Miami",
                state: "FL",
                country: "USA"
            },
            ideologyScore: 4,
            biasIndicators: {
                politicalAffiliations: ["Florida Chamber of Commerce", "Real Estate Developers Association"]
            },
            affiliations: [{
                type: "organization",
                name: "Florida Real Estate Commission",
                role: "Mediator Panel Member",
                startDate: new Date("2010-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/william-thompson",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Real Estate", "Construction", "Property", "Business-Oriented"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 88,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Dr. Rachel Cohen",
            email: "rcohen@healthcaremediation.org",
            phone: "+1 (617) 555-0456",
            website: "https://healthcaremediation.org",
            lawFirm: "Healthcare Dispute Solutions",
            currentEmployer: "Massachusetts General Hospital",
            previousEmployers: ["Harvard Medical School Legal Dept"],
            specializations: ["Healthcare", "Medical Malpractice", "Bioethics"],
            yearsExperience: 16,
            barAdmissions: ["Massachusetts State Bar"],
            certifications: ["Healthcare Mediation Specialist", "Medical Ethics Certificate"],
            location: {
                city: "Boston",
                state: "MA",
                country: "USA"
            },
            ideologyScore: -4,
            biasIndicators: {
                politicalAffiliations: ["American Medical Association", "Physicians for Social Responsibility"],
                publicStatements: [{
                    statement: "Healthcare is a right, not a privilege",
                    source: "Medical Ethics Symposium 2023",
                    date: new Date("2023-09-10"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Massachusetts Medical Society",
                role: "Ethics Committee Member",
                startDate: new Date("2014-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/rachel-cohen",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Healthcare", "Medical Malpractice", "Ethics", "Progressive"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 92,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Marcus Washington",
            email: "mwashington@insurancemediation.com",
            phone: "+1 (404) 555-0789",
            lawFirm: "Washington Insurance Mediation Group",
            currentEmployer: "Washington Insurance Mediation Group",
            specializations: ["Insurance", "Personal Injury", "Product Liability"],
            yearsExperience: 14,
            barAdmissions: ["Georgia State Bar"],
            certifications: ["Insurance Mediation Certified", "Personal Injury Specialist"],
            location: {
                city: "Atlanta",
                state: "GA",
                country: "USA"
            },
            ideologyScore: 0,
            biasIndicators: {
                politicalAffiliations: ["Georgia Association for Mediation"]
            },
            affiliations: [{
                type: "organization",
                name: "National Insurance Mediators",
                role: "Member",
                startDate: new Date("2013-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/marcus-washington",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Insurance", "Personal Injury", "Balanced", "Detail-Oriented"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 79,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Patricia O'Brien",
            email: "pobrien@labormediation.com",
            phone: "+1 (602) 555-0234",
            lawFirm: "O'Brien Labor Relations",
            currentEmployer: "O'Brien Labor Relations",
            previousEmployers: ["Arizona Department of Labor"],
            specializations: ["Labor Relations", "Union Negotiations", "Workplace Disputes"],
            yearsExperience: 28,
            barAdmissions: ["Arizona State Bar"],
            certifications: ["Labor Relations Specialist", "Union Mediator Certified"],
            location: {
                city: "Phoenix",
                state: "AZ",
                country: "USA"
            },
            ideologyScore: -5,
            biasIndicators: {
                politicalAffiliations: ["AFL-CIO", "National Labor Relations Association"],
                publicStatements: [{
                    statement: "Workers deserve fair representation and safe conditions",
                    source: "Labor Rights Conference 2022",
                    date: new Date("2022-08-15"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "United Workers Association",
                role: "Advisory Board",
                startDate: new Date("2008-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/patricia-obrien",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Labor", "Union", "Workers Rights", "Experienced"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 87,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "James Crawford",
            email: "jcrawford@corporatemediation.com",
            phone: "+1 (303) 555-0567",
            website: "https://crawfordcorporatelaw.com",
            lawFirm: "Crawford & Associates",
            currentEmployer: "Crawford & Associates",
            previousEmployers: ["Denver Corporate Legal", "Mountain West Law Group"],
            specializations: ["Corporate", "Mergers & Acquisitions", "Partnership Disputes"],
            yearsExperience: 22,
            barAdmissions: ["Colorado State Bar", "Wyoming State Bar"],
            certifications: ["Corporate Mediation Specialist", "M&A Negotiator"],
            location: {
                city: "Denver",
                state: "CO",
                country: "USA"
            },
            ideologyScore: 6,
            biasIndicators: {
                politicalAffiliations: ["Colorado Business Alliance", "Denver Chamber of Commerce"],
                publicStatements: [{
                    statement: "Free market principles drive innovation and growth",
                    source: "Rocky Mountain Business Summit 2023",
                    date: new Date("2023-04-20"),
                    sentiment: "conservative"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Colorado Corporate Counsel",
                role: "Member",
                startDate: new Date("2005-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/james-crawford",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Corporate", "M&A", "Business", "Pro-Business"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 90,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Lisa Nguyen",
            email: "lnguyen@internationalmediation.com",
            phone: "+1 (612) 555-0890",
            lawFirm: "Global Dispute Resolution Partners",
            currentEmployer: "Global Dispute Resolution Partners",
            specializations: ["International Law", "Trade Disputes", "Cross-Border Contracts"],
            yearsExperience: 12,
            barAdmissions: ["Minnesota State Bar"],
            certifications: ["International Mediation Certified", "Trade Law Specialist"],
            location: {
                city: "Minneapolis",
                state: "MN",
                country: "USA"
            },
            ideologyScore: -1,
            biasIndicators: {
                politicalAffiliations: ["International Bar Association", "World Trade Mediators"]
            },
            affiliations: [{
                type: "organization",
                name: "International Chamber of Commerce",
                role: "Mediator Panel",
                startDate: new Date("2016-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/lisa-nguyen",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["International", "Trade", "Cross-Border", "Multilingual"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 84,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Richard Foster",
            email: "rfoster@bankruptcymediation.com",
            phone: "+1 (215) 555-0123",
            lawFirm: "Foster Bankruptcy Solutions",
            currentEmployer: "Foster Bankruptcy Solutions",
            previousEmployers: ["Philadelphia Credit Counseling"],
            specializations: ["Bankruptcy", "Debt Restructuring", "Financial Disputes"],
            yearsExperience: 19,
            barAdmissions: ["Pennsylvania State Bar", "New Jersey State Bar"],
            certifications: ["Bankruptcy Mediation Specialist", "Financial Restructuring Expert"],
            location: {
                city: "Philadelphia",
                state: "PA",
                country: "USA"
            },
            ideologyScore: 3,
            biasIndicators: {
                politicalAffiliations: ["National Association of Bankruptcy Trustees"]
            },
            affiliations: [{
                type: "organization",
                name: "American Bankruptcy Institute",
                role: "Member",
                startDate: new Date("2009-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/richard-foster",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Bankruptcy", "Debt", "Financial", "Pragmatic"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 81,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Angela Ramirez",
            email: "aramirez@communitymediation.org",
            phone: "+1 (505) 555-0456",
            lawFirm: "Southwest Community Mediation Center",
            currentEmployer: "Southwest Community Mediation Center",
            specializations: ["Community Mediation", "Neighbor Disputes", "Small Claims"],
            yearsExperience: 9,
            barAdmissions: ["New Mexico State Bar"],
            certifications: ["Community Mediation Specialist", "Conflict Resolution Certificate"],
            location: {
                city: "Albuquerque",
                state: "NM",
                country: "USA"
            },
            ideologyScore: -7,
            biasIndicators: {
                politicalAffiliations: ["Community Action Network", "New Mexico Legal Aid"],
                publicStatements: [{
                    statement: "Access to justice should be available to all, regardless of income",
                    source: "Community Justice Forum 2023",
                    date: new Date("2023-07-12"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "National Association for Community Mediation",
                role: "Volunteer Mediator",
                startDate: new Date("2017-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/angela-ramirez",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Community", "Access to Justice", "Progressive", "Public Service"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 76,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Kenneth Burke",
            email: "kburke@maritimemediation.com",
            phone: "+1 (206) 555-0789",
            website: "https://maritimelaw.com",
            lawFirm: "Pacific Maritime Legal Group",
            currentEmployer: "Pacific Maritime Legal Group",
            specializations: ["Maritime Law", "Shipping Disputes", "Admiralty"],
            yearsExperience: 27,
            barAdmissions: ["Washington State Bar", "Alaska State Bar"],
            certifications: ["Maritime Law Specialist", "Admiralty Mediator"],
            location: {
                city: "Seattle",
                state: "WA",
                country: "USA"
            },
            ideologyScore: 2,
            biasIndicators: {
                politicalAffiliations: ["Pacific Maritime Association"]
            },
            affiliations: [{
                type: "organization",
                name: "Maritime Law Association",
                role: "Senior Member",
                startDate: new Date("2001-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/kenneth-burke",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Maritime", "Admiralty", "Shipping", "Specialized"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 83,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Diana Lee",
            email: "dlee@eldermediation.com",
            phone: "+1 (503) 555-0234",
            lawFirm: "Elder Care Mediation Services",
            currentEmployer: "Elder Care Mediation Services",
            specializations: ["Elder Law", "Estate Planning", "Guardianship"],
            yearsExperience: 15,
            barAdmissions: ["Oregon State Bar"],
            certifications: ["Elder Law Specialist", "Estate Mediation Certified"],
            location: {
                city: "Portland",
                state: "OR",
                country: "USA"
            },
            ideologyScore: -2,
            biasIndicators: {
                politicalAffiliations: ["National Academy of Elder Law Attorneys"]
            },
            affiliations: [{
                type: "organization",
                name: "Oregon Elder Care Alliance",
                role: "Board Member",
                startDate: new Date("2012-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/diana-lee",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Elder Law", "Estate Planning", "Compassionate", "Patient-Centered"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 85,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Thomas Anderson",
            email: "tanderson@energymediation.com",
            phone: "+1 (713) 555-0567",
            website: "https://andersonenergylaw.com",
            lawFirm: "Anderson Energy & Resources",
            currentEmployer: "Anderson Energy & Resources",
            previousEmployers: ["Houston Energy Partners", "Texas Oil & Gas Legal"],
            specializations: ["Energy Law", "Oil & Gas", "Environmental Compliance"],
            yearsExperience: 24,
            barAdmissions: ["Texas State Bar", "Louisiana State Bar"],
            certifications: ["Energy Law Specialist", "Environmental Compliance Mediator"],
            location: {
                city: "Houston",
                state: "TX",
                country: "USA"
            },
            ideologyScore: 7,
            biasIndicators: {
                politicalAffiliations: ["Texas Oil and Gas Association", "American Petroleum Institute"],
                publicStatements: [{
                    statement: "Energy independence is crucial for national security",
                    source: "Energy Industry Conference 2023",
                    date: new Date("2023-03-15"),
                    sentiment: "conservative"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Energy Bar Association",
                role: "Member",
                startDate: new Date("2004-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/thomas-anderson",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Energy", "Oil & Gas", "Conservative", "Industry Expert"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 89,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Samantha Miller",
            email: "smiller@educationmediation.org",
            phone: "+1 (916) 555-0890",
            lawFirm: "Education Dispute Resolution Center",
            currentEmployer: "California Department of Education",
            specializations: ["Education Law", "Special Education", "Student Rights"],
            yearsExperience: 11,
            barAdmissions: ["California State Bar"],
            certifications: ["Special Education Advocate", "Education Mediation Specialist"],
            location: {
                city: "Sacramento",
                state: "CA",
                country: "USA"
            },
            ideologyScore: -6,
            biasIndicators: {
                politicalAffiliations: ["Teachers Union", "Parent Advocacy Coalition"],
                publicStatements: [{
                    statement: "Every child deserves quality education regardless of background",
                    source: "Education Equity Summit 2023",
                    date: new Date("2023-06-08"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Council of Parent Attorneys and Advocates",
                role: "Member",
                startDate: new Date("2015-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/samantha-miller",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Education", "Special Education", "Student Rights", "Advocate"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 80,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Victor Petrov",
            email: "vpetrov@intellectualproperty.com",
            phone: "+1 (408) 555-0123",
            website: "https://petrovip.com",
            lawFirm: "Petrov Intellectual Property Group",
            currentEmployer: "Petrov Intellectual Property Group",
            previousEmployers: ["Silicon Valley Patent Law"],
            specializations: ["Intellectual Property", "Patent Disputes", "Trademark"],
            yearsExperience: 17,
            barAdmissions: ["California State Bar"],
            certifications: ["Patent Law Specialist", "IP Mediation Certified"],
            location: {
                city: "San Jose",
                state: "CA",
                country: "USA"
            },
            ideologyScore: 1,
            biasIndicators: {
                politicalAffiliations: ["Intellectual Property Owners Association"]
            },
            affiliations: [{
                type: "organization",
                name: "American Intellectual Property Law Association",
                role: "Member",
                startDate: new Date("2010-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/victor-petrov",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["IP", "Patents", "Trademarks", "Tech Industry"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 86,
                lastVerified: new Date(),
                needsReview: false
            }
        },
        {
            name: "Catherine Hayes",
            email: "chayes@nonprofitmediation.org",
            phone: "+1 (503) 555-0456",
            lawFirm: "Hayes Nonprofit Legal Services",
            currentEmployer: "Hayes Nonprofit Legal Services",
            specializations: ["Nonprofit Law", "Governance", "Board Disputes"],
            yearsExperience: 13,
            barAdmissions: ["Oregon State Bar", "Washington State Bar"],
            certifications: ["Nonprofit Law Specialist", "Governance Mediator"],
            location: {
                city: "Portland",
                state: "OR",
                country: "USA"
            },
            ideologyScore: -8,
            biasIndicators: {
                politicalAffiliations: ["National Council of Nonprofits", "Progressive Leadership Alliance"],
                publicStatements: [{
                    statement: "Nonprofit organizations are essential for social good",
                    source: "Nonprofit Leadership Conference 2023",
                    date: new Date("2023-10-05"),
                    sentiment: "liberal"
                }]
            },
            affiliations: [{
                type: "organization",
                name: "Oregon Nonprofit Association",
                role: "Legal Advisor",
                startDate: new Date("2013-01-01"),
                isCurrent: true
            }],
            sources: [{
                url: "https://example.com/catherine-hayes",
                scrapedAt: new Date(),
                sourceType: "manual_seed"
            }],
            tags: ["Nonprofit", "Governance", "Social Justice", "Mission-Driven"],
            isVerified: true,
            isActive: true,
            dataQuality: {
                completeness: 82,
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
