<p align="center">
  <a href="https://www.fairmediator.ai">
    <img src="./frontend/public/og-image.png" alt="FairMediator Banner" width="100%"/>
  </a>
</p>

A platform for transparent mediator selection with AI-powered conflict detection, ideological analysis, and a vetted mediator marketplace.

## 🎯 Overview

FairMediator helps law firms, corporations, and individuals select mediators by:
- **Real-time affiliation flagging** (potential conflicts of interest)
- **Ideological leaning analysis** (liberal/conservative spectrum) — checks affiliation between parties
- **AI-powered chat interface** for natural language mediator search
- **Automated data aggregation** from public legal databases
- **Mediator Marketplace** — vetted mediators apply to join; applications reviewed manually with human-readable reference IDs
- **Settlement Calculator** — ML-based prediction (R²=0.98) with scenario builder and PDF export
- **B2B API** — public `/api/v1` endpoints with API key auth for enterprise integrations
- **Contact page** — direct communication channel, no templated responses

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + Vite + Tailwind CSS
- **Key pages**: Home, Mediators, Mediator Marketplace (`/mediators/apply`), Settlement Calculator, Dashboard, Settings (API Keys), Contact
- **Reusable components**: `CustomSelect` (consistent panel dropdowns), `ConflictBadge`, `LobbyingBadge`, `MediatorDetailModal`, `SettlementPredictor`
- **Auth**: Role-aware login (Mediator / Attorney / Party)

### Backend
- **API**: Node.js + Express
- **Database**: MongoDB
- **AI Engine**: Open-source LLMs for:
  - Natural language query processing
  - Affiliation detection via NLP
  - Ideological classification

### Data Pipeline
- **Scraping**: Automated collection from public legal databases
- **Automation**: Python scripts for scheduled updates
- **Sources**: Public legal directories and professional databases

### Deployment
- **Frontend**: Cloud-hosted static site with CDN
- **Backend**: Serverless API architecture
- **Database**: Cloud-hosted MongoDB with vector search
- **Storage**: Cloud object storage
- **Email**: Transactional email service
- **AI/ML**: Open-source transformer models

## AI Integration

### AI Capabilities
- **Chat**: Large language models for natural conversation
- **NER**: Named entity recognition for extracting organizations and people
- **Zero-Shot Classification**: Affiliation and conflict detection
- **Political Analysis**: Ideological leaning classification
- **Sentiment Analysis**: Review and opinion analysis
- **Embeddings**: Semantic search and similarity matching

### Advanced Features
- **RAG (Retrieval-Augmented Generation)**
  - Semantic search using vector embeddings
  - Vector database for similarity matching
  - Grounded AI responses with citations and match scores
  - Hybrid search combining vector + keyword matching

- **Active Learning Pipeline**
  - Human feedback collection on AI predictions
  - Continuous model improvement through retraining
  - Performance metrics tracking (Accuracy, Precision, Recall, F1)
  - High-value training example identification

### Use Cases
- Chat-based mediator search with semantic understanding
- Affiliation & conflict detection with continuous learning
- Ideological leaning classification
- Entity extraction (organizations, people)
- Automated profile enrichment
- Similarity-based mediator recommendations

## 📁 Project Structure

```
FairMediator/
├── frontend/          # React + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
├── automation/        # Python automation
│   └── requirements.txt
└── .env.example      # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or cloud-hosted)
- AI/ML API access (various free options available)


## 🧠 AI Features

### 1. Chat-Based Search
Users describe their mediation needs in natural language:
```
"I need a mediator experienced in tech IP disputes,
neutral on corporate matters, no BigLaw affiliations"
```

Our AI engine processes this and returns ranked mediators.

### 2. Affiliation Detection
Automated NLP analysis flags potential conflicts:
- 🔴 Red: Likely affiliated with opposing counsel
- 🟡 Yellow: Possible indirect connection
- 🟢 Green: No detected affiliations

### 3. Ideological Classification
Machine learning classification based on:
- Case history analysis
- Published opinions/articles
- Organizational memberships
- Judicial appointments (if applicable)

## 📊 Data Sources

Data is aggregated from publicly available legal databases, professional directories, and court records to ensure comprehensive mediator profiles.

## 🔒 Security & Compliance

**Security Score:** 100/100 ✅
- 0 production vulnerabilities
- OWASP Top 10 fully compliant
- Enterprise-grade security features

### Implemented Security Features

**Authentication & Authorization:**
- JWT tokens in httpOnly cookies (XSS-proof)
- bcrypt password hashing
- Account lockout after 5 failed attempts
- Role-based access control (RBAC)

**Input Protection:**
- Joi validation on all endpoints
- HTML sanitization (XSS prevention)
- MongoDB injection prevention
- ReDoS protection (regex escaping)

**Network Security:**
- HTTPS enforcement in production
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- CORS with origin whitelisting
- Rate limiting (100 req/15min global, 5 req/15min auth)

**Attack Prevention:**
- CSRF protection (double submit cookie pattern)
- SQL/NoSQL injection prevention
- Clickjacking protection (X-Frame-Options)
- MIME sniffing protection

**Monitoring & Logging:**
- Winston structured logging (90-day retention)
- Sentry error tracking
- Security event logging
- Failed login attempt tracking

**Compliance:**
- OWASP Top 10 coverage (10/10)
- TLS/SSL encryption for all data
- Secure secret management (no hardcoded secrets)
- Environment variable validation

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

**Report via:**
- Email: security@fairmediator.ai
- GitHub Security Advisories (preferred)

**Response Timeline:**
- Acknowledgment: 48 hours
- Initial assessment: 5 business days
- Critical patches: 30 days

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

### Installation

1. **Clone repository**:
```bash
git clone https://github.com/carolbonk/fairmediator.ai.git
cd FairMediator
```

2. **Frontend setup**:
```bash
cd frontend
npm install
npm run dev
```

3. **Backend setup**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration:
#   - MongoDB connection string
#   - AI/ML API credentials
#   - Authentication secrets
npm run dev
```

4. **Python automation (optional)**:
```bash
cd automation
python -m venv venv
source venv/bin/activate  # On macOS/Linux (Windows: venv\Scripts\activate)
pip install -r requirements.txt
```

5. **Jupyter notebooks (optional)**:
```bash
cd notebooks
pip install -r requirements.txt
jupyter notebook
```

## 🔑 Environment Variables

See `backend/.env.example` for a complete list of required environment variables:

- **Server Configuration**: Port, environment mode
- **Database**: MongoDB connection string
- **AI/ML**: API credentials for LLM inference
- **Authentication**: JWT and session secrets
- **Email**: Transactional email service credentials (optional)
- **Payments**: Payment provider keys (optional)

## 📚 Learn More

### Documentation
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## 📄 License

MIT License - See LICENSE file for details

**Empowering Fair Mediation Selection**
