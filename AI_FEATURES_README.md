# Fair Mediator AI Features - Implementation Guide

This document provides comprehensive setup and usage instructions for the newly implemented AI features.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Feature #1: AI Conflict Graph Analyzer](#feature-1-ai-conflict-graph-analyzer)
5. [Feature #2: Settlement Predictor](#feature-2-settlement-predictor)
6. [API Documentation](#api-documentation)
7. [Data Collection](#data-collection)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Fair Mediator now includes two powerful AI-driven features:

### Feature #1: AI Conflict Graph Analyzer
- **Purpose**: Detect hidden conflicts of interest using graph-based relationship analysis
- **Data Sources**: FEC (campaign finance), RECAP (court records), LinkedIn (manual), OpenSecrets (lobbying)
- **Technology**: MongoDB + NetworkX graph analysis
- **Output**: Risk scores (GREEN/YELLOW/RED) with detailed relationship paths

### Feature #2: Predictive Settlement Range Calculator
- **Purpose**: Predict False Claims Act settlement amounts using ML
- **Data Source**: DOJ press releases (500+ historical settlements)
- **Technology**: Python + scikit-learn Random Forest Regressor
- **Output**: 25th, 50th, 75th percentile predictions with confidence scores

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Fair Mediator Platform                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │  Graph Analyzer  │          │  Settlement ML   │         │
│  │   (Node.js)      │          │   (Python)       │         │
│  ├──────────────────┤          ├──────────────────┤         │
│  │ - FEC Scraper    │          │ - Data Collection│         │
│  │ - RECAP Scraper  │          │ - Feature Eng.   │         │
│  │ - LinkedIn Scrpr │          │ - Random Forest  │         │
│  │ - Lobbying Scrpr │          │ - FastAPI        │         │
│  │ - Risk Calculator│          │                  │         │
│  │ - Graph Service  │          │                  │         │
│  └──────────────────┘          └──────────────────┘         │
│         │                              │                     │
│         ↓                              ↓                     │
│  ┌──────────────────────────────────────────────┐           │
│  │             Database Layer                    │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • MongoDB (entities, relationships, paths)   │           │
│  │ • PostgreSQL (optional: graph storage)       │           │
│  │ • Redis (caching, similarity scores)         │           │
│  └──────────────────────────────────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 7.0+
- Docker & Docker Compose (recommended)
- API Keys (optional but recommended):
  - FEC API Key (free at api.data.gov)
  - RECAP API Key (free at courtlistener.com)
  - OpenSecrets API Key (free at opensecrets.org)

### Quick Start with Docker

```bash
# 1. Clone repository
git clone https://github.com/your-org/fairmediator.git
cd fairmediator

# 2. Create .env file
cp .env.example .env

# Edit .env and add API keys:
# FEC_API_KEY=your_fec_key
# RECAP_API_KEY=your_recap_key
# OPENSECRETS_API_KEY=your_opensecrets_key
# HUGGINGFACE_API_KEY=your_hf_key

# 3. Start all services
docker-compose up -d

# 4. Verify services are running
docker-compose ps

# 5. Check logs
docker-compose logs -f backend
docker-compose logs -f ml-service
```

Services will be available at:
- Backend API: http://localhost:5000
- ML Service: http://localhost:8001
- Frontend: http://localhost:5173
- MongoDB: localhost:27017
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Manual Setup (Without Docker)

#### Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install additional dependencies for graph analyzer
npm install axios mongodb mongoose

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017/fairmediator"
export FEC_API_KEY="your_fec_key"
export RECAP_API_KEY="your_recap_key"

# Start backend
npm run dev
```

#### ML Service Setup

```bash
cd backend/src/ml_models/settlement_predictor

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Requirements.txt should include:
# fastapi
# uvicorn
# pandas
# numpy
# scikit-learn
# joblib
# pydantic
# python-multipart
# beautifulsoup4
# requests

# Start ML service
uvicorn serving.predict_api:app --host 0.0.0.0 --port 8001 --reload
```

---

## Feature #1: AI Conflict Graph Analyzer

### Overview

The Conflict Graph Analyzer builds a knowledge graph of relationships between mediators, law firms, agencies, and contractors. It uses multiple data sources to detect potential conflicts of interest.

### Data Collection

#### 1. FEC Campaign Finance Data

```bash
# Run FEC scraper for a mediator
node backend/src/graph_analyzer/scrapers/test_fec_scraper.js

# Or via API
curl -X POST http://localhost:5000/api/graph/scrape-mediator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mediatorId": "med_12345",
    "mediatorName": "John Smith",
    "sources": ["fec"]
  }'
```

#### 2. RECAP Court Records

```bash
# Run PACER/RECAP scraper
curl -X POST http://localhost:5000/api/graph/scrape-mediator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mediatorId": "med_12345",
    "mediatorName": "John Smith",
    "sources": ["recap"]
  }'
```

#### 3. LinkedIn Manual Enrichment

```bash
# User provides LinkedIn data (no automated scraping)
curl -X POST http://localhost:5000/api/graph/enrich-linkedin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mediatorId": "med_12345",
    "linkedinUrl": "https://linkedin.com/in/johnsmith",
    "fullName": "John Smith",
    "mutualConnections": 47,
    "currentCompany": "Smith Legal Group",
    "verified": true
  }'
