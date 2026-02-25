# Data Organizer Service

Converts unstructured text into structured JSON using AI (HuggingFace Transformers).

## Overview

The Data Organizer implements a **structured prompt pattern** for data extraction:

1. Takes unstructured text (mediator bios, court records, etc.)
2. Applies a system prompt for JSON extraction
3. Returns structured data matching your schema

**Cost:** 100% FREE (uses HuggingFace API)

---

## Use Cases

### 1. **Mediator Bio Parsing**

**Input (unstructured):**
```
Dr. Sarah Martinez is a highly experienced mediator based in San Francisco, California.
She earned her J.D. from Stanford Law School and holds an LL.M. in Dispute Resolution.
She is a member of the Federalist Society and previously worked at Morrison & Foerster LLP.
```

**Output (structured):**
```json
{
  "name": "Dr. Sarah Martinez",
  "credentials": ["J.D.", "LL.M."],
  "yearsExperience": 20,
  "practiceAreas": ["Employment Law", "IP Disputes"],
  "lawFirm": null,
  "previousEmployers": ["Morrison & Foerster LLP"],
  "education": ["Stanford Law School", "Harvard Law School"],
  "barAdmissions": ["California"],
  "publications": [],
  "memberships": ["Federalist Society"]
}
```

---

### 2. **Signal Extraction** (for Signal collection)

**Input:**
```
Member of the Federalist Society since 2010. Partner at Jones Day (2015-present).
Authored "Mediation Ethics" in Harvard Law Review (2021).
```

**Output:**
```json
[
  {
    "type": "MEMBERSHIP",
    "value": "Federalist Society",
    "startDate": "2010-01-01",
    "endDate": null,
    "source": "bio",
    "details": "Member since 2010",
    "weight": 0.7,
    "mediatorId": "mediator-123"
  },
  {
    "type": "EMPLOYMENT",
    "value": "Jones Day",
    "startDate": "2015-01-01",
    "endDate": null,
    "source": "bio",
    "details": "Partner (2015-present)",
    "weight": 0.6
  },
  {
    "type": "PUBLICATION",
    "value": "Mediation Ethics",
    "startDate": "2021-01-01",
    "endDate": null,
    "source": "bio",
    "details": "Published in Harvard Law Review",
    "weight": 0.4
  }
]
```

**Signal Weights:**
| Type | Weight | Example |
|---|---|---|
| DONATION | 0.8 | FEC donation to RNC |
| MEMBERSHIP | 0.7 | Federalist Society, ACS |
| EMPLOYMENT | 0.6 | Partner at BigLaw firm |
| PANEL | 0.5 | Bar association committee |
| PUBLICATION | 0.4 | Journal article |
| SPEAKING | 0.3 | Conference presentation |

---

### 3. **Firm Extraction with Aliases**

**Input:**
```
She worked at Morrison & Foerster LLP (also known as MoFo) and Jones Day.
```

**Output:**
```json
[
  {
    "name": "Morrison & Foerster LLP",
    "aliases": ["MoFo", "Morrison Foerster"]
  },
  {
    "name": "Jones Day",
    "aliases": ["Jones, Day, Reavis & Pogue"]
  }
]
```

---

## API

### `extractMediatorProfile(bioText)`

Extracts structured mediator data from unstructured bio text.

```javascript
const dataOrganizer = require('./services/ai/dataOrganizer');

const bio = 'Dr. John Smith is a mediator with 15 years of experience...';
const profile = await dataOrganizer.extractMediatorProfile(bio);

console.log(profile);
// {
//   name: 'Dr. John Smith',
//   yearsExperience: 15,
//   ...
// }
```

**Returns:**
```typescript
{
  name: string | null
  credentials: string[]
  yearsExperience: number | null
  practiceAreas: string[]
  lawFirm: string | null
  previousEmployers: string[]
  education: string[]
  barAdmissions: string[]
  publications: string[]
  memberships: string[]
}
```

---

### `extractSignals(text, mediatorId)`

Extracts signals (employment, memberships, publications) for the Signal collection.

```javascript
const signals = await dataOrganizer.extractSignals(bio, mediatorId);

// Save to Signal collection (when created):
// await Signal.insertMany(signals);
```

**Returns:** `Array<Signal>`

```typescript
interface Signal {
  type: 'EMPLOYMENT' | 'PUBLICATION' | 'MEMBERSHIP' | 'PANEL' | 'SPEAKING' | 'DONATION'
  value: string              // Firm name, org name, article title, etc.
  startDate: string | null   // YYYY-MM-DD
  endDate: string | null
  source: string             // 'bio', 'recap', 'linkedin', etc.
  details: string            // Additional context
  weight: number             // 0.3-0.8 based on signal type
  mediatorId: string
  createdAt: Date
}
```

