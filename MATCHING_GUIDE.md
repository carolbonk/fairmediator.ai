# Mediator Matching & SWOT Analysis Guide

## Overview

FairMediator includes a sophisticated matching and analysis system with:
- **Weighted matching algorithm** with 5 scoring criteria
- **SWOT analysis generator** using rule-based engine
- **Side-by-side comparison** of multiple mediators
- **Personalized recommendations** based on user preferences
- **Export functionality** for markdown and JSON formats

## Architecture

### 1. Matching Engine (`src/services/matching/matchingEngine.js`)

The matching engine uses a weighted scoring algorithm to rank mediators based on multiple criteria.

**Scoring Criteria:**
1. **Expertise** (35% weight) - Matches required specializations
2. **Experience** (20% weight) - Years in practice, cases handled
3. **Ideology** (15% weight) - Political neutrality score
4. **Location** (15% weight) - Geographic proximity
5. **Conflict Risk** (15% weight) - Potential conflicts of interest

**Methods:**
- `findMatchingMediators(criteria, options)` - Search and rank mediators
- `calculateOverallScore(mediator, criteria, weights)` - Score individual mediator
- `compareMediators(mediatorIds, criteria)` - Compare multiple mediators
- `getRecommendations(userId, criteria)` - Get personalized recommendations

### 2. SWOT Generator (`src/services/matching/swotGenerator.js`)

Generates comprehensive Strengths, Weaknesses, Opportunities, and Threats analysis using rule-based logic.

**Features:**
- Conditional rule engine with 20+ built-in rules
- Context-aware analysis (integrates with conflict detection)
- Assessment scoring system
- Markdown and JSON export formats
- Comparison mode for multiple mediators

**Methods:**
- `generateSwot(mediatorId, contextData)` - Generate full SWOT analysis
- `compareSwot(mediatorIds, contextData)` - Compare multiple SWOTs
- `exportAsMarkdown(swot)` - Export formatted markdown
- `exportAsJson(swot)` - Export structured JSON

## API Endpoints

### Matching APIs

#### 1. Search and Rank Mediators
```http
POST /api/matching/search
Content-Type: application/json

{
  "criteria": {
    "specializations": ["Commercial", "Employment"],
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "maxDistance": 50
    },
    "ideology": "neutral",
    "parties": ["Tech Corp Inc.", "Employee Union"]
  },
  "options": {
    "limit": 20,
    "minScore": 60,
    "weights": {
      "expertise": 0.40,
      "experience": 0.25,
      "ideology": 0.10,
      "location": 0.15,
      "conflictRisk": 0.10
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "mediator": {
          "_id": "...",
          "name": "Jane Smith",
          "specializations": ["Commercial", "Employment", "Labor"],
          "yearsExperience": 15,
          "location": { "city": "San Francisco", "state": "CA" }
        },
        "score": {
          "overallScore": 87,
          "breakdown": {
            "expertise": 95,
            "experience": 85,
            "ideology": 90,
            "location": 100,
            "conflictRisk": 80
          },
          "matchedSpecializations": ["Commercial", "Employment"],
          "riskLevel": "low"
        }
      }
    ],
    "count": 15,
    "criteria": {...}
  }
}
```

#### 2. Calculate Match Score
```http
POST /api/matching/score
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorId": "507f1f77bcf86cd799439011",
  "criteria": {
    "specializations": ["Technology", "IP"],
    "ideology": "neutral",
    "location": { "city": "Austin", "state": "TX" },
    "parties": []
  },
  "weights": {
    "expertise": 0.50,
    "experience": 0.20,
    "ideology": 0.10,
    "location": 0.10,
    "conflictRisk": 0.10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 78,
    "breakdown": {
      "expertise": 85,
      "experience": 75,
      "ideology": 95,
      "location": 60,
      "conflictRisk": 90
    },
    "matchedSpecializations": ["Technology"],
    "riskLevel": "low"
  }
}
```

