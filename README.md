<p align="center">
  <a href="https://www.fairmediator.ai">
    <img src="./GitHub_Banner.png" alt="FairMediator Banner" width="100%"/>
  </a>
</p>

A single-page platform for transparent law firm mediation selection with AI-powered conflict detection and ideological analysis.

## 🎯 Overview

FairMediator is a transparent platform that helps law firms, corporations, and individuals select mediators by:
- **Real-time affiliation flagging** (potential conflicts of interest)
- **Ideological leaning analysis** (liberal/conservative spectrum)
- **AI-powered chat interface** for natural language mediator search
- **Automated data aggregation** from public legal databases

## 🏗️ Architecture

### Frontend
- **Framework**: React with Tailwind CSS
- **Layout**: Horizontal split single-page app
  - Left: Chat input powered by Llama
  - Right: Mediator lists with affiliation tags

### Backend
- **API**: Node.js + Express
- **Database**: MongoDB
- **AI Engine**: Meta Llama 3.3/4 for:
  - Natural language query processing
  - Affiliation detection via NLP
  - Ideological classification

### Data Pipeline
- **Scraping**: Puppeteer/Cheerio for legal directories
- **Automation**: Python scripts for scheduled updates
- **Sources**: RECAP, Toolkit.law, LinkedIn, bar associations

### Deployment (100% Netlify)
- **Frontend**: Netlify (static site with CDN)
- **Backend**: Netlify Functions (serverless)
- **Database**: MongoDB Atlas (M0 FREE tier - 512MB with Vector Search)
- **Storage**: Netlify Blobs (file uploads/downloads)
- **Email**: Resend (100 emails/day FREE)
- **AI/ML**: HuggingFace API (FREE inference)
- **Cost**: $0/month (100% FREE)

📖 **Deployment Guide:** See [DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md)

## 🤖 AI Integration (100% FREE)