---

### `extractFirms(text)`

Extracts law firm names with aliases.

```javascript
const firms = await dataOrganizer.extractFirms('Worked at Morrison & Foerster (MoFo)');

// Save to Firm collection (when created):
// await Firm.insertMany(firms);
```

---

### `extractCaseData(caseText)`

Extracts structured case data from RECAP records.

```javascript
const caseData = await dataOrganizer.extractCaseData(recapHTML);

console.log(caseData);
// {
//   docketNumber: '1:23-cv-12345',
//   caseName: 'Smith v. Jones',
//   court: 'SDNY',
//   parties: ['Smith', 'Jones'],
//   ...
// }
```

---

## Integration with Scraping Pipeline

### Enhanced `mediatorScraper.scrapeMediatorProfile()`

```javascript
const scraper = require('./services/scraping/mediatorScraper');

// Traditional CSS-only scraping
const mediator1 = await scraper.scrapeMediatorProfile(url, 'generic', false, false);

// AI-enhanced scraping (extracts from bio text)
const mediator2 = await scraper.scrapeMediatorProfile(url, 'generic', false, true);
```

**Parameters:**
- `url`: Mediator profile URL
- `sourceType`: 'generic' | 'directory' | 'law_firm_website'
- `useDynamic`: false = static (Cheerio), true = dynamic (Playwright)
- `useAI`: **true = uses dataOrganizer for bio extraction**

**What happens:**
1. Scraper extracts data using CSS selectors (name, email, phone, etc.)
2. If `useAI = true`, it also extracts bio text and sends to dataOrganizer
3. AI returns structured data (credentials, memberships, publications)
4. CSS data + AI data are merged (AI takes precedence for richer fields)
5. Signals are extracted and logged (ready for Signal collection)

---

## Example: Full Scraping Flow

```javascript
const scraper = require('./services/scraping/mediatorScraper');

// Scrape with AI enhancement
const mediator = await scraper.scrapeMediatorProfile(
  'https://example.com/mediator/john-smith',
  'law_firm_website',
  false,  // static scraping
  true    // USE AI
);

console.log(mediator);
// {
//   name: 'John Smith',
//   credentials: ['J.D.', 'LL.M.'],  // ← from AI
//   yearsExperience: 15,               // ← from AI
//   specializations: ['Employment'],   // ← from AI
//   lawFirm: 'Jones Day',             // ← from CSS or AI
//   biasIndicators: {
//     politicalAffiliations: ['Federalist Society']  // ← from AI
//   },
//   dataQuality: { completeness: 85 }
// }
```

---

## Fallback Behavior

If HuggingFace API fails or returns invalid JSON, the service falls back to **regex-based extraction**:

- **Name:** Capitalized tokens (e.g., "John Smith")
- **Credentials:** J.D., LL.M., Ph.D., Esq.
- **Years:** `\d+ years of experience`
- **Memberships:** Federalist Society, American Constitution Society (keyword match)

This ensures scraping never fails completely, even if AI is unavailable.

---

## Testing

Run the test script:

```bash
cd backend
node src/scripts/test-data-organizer.js
```

**Sample output:**
```json
{
  "name": "Dr. Sarah Martinez",
  "credentials": ["J.D.", "LL.M."],
  "yearsExperience": 20,
  "memberships": ["Federalist Society"],
  ...
}

Signals:
[
  { "type": "MEMBERSHIP", "value": "Federalist Society", "weight": 0.7 },
  { "type": "EMPLOYMENT", "value": "Morrison & Foerster LLP", "weight": 0.6 },
  ...
]
```

---

## Next Steps

1. **Create Signal model** (`backend/src/models/Signal.js`)
2. **Create Firm model** (`backend/src/models/Firm.js`)
3. **Save signals** in `mediatorScraper.scrapeMediatorProfile()`:
   ```javascript
   await Signal.insertMany(signals.map(s => ({ ...s, mediatorId: mediator._id })));
   ```
4. **Build batch processing** for existing mediators:
   ```javascript
   const mediators = await Mediator.find({ bio: { $exists: true } });
   for (const m of mediators) {
     const signals = await dataOrganizer.extractSignals(m.bio, m._id);
     await Signal.insertMany(signals);
   }
   ```

---

## Cost

**$0/month** — uses HuggingFace Inference API (free tier)

No credit card required. Rate limits: ~1000 requests/day on free tier.
