# FairMediator

A single-page platform for transparent law firm mediation selection with AI-powered conflict detection and ideological analysis.

## 🎯 Overview

FairMediator helps law firms, corporations, and individuals select mediators by:
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

### Deployment
- **Frontend**: Netlify
- **Backend**: To be determined (Vercel, Railway, or self-hosted)

## 🤖 AI Integration (Llama Models)

This project uses **Meta Llama models** for AI-powered features:

### Model Usage
- **Primary Model**: Llama 3.3 70B (or Llama 4 when available)
- **Use Cases**:
  - Chat-based mediator search
  - NLP for affiliation detection
  - Ideological leaning classification
  - Conflict of interest pattern matching

### Deployment Options
1. **API-based** (Recommended for MVP):
   - Together AI, Groq, or Fireworks AI (pay-per-token)
   - Fast inference, no infrastructure management
   
2. **On-premise** (Future scalability):
   - Self-hosted with Llama Stack
   - Full control, fixed costs at scale

3. **Hybrid**:
   - API for real-time chat
   - Local models for batch affiliation analysis

### Resources
- [Llama Documentation](https://www.llama.com/docs/overview/)
- [Llama Models on Hugging Face](https://huggingface.co/meta-llama)
- [Llama API Python SDK](https://github.com/meta-llama/llama-api-python)
- [Text Classification Guide](https://www.llama.com/docs/how-to-guides/fine-tuning/)

## 📁 Project Structure

```
FairMediator/
├── frontend/                 # React + Tailwind frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API client
│   │   └── App.jsx          # Main app
│   └── package.json
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # MongoDB schemas
│   │   ├── services/        # Business logic
│   │   │   └── llama/       # Llama integration
│   │   └── server.js
│   └── package.json
├── automation/              # Python automation scripts
│   ├── scrapers/           # Puppeteer/Cheerio wrappers
│   ├── llama/              # Llama Python scripts
│   │   ├── affiliation_detector.py
│   │   └── ideology_classifier.py
│   └── requirements.txt
├── docs/                    # Documentation
└── .env.example            # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- MongoDB (local or Atlas)
- Llama API key (Together AI, Groq, or similar)

### Installation

1. **Clone and setup**:
```bash
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
# Add your MongoDB URI and Llama API key
npm run dev
```

4. **Python automation**:
```bash
cd automation
python -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
```

## 🔑 Environment Variables

```env
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/fairmediator
PORT=5000

# Llama API Configuration
LLAMA_API_KEY=your_api_key_here
LLAMA_API_BASE_URL=https://api.together.xyz/v1  # or your provider
LLAMA_MODEL=meta-llama/Llama-3.3-70B-Instruct

# Scraping
LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=
```

## 🧠 AI Features

### 1. Chat-Based Search
Users describe their mediation needs in natural language:
```
"I need a mediator experienced in tech IP disputes, 
neutral on corporate matters, no BigLaw affiliations"
```

Llama processes this and returns ranked mediators.

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

## 💰 Monetization Strategy

1. **Freemium Model**:
   - Basic search: Free
   - Advanced filtering + AI insights: Subscription
   
2. **Premium Mediator Placement**:
   - Featured listings for verified mediators
   
3. **Enterprise Plans**:
   - API access for law firms
   - Custom affiliation rules
   - Dedicated support

## 🛣️ Roadmap

- [ ] Phase 1: MVP (Chat + basic mediator list)
- [ ] Phase 2: Affiliation detection engine
- [ ] Phase 3: Ideological classification
- [ ] Phase 4: Advanced filtering + analytics
- [ ] Phase 5: Mobile app
- [ ] Phase 6: Fine-tuned Llama model for legal domain

## 📚 Learn More

### Llama Resources
- [Llama Developer Guide](https://www.llama.com/developer-use-guide/)
- [Prompt Engineering for Llama 3.3](https://www.llama.com/docs/model-cards-and-prompt-formats/llama3_3/)
- [Text Classification Cookbook](https://www.llama.com/resources/cookbook/text2sql_natural_language_to_sql_interface/)
- [Tool Calling with Llama](https://www.llama.com/resources/cookbook/toolcalling-with-llama/)

### Legal Tech
- [RECAP Project](https://free.law/recap/)
- [Toolkit.law](https://toolkit.law)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

---

**Built with ❤️ using Meta Llama | Empowering Fair Mediation Selection**