#### 3. Compare Mediators
```http
POST /api/matching/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "criteria": {
    "specializations": ["Commercial"],
    "ideology": "neutral"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "mediator": { "_id": "...", "name": "Jane Smith" },
        "score": { "overallScore": 87, "breakdown": {...} }
      },
      {
        "mediator": { "_id": "...", "name": "John Doe" },
        "score": { "overallScore": 82, "breakdown": {...} }
      }
    ],
    "criteria": {...}
  }
}
```

#### 4. Get Personalized Recommendations
```http
POST /api/matching/recommend
Authorization: Bearer {token}
Content-Type: application/json

{
  "criteria": {
    "specializations": ["Family", "Divorce"],
    "location": { "state": "NY" },
    "ideology": "neutral"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "mediator": {...},
        "score": {...},
        "reason": "High expertise match with neutral ideology"
      }
    ],
    "count": 10
  }
}
```

### SWOT APIs

#### 5. Generate SWOT Analysis
```http
POST /api/matching/swot
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorId": "507f1f77bcf86cd799439011",
  "contextData": {
    "parties": ["Big Law Firm LLP", "Tech Startup Inc."]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mediatorId": "507f1f77bcf86cd799439011",
    "mediatorName": "Jane Smith",
    "strengths": [
      "Extensive experience with 15 years in mediation",
      "Diverse expertise across 6 practice areas",
      "Verified mediator with confirmed credentials",
      "Neutral political stance ensures unbiased mediation",
      "No conflicts of interest identified with case parties"
    ],
    "weaknesses": [],
    "opportunities": [
      "Local mediator in San Francisco, CA - convenient for in-person sessions",
      "Active professional affiliations provide ongoing training and resources"
    ],
    "threats": [],
    "assessment": {
      "score": 65,
      "rating": "excellent",
      "recommendation": "Highly recommended - strong candidate with minimal concerns",
      "breakdown": {
        "strengths": 5,
        "weaknesses": 0,
        "opportunities": 2,
        "threats": 0
      }
    },
    "generatedAt": "2025-11-16T12:34:56.789Z"
  }
}
```

#### 6. Compare SWOT Analyses
```http
POST /api/matching/swot/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "contextData": {
    "parties": ["Company A", "Company B"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "mediatorId": "...",
        "mediatorName": "Jane Smith",
        "strengths": [...],
        "weaknesses": [...],
        "opportunities": [...],
        "threats": [...],
        "assessment": {
          "score": 65,
          "rating": "excellent"
        }
      },
      {
        "mediatorId": "...",
        "mediatorName": "John Doe",
        "strengths": [...],
        "weaknesses": [...],
        "opportunities": [...],
        "threats": [...],
        "assessment": {
          "score": 48,
          "rating": "good"
        }
      }
    ],
    "count": 2,
    "timestamp": "2025-11-16T12:34:56.789Z"
  }
}
```

#### 7. Export SWOT Analysis
```http
GET /api/matching/swot/:mediatorId/export?format=markdown
Authorization: Bearer {token}
```

**Markdown Response:**
```markdown
# SWOT Analysis: Jane Smith

**Generated:** 11/16/2025, 12:34:56 PM

**Overall Assessment:** EXCELLENT (Score: 65)

**Recommendation:** Highly recommended - strong candidate with minimal concerns

---

## 💪 Strengths

- Extensive experience with 15 years in mediation
- Diverse expertise across 6 practice areas
- Verified mediator with confirmed credentials
- Neutral political stance ensures unbiased mediation

## ⚠️ Weaknesses

- None identified

## 🌟 Opportunities

- Local mediator in San Francisco, CA - convenient for in-person sessions
- Active professional affiliations provide ongoing training and resources

## 🚨 Threats

- None identified
```

**JSON Response (`?format=json`):**
```json
{
  "success": true,
  "data": {
    "template": "swot_analysis_v1",
    "mediator": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Jane Smith"
    },
    "analysis": {
      "strengths": [...],
      "weaknesses": [...],
      "opportunities": [...],
      "threats": [...]
    },
    "assessment": {...},
    "metadata": {
      "generatedAt": "2025-11-16T12:34:56.789Z",
      "version": "1.0"
    }
  }
}
```

