# Data Aggregation & Affiliation Detection Guide

## Overview

FairMediator now includes a comprehensive data aggregation system with:
- **Web scraping** using Playwright (dynamic) and Cheerio (static)
- **Affiliation detection** with NLP-like techniques
- **Conflict of interest** checking
- **Automated scheduling** with cron jobs

## Architecture

### 1. Mediator Data Model (`src/models/Mediator.js`)

Stores comprehensive mediator information:
- Basic info (name, email, phone, location)
- Professional data (law firm, employers, specializations)
- Ideology scoring (-10 to +10 scale)
- Affiliation network (law firms, organizations, cases)
- Conflict detection metadata
- Data quality metrics

### 2. Scraping Service (`src/services/scraping/mediatorScraper.js`)

**Features:**
- Static HTML scraping with Cheerio (fast, low resource)
- Dynamic page scraping with Playwright (handles JavaScript)
- Automatic data extraction and storage
- Rate limiting and error handling

**Methods:**
- `scrapeMediatorProfile(url, sourceType, useDynamic)` - Scrape single profile
- `scrapeMediatorList(url)` - Extract profile URLs from directory
- `extractMediatorData($, url)` - Parse HTML and extract data

### 3. Affiliation Detection (`src/services/scraping/affiliationDetector.js`)

**NLP-like Capabilities:**
- Entity extraction (law firms, companies, organizations)
- Political ideology detection using keyword analysis
- Conflict of interest checking
- Affiliation network graph building

**Methods:**
- `analyzeMediatorProfile(mediatorId)` - Full NLP analysis
- `checkConflicts(mediatorId, parties)` - Check for conflicts
- `buildAffiliationGraph(mediatorId)` - Build network graph
- `detectIdeology(text)` - Analyze political leanings

### 4. Cron Scheduler (`src/services/scraping/cronScheduler.js`)

**Automated Tasks:**
- **Daily Refresh** (2:00 AM): Updates stale mediator data (7+ days old)
- **Weekly Analysis** (Sunday 3:00 AM): Runs affiliation analysis

## API Endpoints

### Scraping APIs

#### 1. Scrape Mediator Profile
```http
POST /api/scraping/scrape-profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com/mediator/john-doe",
  "sourceType": "jams",
  "useDynamic": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mediator profile scraped successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "lawFirm": "Doe & Associates",
    "specializations": ["Commercial", "Employment"],
    "dataQuality": {
      "completeness": 75
    }
  }
}
```

#### 2. Analyze Mediator
```http
POST /api/scraping/analyze-mediator
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mediatorId": "...",
    "mediatorName": "John Doe",
    "ideology": {
      "score": -3,
      "sentiment": "liberal",
      "confidence": "medium"
    },
    "detectedEntities": {
      "lawFirms": ["Doe & Associates LLP"],
      "companies": ["Tech Corp Inc."],
      "organizations": []
    },
    "affiliationsCount": 5,
    "casesCount": 23
  }
}
```

#### 3. Check Conflicts
```http
POST /api/scraping/check-conflicts
Authorization: Bearer {token}
Content-Type: application/json

{
  "mediatorId": "507f1f77bcf86cd799439011",
  "parties": ["Big Law Firm LLP", "Tech Corp Inc."]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mediatorId": "...",
    "mediatorName": "John Doe",
    "parties": ["Big Law Firm LLP", "Tech Corp Inc."],
    "conflicts": [
      {
        "entity": "Big Law Firm LLP",
        "entityType": "law_firm",
        "relationship": "Partner",
        "riskLevel": "high",
        "lastChecked": "2025-11-16T..."
      }
    ],
    "riskLevel": "high"
  }
}
```

#### 4. Get Affiliation Graph
```http
GET /api/scraping/affiliation-graph/:mediatorId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "...", "label": "John Doe", "type": "mediator" },
      { "id": "aff_0", "label": "Law Firm LLP", "type": "law_firm" },
      { "id": "case_0", "label": "Smith v. Jones", "type": "case" }
    ],
    "edges": [
      {
        "from": "...",
        "to": "aff_0",
        "relationship": "Partner",
        "isCurrent": true,
        "risk": "high"
      }
    ]
  }
}
```

#### 5. Get Scraping Stats
```http
GET /api/scraping/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMediators": 1523,
    "verifiedMediators": 892,
    "activeMediators": 1401,
    "avgDataQuality": 68,
    "ideologyDistribution": [...]
  }
}
```

## Usage Examples

### Manual Scraping (Admin)

```javascript
// Scrape a single mediator profile
const response = await fetch('http://localhost:5001/api/scraping/scrape-profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_admin_token'
  },
  body: JSON.stringify({
    url: 'https://www.jamsadr.com/mediator/john-doe',
    sourceType: 'jams',
    useDynamic: true
  })
});

const data = await response.json();
console.log(`Scraped: ${data.data.name} (${data.data.dataQuality.completeness}% complete)`);
```

### Conflict Checking

```javascript
// Check for conflicts when user enters case parties
const checkConflicts = async (mediatorId, parties) => {
  const response = await fetch('http://localhost:5001/api/scraping/check-conflicts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer user_token'
    },
    body: JSON.stringify({ mediatorId, parties })
  });

  const { data } = await response.json();
  
  if (data.riskLevel === 'high') {
    alert(`⚠️ HIGH CONFLICT RISK: ${data.conflicts.length} potential conflicts found!`);
  }
  
  return data;
};
```

### Ideology Analysis

```javascript
// Analyze mediator political leanings
const analyzeMediator = async (mediatorId) => {
  const response = await fetch('http://localhost:5001/api/scraping/analyze-mediator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer user_token'
    },
    body: JSON.stringify({ mediatorId })
  });

  const { data } = await response.json();
  
  console.log(`Ideology: ${data.ideology.sentiment} (score: ${data.ideology.score})`);
  console.log(`Confidence: ${data.ideology.confidence}`);
  
  return data;
};
```

## Cron Jobs

### Enable in Production

Cron jobs automatically start when `NODE_ENV=production`:

```bash
NODE_ENV=production node src/server.js
```

### Manual Control

```javascript
const cronScheduler = require('./services/scraping/cronScheduler');

// Start all jobs
cronScheduler.startAll();

// Stop all jobs
cronScheduler.stopAll();
```

### Customize Schedule

Edit `src/services/scraping/cronScheduler.js`:

```javascript
// Change daily refresh to run at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  // refresh logic
});

// Add custom job
cron.schedule('0 12 * * 1-5', async () => {
  // runs weekdays at noon
});
```

## Data Quality

The system calculates data completeness percentage based on:
- Name, email, phone
- Location (city, state)
- Law firm, specializations
- Years of experience

Access via:
```javascript
mediator.calculateDataQuality(); // Returns percentage
console.log(mediator.dataQuality.completeness); // e.g., 75
```

## Best Practices

1. **Rate Limiting**: Wait 2-3 seconds between scraping requests
2. **Use Static First**: Try Cheerio before Playwright for better performance
3. **Batch Processing**: Limit scraping to 50-100 profiles per run
4. **Error Handling**: Always wrap scraping in try/catch
5. **Data Verification**: Mark scraped data as `needsReview: true`

## Security

- Scraping endpoints require authentication
- Admin role required for manual scraping
- Rate limiting prevents abuse
- Cron jobs only run in production

## Next Steps

1. Add more scraping sources (state bar associations, court records)
2. Implement machine learning for better ideology detection
3. Add image/document scraping for additional context
4. Create admin dashboard for scraping management
5. Add webhook notifications for conflict detection