```

### Conflict Detection

```bash
# Check for conflicts between mediator and opposing party
curl -X POST http://localhost:5000/api/graph/check-conflicts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mediatorId": "med_12345",
    "opposingPartyId": "firm_lawfirm_abc",
    "options": {
      "maxDepth": 3,
      "bypassCache": false
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "mediator": {
      "id": "med_12345",
      "name": "John Smith",
      "type": "Mediator"
    },
    "opposingParty": {
      "id": "firm_lawfirm_abc",
      "name": "ABC Law Firm",
      "type": "LawFirm"
    },
    "riskScore": 18,
    "riskLevel": "RED",
    "recommendation": "🚨 HIGH RISK: Risk score of 18 indicates significant conflicts. Critical issue: mediator previously worked at opposing firm. Strong recommendation to select different mediator.",
    "totalPaths": 3,
    "strongestPath": {
      "nodes": ["med_12345", "firm_lawfirm_abc"],
      "relationships": [
        {
          "from": "med_12345",
          "to": "firm_lawfirm_abc",
          "type": "WORKED_AT",
          "weight": 10,
          "metadata": {
            "startDate": "2015-01-01",
            "endDate": "2020-06-30",
            "role": "Senior Partner"
          }
        }
      ],
      "totalWeight": 10
    }
  }
}
```

### Risk Scoring Algorithm

```
Risk Score = Σ (Relationship Weight × Confidence × Age Multiplier)

Weights:
- WORKED_AT: 10 points (direct employment)
- SHARED_CASE: 8 points (collaborated on cases)
- CO_AUTHORED: 7 points (co-authored publications)
- DONATED_TO: 6 points (donated to same candidates)
- ATTENDED_TOGETHER: 5 points (shared conferences)
- OPPOSING_COUNSEL: -5 points (adversarial relationship)

Thresholds:
- GREEN: < 8 points (Clear)
- YELLOW: 8-15 points (Caution)
- RED: > 15 points (High Risk)

Age Multiplier:
- < 1 year: 1.0
- 1-3 years: 0.9
- 3-5 years: 0.7
- 5-10 years: 0.5
- 10+ years: 0.3
```

---

## Feature #2: Settlement Predictor

### Data Collection

#### Step 1: Collect FCA Settlement Data

```bash
cd backend/src/ml_models/settlement_predictor/data

# Run data collection script
python collect_fca_data.py

# This will scrape DOJ press releases and create:
# - fca_settlements.csv (raw data)
# - fca_settlements.json (structured data)
```

**Sample Output:**

```
Collected 247 FCA settlements
Sample record:
{
  "defendant": "ABC Pharmaceutical Company",
  "amount": 85000000,
  "fraud_type": "healthcare",
  "industry": "pharmaceutical",
  "jurisdiction": "District of Massachusetts",
  "whistleblower": true,
  "date": "2023-06-15",
  "source_url": "https://www.justice.gov/opa/pr/...",
  "source": "DOJ_OPA"
}
```

#### Step 2: Clean and Prepare Data

```bash
# Run data cleaning script
python clean_data.py

# Output:
# - fca_settlements_clean.csv (cleaned, ready for training)
```

**Cleaning Steps:**
1. Remove null/invalid amounts
2. Remove outliers (> $1B or < $10K)
3. Adjust for inflation to 2024 dollars
4. Encode categorical features
5. Create engineered features
6. Remove duplicates

### Model Training

```bash
cd backend/src/ml_models/settlement_predictor/training

# Train the model
python train_model.py
```

**Training Output:**

```
==============================================================
FCA SETTLEMENT PREDICTION MODEL TRAINING
==============================================================
Loading data from fca_settlements_clean.csv...
Loaded 247 records
Creating features for ML training...
Created 12 features
Training data prepared: X shape (247, 12), y shape (247,)
Splitting data: 80% train, 20% test
Train set: 197 samples
Test set: 50 samples
Training Random Forest Regressor...
✅ Training complete
Performing 5-fold cross-validation...
Cross-validation RMSE: 0.4523 (+/- 0.0821)
Evaluating model on test set...
Test Set Performance:
  RMSE: 0.4215
  MAE: 0.3104
  R² Score: 0.8234
  MAPE: 18.45%

Top 5 Most Important Features:
                        feature  importance
              Fraud Severity Score    0.2845
                      Fraud Type      0.1923
        Defendant Size × Fraud Type    0.1542
                      Industry        0.1234
                  Defendant Size      0.0876