## Usage Examples

### Frontend Integration - Search Mediators

```javascript
const searchMediators = async (criteria) => {
  const response = await fetch('http://localhost:5001/api/matching/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      criteria: {
        specializations: criteria.practiceAreas,
        location: {
          city: criteria.city,
          state: criteria.state,
          maxDistance: 50
        },
        ideology: 'neutral',
        parties: criteria.involvedParties
      },
      options: {
        limit: 20,
        minScore: 60
      }
    })
  });

  const { data } = await response.json();
  return data.matches;
};

// Usage
const matches = await searchMediators({
  practiceAreas: ['Commercial', 'Employment'],
  city: 'San Francisco',
  state: 'CA',
  involvedParties: ['Tech Corp Inc.']
});

console.log(`Found ${matches.length} matching mediators`);
matches.forEach(match => {
  console.log(`${match.mediator.name}: ${match.score.overallScore}% match`);
});
```

### Generate and Display SWOT

```javascript
const generateSwot = async (mediatorId, parties = []) => {
  const response = await fetch('http://localhost:5001/api/matching/swot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      mediatorId,
      contextData: { parties }
    })
  });

  const { data } = await response.json();
  return data;
};

// Usage
const swot = await generateSwot('507f1f77bcf86cd799439011', ['Company A', 'Company B']);

console.log(`SWOT Analysis for ${swot.mediatorName}`);
console.log(`Rating: ${swot.assessment.rating.toUpperCase()}`);
console.log(`Score: ${swot.assessment.score}`);
console.log(`\nStrengths (${swot.strengths.length}):`);
swot.strengths.forEach(s => console.log(`  ✓ ${s}`));

if (swot.threats.length > 0) {
  console.log(`\n⚠️ Threats (${swot.threats.length}):`);
  swot.threats.forEach(t => console.log(`  ⚠ ${t}`));
}
```

### Compare Multiple Mediators

```javascript
const compareMediators = async (mediatorIds, criteria) => {
  const response = await fetch('http://localhost:5001/api/matching/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ mediatorIds, criteria })
  });

  const { data } = await response.json();
  return data.comparisons;
};

// Usage
const comparison = await compareMediators(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  { specializations: ['Commercial'], ideology: 'neutral' }
);

comparison.forEach(({ mediator, score }) => {
  console.log(`${mediator.name}: ${score.overallScore}% overall`);
  console.log(`  - Expertise: ${score.breakdown.expertise}%`);
  console.log(`  - Experience: ${score.breakdown.experience}%`);
  console.log(`  - Conflict Risk: ${score.breakdown.conflictRisk}%`);
});
```

### Export SWOT as Markdown

```javascript
const exportSwot = async (mediatorId) => {
  const response = await fetch(
    `http://localhost:5001/api/matching/swot/${mediatorId}/export?format=markdown`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const markdown = await response.text();

  // Download as file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `swot_${mediatorId}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
```

## Scoring Algorithm Details

### Expertise Score (0-100)
```
Score = (Matched Specializations / Required Specializations) × 100
```
- Partial matching supported (e.g., "Commercial Law" matches "Commercial")
- Bonus points for exact matches
- Penalized if mediator has no relevant specializations

### Experience Score (0-100)
```
Years Score = min(yearsExperience / 20 × 100, 100)
Cases Score = min(casesHandled / 100 × 100, 100)
Final Score = (Years Score × 0.6) + (Cases Score × 0.4)
```
- Caps at 20 years and 100 cases for maximum score
- Weighted towards years of experience

### Ideology Score (0-100)
```
If criteria = 'neutral':
  Score = max(0, 100 - |ideologyScore| × 10)
If criteria = 'liberal' or 'conservative':
  Score = max(0, 100 - |ideologyScore - targetScore| × 10)
```
- Ideology scale: -10 (very liberal) to +10 (very conservative)
- Neutral preference rewards scores close to 0
- Specific ideology preference rewards alignment

### Location Score (0-100)
```
Distance (miles) = calculateDistance(mediator.location, criteria.location)
If distance <= maxDistance:
  Score = 100 - (distance / maxDistance × 50)
