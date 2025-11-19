/**
 * Mock Mediator Data
 * 2 mediators per state with realistic data
 * Includes Uber-style rating system with mediation counts
 */

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Margaret', 'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const CITIES = {
  'Alabama': ['Birmingham', 'Montgomery'],
  'Alaska': ['Anchorage', 'Fairbanks'],
  'Arizona': ['Phoenix', 'Tucson'],
  'Arkansas': ['Little Rock', 'Fayetteville'],
  'California': ['Los Angeles', 'San Francisco'],
  'Colorado': ['Denver', 'Colorado Springs'],
  'Connecticut': ['Hartford', 'New Haven'],
  'Delaware': ['Wilmington', 'Dover'],
  'Florida': ['Miami', 'Tampa'],
  'Georgia': ['Atlanta', 'Savannah'],
  'Hawaii': ['Honolulu', 'Hilo'],
  'Idaho': ['Boise', 'Meridian'],
  'Illinois': ['Chicago', 'Springfield'],
  'Indiana': ['Indianapolis', 'Fort Wayne'],
  'Iowa': ['Des Moines', 'Cedar Rapids'],
  'Kansas': ['Wichita', 'Overland Park'],
  'Kentucky': ['Louisville', 'Lexington'],
  'Louisiana': ['New Orleans', 'Baton Rouge'],
  'Maine': ['Portland', 'Augusta'],
  'Maryland': ['Baltimore', 'Annapolis'],
  'Massachusetts': ['Boston', 'Cambridge'],
  'Michigan': ['Detroit', 'Grand Rapids'],
  'Minnesota': ['Minneapolis', 'St. Paul'],
  'Mississippi': ['Jackson', 'Gulfport'],
  'Missouri': ['Kansas City', 'St. Louis'],
  'Montana': ['Billings', 'Missoula'],
  'Nebraska': ['Omaha', 'Lincoln'],
  'Nevada': ['Las Vegas', 'Reno'],
  'New Hampshire': ['Manchester', 'Nashua'],
  'New Jersey': ['Newark', 'Jersey City'],
  'New Mexico': ['Albuquerque', 'Santa Fe'],
  'New York': ['New York City', 'Buffalo'],
  'North Carolina': ['Charlotte', 'Raleigh'],
  'North Dakota': ['Fargo', 'Bismarck'],
  'Ohio': ['Columbus', 'Cleveland'],
  'Oklahoma': ['Oklahoma City', 'Tulsa'],
  'Oregon': ['Portland', 'Salem'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh'],
  'Rhode Island': ['Providence', 'Warwick'],
  'South Carolina': ['Charleston', 'Columbia'],
  'South Dakota': ['Sioux Falls', 'Rapid City'],
  'Tennessee': ['Nashville', 'Memphis'],
  'Texas': ['Houston', 'Dallas'],
  'Utah': ['Salt Lake City', 'Provo'],
  'Vermont': ['Burlington', 'Montpelier'],
  'Virginia': ['Virginia Beach', 'Richmond'],
  'Washington': ['Seattle', 'Spokane'],
  'West Virginia': ['Charleston', 'Huntington'],
  'Wisconsin': ['Milwaukee', 'Madison'],
  'Wyoming': ['Cheyenne', 'Casper']
};

const PRACTICE_AREAS = [
  'Commercial Disputes',
  'Employment Law',
  'Family Law',
  'Real Estate',
  'Intellectual Property',
  'Construction',
  'Healthcare',
  'Environmental',
  'Securities',
  'Contract Disputes',
  'Personal Injury',
  'Insurance',
  'Labor Relations',
  'Technology',
  'Banking & Finance'
];

// Generate random name
const getRandomName = (index) => {
  return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]}`;
};

// Generate random practice areas
const getRandomPracticeAreas = (seed) => {
  const count = 2 + (seed % 3); // 2-4 practice areas
  const shuffled = [...PRACTICE_AREAS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate ideology score based on state and index
const getIdeologyScore = (state, index) => {
  const liberalStates = ['California', 'New York', 'Massachusetts', 'Vermont', 'Washington', 'Oregon', 'Hawaii', 'Maryland', 'Connecticut', 'Rhode Island'];
  const conservativeStates = ['Alabama', 'Wyoming', 'West Virginia', 'Mississippi', 'Oklahoma', 'Idaho', 'Arkansas', 'South Carolina', 'Utah', 'Tennessee'];

  if (liberalStates.includes(state)) {
    return index % 2 === 0 ? -1.5 : -0.5; // Lean liberal
  } else if (conservativeStates.includes(state)) {
    return index % 2 === 0 ? 1.5 : 0.5; // Lean conservative
  } else {
    return index % 3 === 0 ? -0.8 : (index % 3 === 1 ? 0.8 : 0); // Mix
  }
};

// Generate ideology label
const getIdeologyLabel = (score) => {
  if (score <= -1) return 'liberal';
  if (score >= 1) return 'conservative';
  return 'neutral';
};

// Generate hourly rate between $120-$440
const getHourlyRate = (yearsExp, index) => {
  const baseRate = 120 + (yearsExp * 10);
  const variation = (index % 5) * 15;
  return Math.min(440, baseRate + variation);
};

// Generate mock mediators
export const generateMockMediators = () => {
  const mediators = [];
  let globalIndex = 0;

  US_STATES.forEach((state, stateIndex) => {
    const cities = CITIES[state];

    // Generate 2 mediators per state
    for (let i = 0; i < 2; i++) {
      const yearsExperience = 5 + (globalIndex % 25); // 5-30 years
      const totalMediations = 10 + (globalIndex % 200); // 10-210 mediations
      const rating = 3.5 + ((globalIndex % 15) / 10); // 3.5-5.0 rating
      const ideologyScore = getIdeologyScore(state, i);

      const mediator = {
        _id: `mediator_${globalIndex}`,
        name: getRandomName(globalIndex),
        location: {
          city: cities[i],
          state: state
        },
        yearsExperience,
        rating: Math.min(5, rating),
        totalMediations,
        practiceAreas: getRandomPracticeAreas(globalIndex),
        ideologyScore,
        ideology: getIdeologyLabel(ideologyScore),
        hourlyRate: getHourlyRate(yearsExperience, globalIndex),
        certifications: [
          'Certified Mediator',
          yearsExperience > 15 ? 'Advanced Mediation Certification' : null,
          yearsExperience > 20 ? 'Master Mediator' : null
        ].filter(Boolean),
        bio: `Experienced mediator specializing in ${getRandomPracticeAreas(globalIndex)[0].toLowerCase()} with ${yearsExperience} years of practice.`
      };

      mediators.push(mediator);
      globalIndex++;
    }
  });

  return mediators;
};

// Pre-generate mediators
export const MOCK_MEDIATORS = generateMockMediators();

// Helper to categorize by ideology
export const categorizeMediatorsByIdeology = (mediators) => {
  return {
    liberal: mediators.filter(m => m.ideology === 'liberal'),
    neutral: mediators.filter(m => m.ideology === 'neutral'),
    conservative: mediators.filter(m => m.ideology === 'conservative')
  };
};
