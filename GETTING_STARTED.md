# FairMediator - Getting Started Guide

This guide will help you set up and run the FairMediator platform locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://www.python.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/))

## Step 1: Get a Llama API Key

FairMediator uses Meta Llama models for AI features. You'll need an API key from one of these providers:

### Recommended Providers (Free Tiers Available):

1. **Together AI** (Recommended)
   - Sign up: https://www.together.ai/
   - Get API key from dashboard
   - Base URL: `https://api.together.xyz/v1`
   - Free tier: $25 credit

2. **Groq**
   - Sign up: https://console.groq.com/
   - Fast inference for Llama models
   - Base URL: `https://api.groq.com/openai/v1`
   - Generous free tier

3. **Fireworks AI**
   - Sign up: https://fireworks.ai/
   - Base URL: `https://api.fireworks.ai/inference/v1`

### Alternative: Run Llama Locally (Advanced)

If you have a powerful GPU, you can run Llama models locally:
- See: https://llama-stack.readthedocs.io/en/latest/getting_started/

## Step 2: Clone and Setup

```bash
# Navigate to project directory
cd FairMediator

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Setup Python environment
cd automation
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Step 3: Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
cp ../.env.example .env
```

Edit `.env` and add your configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/fairmediator
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fairmediator

# Server
PORT=5000
NODE_ENV=development

# Llama API (Together AI example)
LLAMA_API_KEY=your_together_ai_key_here
LLAMA_API_BASE_URL=https://api.together.xyz/v1
LLAMA_MODEL=meta-llama/Llama-3.3-70B-Instruct

# Security
JWT_SECRET=your_random_secret_here
SESSION_SECRET=another_random_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Step 4: Start MongoDB

### If using local MongoDB:
```bash
mongod --dbpath /path/to/your/data/directory
```

### If using MongoDB Atlas:
- Your connection string is already in `.env`
- No need to start a local server

## Step 5: Seed Sample Data (Optional)

Add some sample mediator data to test the platform:

```bash
cd backend
node src/scripts/seed-data.js  # We'll create this if needed
```

## Step 6: Start the Application

### Option 1: Run everything together (Recommended)

From the root directory:
```bash
npm run dev
```

This starts both frontend (port 3000) and backend (port 5000).

### Option 2: Run separately

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the FairMediator interface!

## Testing AI Features

### 1. Test Chat Interface

Try asking questions like:
- "I need a mediator for an IP dispute in California"
- "Find me a neutral mediator with 10+ years experience"
- "Show me liberal-leaning mediators specializing in employment law"

### 2. Test Affiliation Detection

1. Add party names in the "Parties to Check" field (e.g., "BigLaw LLC", "TechCorp")
2. Search for mediators
3. Watch for red/yellow/green flags indicating potential conflicts

### 3. Test Ideology Classification

If you have sample data, mediators should be classified on the liberal-conservative spectrum.

## Troubleshooting

### Error: "LLAMA_API_KEY is required"
- Make sure you've set up the `.env` file in the `backend` directory
- Verify your API key is correct

### Error: "MongoDB connection failed"
- Check if MongoDB is running: `mongosh` (should connect)
- Verify your connection string in `.env`

### Frontend not connecting to backend
- Ensure backend is running on port 5000
- Check CORS settings in backend `.env`

### Llama API errors
- Check your API quota/credits
- Verify the model name is correct for your provider
- Try a smaller model like `Llama-3.1-8B-Instruct` if rate limited

## Next Steps

### Add Real Data

Run scraping scripts to populate mediator profiles:
```bash
cd automation
python scrapers/linkedin_scraper.py  # Example
```

### Run Batch Analysis

Analyze all mediators with Llama:
```bash
cd automation/llama
python batch_analyze.py --task both --parties "BigLaw LLC" "TechCorp"
```

### Deploy to Production

See `DEPLOYMENT.md` for production deployment instructions.

## Learning Resources

### Meta Llama Documentation
- **Overview**: https://www.llama.com/docs/overview/
- **Prompt Engineering**: https://www.llama.com/docs/model-cards-and-prompt-formats/llama3_3/
- **Tool Calling**: https://www.llama.com/resources/cookbook/toolcalling-with-llama/
- **Fine-tuning**: https://www.llama.com/docs/how-to-guides/fine-tuning/

### FairMediator Architecture
- Check `README.md` for detailed architecture overview
- See `backend/src/services/llama/` for AI implementation examples

## Need Help?

- Check the logs: Backend logs in terminal, frontend in browser console
- Review Llama API documentation for your provider
- Ensure all environment variables are set correctly

---

**Happy mediating! 🎯⚖️**