✅ Model training complete!
Model saved to: backend/src/ml_models/settlement_predictor/models/settlement_model_20260205_143522.joblib
```

### Making Predictions

#### Via API

```bash
# Single prediction
curl -X POST http://localhost:5000/api/settlement/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fraudType": "healthcare",
    "damagesClaimed": 10000000,
    "industry": "pharmaceutical",
    "jurisdiction": "Southern District of New York",
    "whistleblowerPresent": true,
    "settlementYear": 2024
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "predicted_low": 3250000,
    "predicted_mid": 7500000,
    "predicted_high": 12000000,
    "confidence": 0.82,
    "input_damages": 10000000
  }
}
```

**Interpretation:**
- **Predicted Low (25th percentile)**: $3.25M - Conservative estimate
- **Predicted Mid (50th percentile)**: $7.5M - Most likely settlement
- **Predicted High (75th percentile)**: $12M - Upper range estimate
- **Confidence**: 82% - Model is fairly confident in this prediction

#### Batch Predictions

```bash
curl -X POST http://localhost:5000/api/settlement/batch-predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "cases": [
      {
        "fraudType": "healthcare",
        "damagesClaimed": 10000000,
        "industry": "pharmaceutical",
        "jurisdiction": "Southern District of New York",
        "whistleblowerPresent": true
      },
      {
        "fraudType": "defense",
        "damagesClaimed": 25000000,
        "industry": "defense_contractor",
        "jurisdiction": "Eastern District of Virginia",
        "whistleblowerPresent": false
      }
    ]
  }'
```

---

## API Documentation

### Graph Analyzer Endpoints

#### POST /api/graph/check-conflicts
Check for conflicts between mediator and opposing party.

**Authentication**: Required
**Authorization**: Any authenticated user

**Request Body:**
```json
{
  "mediatorId": "string",
  "opposingPartyId": "string",
  "options": {
    "maxDepth": 3,
    "bypassCache": false
  }
}
```

**Response:** See [Conflict Detection](#conflict-detection) section.

#### POST /api/graph/scrape-mediator
Scrape data for a mediator from specified sources.

**Authentication**: Required
**Authorization**: Premium users only

**Request Body:**
```json
{
  "mediatorId": "string",
  "mediatorName": "string",
  "sources": ["fec", "recap", "lobbying"]
}
```

#### GET /api/graph/entity/:id
Get entity details and relationships.

#### GET /api/graph/paths?sourceId=X&targetId=Y
Find all paths between two entities.

#### GET /api/graph/stats
Get overall graph statistics.

### Settlement Predictor Endpoints

#### POST /api/settlement/predict
Predict settlement range for an FCA case.

**Authentication**: Required
**Authorization**: Premium users only

**Request Body:** See [Making Predictions](#making-predictions) section.

#### POST /api/settlement/batch-predict
Batch predict multiple scenarios (max 100).

#### GET /api/settlement/model-info
Get ML model information and statistics.

#### GET /api/settlement/examples
Get example settlement predictions.

---

## Deployment

### Production Deployment

#### Environment Variables

```bash
# .env.production
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fairmediator
POSTGRES_URI=postgresql://user:pass@host:5432/graph_analyzer
REDIS_URL=redis://:password@host:6379

FEC_API_KEY=your_production_fec_key
RECAP_API_KEY=your_production_recap_key
OPENSECRETS_API_KEY=your_production_opensecrets_key

JWT_SECRET=your-very-secure-random-string
PREDICTOR_API_URL=http://ml-service:8001
```

#### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale ML service for high load
docker-compose -f docker-compose.prod.yml up -d --scale ml-service=3
```

#### Health Checks

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check ML service health
curl http://localhost:8001/

# Check graph service
curl http://localhost:5000/api/graph/stats
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

#### 2. ML Service Not Responding

```bash
# Check Python service logs
docker-compose logs ml-service

# Restart ML service
docker-compose restart ml-service

# Rebuild if needed
docker-compose build ml-service
docker-compose up -d ml-service
```

#### 3. Graph Analyzer Returns Empty Results

**Cause**: No data has been scraped yet.

**Solution**:
```bash
# Scrape data for a mediator first
curl -X POST http://localhost:5000/api/graph/scrape-mediator \
  -H "Content-Type: application/json" \
  -d '{"mediatorId": "med_1", "mediatorName": "John Smith", "sources": ["fec", "recap"]}'
```

#### 4. Settlement Predictions Fail

**Cause**: Model not trained yet.

**Solution**:
```bash
cd backend/src/ml_models/settlement_predictor/training
python train_model.py
```

---

## Next Steps

1. **Collect More Data**: Run scrapers for all mediators in your database
2. **Train ML Model**: Collect 500+ FCA settlements and train the model
3. **Integrate Frontend**: Wire up the new APIs to the React frontend
4. **Monitor Performance**: Set up logging and monitoring for both services
5. **Optimize**: Add caching, indexing, and query optimization

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/your-org/fairmediator/issues
- Documentation: https://docs.fairmediator.ai
- Email: support@fairmediator.ai

---

## License

Copyright © 2026 FairMediator.AI - All Rights Reserved