## Live Demo

   [![FairMediator AI Demo](https://img.shields.io/badge/🤗%20Live%20Demo-FairMediator-blue?style=for-the-badge)](https://huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo)

This project uses **HuggingFace Transformers** - completely FREE!

### AI Models (All Free)
- **Chat**: Llama 3.2 (1B/3B), Mistral Mixtral-8x7B, Google Gemma 2
- **NER**: BERT-large for entity extraction
- **Zero-Shot**: DeBERTa-v3 for affiliation detection
- **Political Analysis**: Specialized political leaning classifier
- **Sentiment**: RoBERTa for review analysis
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2 for semantic search ✨ NEW

### Advanced Features ✨ NEW
- **RAG (Retrieval-Augmented Generation)**
  - Semantic search using vector embeddings
  - ChromaDB for similarity matching
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
- Similarity-based mediator recommendations ✨ NEW


### Resources
- [HuggingFace Documentation](https://huggingface.co/docs)
- [Transformers Library](https://huggingface.co/docs/transformers)
- [Free Inference API](https://huggingface.co/inference-api)
- [Model Hub](https://huggingface.co/models)

## 📁 Project Structure

```
FairMediator/
├── frontend/                      # React + Tailwind frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── services/             # API client
│   │   └── App.jsx               # Main app
│   └── package.json
├── backend/                       # Node.js + Express API
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── models/               # MongoDB schemas
│   │   ├── services/
│   │   │   ├── huggingface/      # 🤗 HF integration
│   │   │   │   ├── chatService.js
│   │   │   │   ├── affiliationDetector.js
│   │   │   │   ├── ideologyClassifier.js
│   │   │   │   └── hfClient.js
│   │   │   ├── scraping/         # Web scraping
│   │   │   └── matching/         # Mediator matching
│   │   └── server.js
│   └── package.json
├── automation/                    # Python automation
│   ├── huggingface/              # 🤗 HF Python scripts
│   │   ├── affiliation_detector.py
│   │   ├── ideology_classifier.py
│   │   └── batch_analyze.py
│   ├── gradio_app.py             # HF Spaces demo
│   └── requirements.txt
├── notebooks/                     # Jupyter prototyping
│   ├── FairMediator_AI_Pipeline_Consolidated.ipynb
│   ├── README.md
│   └── requirements.txt
├── huggingface-space/            # HF Spaces deployment
└── .env.example                  # Environment variables
```

## 🚀 Getting Started

### Prerequisites (All FREE!)
- Node.js 18+
- Python 3.10+
- MongoDB (free tier: [MongoDB Atlas](https://mongodb.com/cloud/atlas))
- HuggingFace account (free: [huggingface.co](https://huggingface.co))


## 🧠 AI Features

### 1. Chat-Based Search
Users describe their mediation needs in natural language:
```
"I need a mediator experienced in tech IP disputes,
neutral on corporate matters, no BigLaw affiliations"
```

Our AI (powered by HuggingFace models) processes this and returns ranked mediators.

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

- **RECAP**: Federal court data
- **Toolkit.law**: Legal research platform
- **LinkedIn**: Professional connections
- **State Bar Associations**: Public directories
- **Mediator Organizations**: Professional listings

## 🔒 Security & Compliance

- GDPR/CCPA compliant data handling
- TLS encryption for all communications
- Secure API key management
- Data anonymization for analytics

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 🛣️ Roadmap

- [x] Phase 1: MVP (Chat + basic mediator list) ✅
- [x] Phase 2: Affiliation detection engine ✅
- [x] Phase 3: Ideological classification ✅
- [x] Phase 4: HuggingFace Spaces demo ✅
- [x] Phase 5: Netlify deployment with serverless functions ✅
- [x] Phase 6: Production deployment (Render + Netlify) ✅
- [x] Phase 7: Free tier monitoring system ✅
- [x] Phase 8: Advanced AI systems (agents, chains, perspectives, IDP, QA) ✅
- [x] Phase 9: Automated 50-state scraping pipeline ✅
- [ ] Phase 10: Fine-tuned models for legal domain
- [ ] Phase 11: Public API for mediator data
- [ ] Phase 12: Mobile app (React Native)

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
# Edit .env and add:
#   - MongoDB URI (free Atlas or local)
#   - HuggingFace API key (free at huggingface.co/settings/tokens)
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

```env
# Backend (.env) - See backend/.env.example for full details

# Server
PORT=5000
NODE_ENV=development

# MongoDB (FREE tier available)
MONGODB_URI=mongodb://localhost:27017/fairmediator
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/fairmediator

# HuggingFace API (100% FREE - Get at: https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=your_free_huggingface_api_key

# Optional: Choose which free model to use
HF_MODEL_CHAT=meta-llama/Meta-Llama-3-8B-Instruct

# Authentication
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Optional: Email service (Resend - FREE 3000/month)
# RESEND_API_KEY=your_resend_api_key

# Optional: Stripe (only for paid subscriptions)
# STRIPE_SECRET_KEY=your_stripe_key
```

## 🚀 Deploy to Production (FREE)

FairMediator can be deployed to **Netlify for FREE** with serverless functions:

```bash
# Quick deploy (3 minutes)
make netlify-deploy

# Or follow the detailed guide
See: QUICK_START_NETLIFY.md
```

**What you get for FREE:**
- ✅ Netlify Functions (125k requests/month)
- ✅ Netlify Forms (100 submissions/month)
- ✅ SSL Certificate (automatic)
- ✅ Global CDN
- ✅ Auto-deploy from Git

**Deployment Options:**
- **Serverless (Netlify Functions)**: [NETLIFY.md](./NETLIFY.md)
- **Traditional (Dedicated Backend)**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 Learn More

### AI & Machine Learning
- [HuggingFace Documentation](https://huggingface.co/docs) - Transformers, datasets, inference
- [Free Inference API](https://huggingface.co/docs/api-inference) - No credit card required
- [Transformers Course](https://huggingface.co/learn/nlp-course) - Free NLP course
- [Model Hub](https://huggingface.co/models) - 500k+ open-source models
- [Our HuggingFace Demo](https://huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo)

### Legal Tech Resources
- [RECAP Project](https://free.law/recap/) - Free law project
- [Court Listener](https://www.courtlistener.com/) - Legal search engine
- [Legal Information Institute](https://www.law.cornell.edu/) - Free legal reference

### Open Source Tools
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - Web scraping
- [Gradio](https://gradio.app/) - ML web interfaces
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Free database hosting

## 📄 License

MIT License - See LICENSE file for details

**Empowering Fair Mediation Selection**