Else:
  Score = 50 - min((distance - maxDistance) / 100, 50)
```
- Perfect score for same city
- Decreases with distance
- Minimum score of 0 for very distant locations

### Conflict Risk Score (0-100)
```
Conflicts = detectConflicts(mediator, criteria.parties)
If no conflicts:
  Score = 100
Else:
  High Risk Conflicts = count where riskLevel = 'high'
  Medium Risk Conflicts = count where riskLevel = 'medium'
  Score = max(0, 100 - (High × 40) - (Medium × 20))
```
- Perfect score if no conflicts
- Heavily penalized for high-risk conflicts
- Moderately penalized for medium-risk conflicts

## SWOT Rules Customization

### Adding Custom Rules

Edit `src/services/matching/swotGenerator.js`:

```javascript
constructor() {
  this.rules = {
    strengths: [
      // Add your custom strength rule
      {
        condition: (m) => m.certifications?.includes('Advanced Mediator'),
        text: 'Holds advanced mediator certification'
      },
      // ... existing rules
    ],
    weaknesses: [
      // Add your custom weakness rule
      {
        condition: (m) => !m.insurance?.hasLiability,
        text: 'No professional liability insurance on file'
      }
    ]
  };
}
```

### Rule Template Variables

Available placeholders in rule text:
- `{{years}}` - mediator.yearsExperience
- `{{count}}` - count of items (specializations, cases, etc.)
- `{{city}}` - mediator.location.city
- `{{state}}` - mediator.location.state

### Assessment Scoring

```javascript
Score = (Strengths × 10) + (Weaknesses × -8) + (Opportunities × 5) + (Threats × -12)

Rating:
  score >= 40: 'excellent'
  score >= 20: 'good'
  score >= 0:  'fair'
  score < 0:   'poor'
```

## Best Practices

### 1. Search Optimization
- Always specify minimum score threshold (recommended: 60-70)
- Limit results to 20-50 for best performance
- Use custom weights based on case importance

### 2. Context-Aware SWOT
- Always provide `parties` in contextData for conflict detection
- Include additional context for more accurate analysis
- Generate SWOT after scoring to focus on top candidates

### 3. Comparison Strategy
- Compare max 3-5 mediators at once for clarity
- Use consistent criteria across all comparisons
- Sort by overall score for easy decision making

### 4. Weight Customization
- Adjust weights based on case type:
  - Complex cases: Increase expertise weight (0.40-0.50)
  - Sensitive cases: Increase ideology/conflict weights
  - Local disputes: Increase location weight (0.25-0.30)

### 5. Caching Recommendations
- Cache search results for 5-10 minutes
- Invalidate cache when mediator data updates
- Use pagination for large result sets

## Integration with Scraping

The matching system automatically integrates with scraped mediator data:

```javascript
// After scraping a new mediator
const mediator = await mediatorScraper.scrapeMediatorProfile(url);

// Immediately available for matching
const matches = await matchingEngine.findMatchingMediators({
  specializations: mediator.specializations
});

// Generate SWOT analysis
const swot = await swotGenerator.generateSwot(mediator._id);
```

## Performance Considerations

- **Search**: ~200-500ms for 1000+ mediators
- **Score Calculation**: ~50-100ms per mediator
- **SWOT Generation**: ~100-200ms per mediator
- **Comparison**: ~200-400ms for 3 mediators

**Optimization Tips:**
- Use database indexes on specializations, location, ideologyScore
- Cache frequently used search criteria
- Paginate results for large datasets
- Pre-calculate SWOT for top mediators

## Security

- All endpoints require authentication except `/api/matching/search`
- SWOT export requires user to be authenticated
- Comparison limited to 10 mediators per request
- Rate limiting applies to all matching endpoints

## Next Steps

1. Add machine learning for better weight optimization
2. Implement collaborative filtering for recommendations
3. Add historical success rate to scoring algorithm
4. Create admin dashboard for rule management
5. Add webhook notifications for new high-scoring matches
