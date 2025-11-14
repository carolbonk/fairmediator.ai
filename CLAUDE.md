# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FairMediator is a full-stack legal tech platform for transparent mediator selection with AI-powered conflict detection and ideological analysis. The platform uses **free/open-source AI models from HuggingFace** for natural language processing, affiliation detection, and ideology classification.

## Architecture

### Three-Tier Stack
- **Frontend**: React 18 + Tailwind CSS + Vite (port 3000)
- **Backend**: Node.js + Express + MongoDB (port 5000/5001)
- **Automation**: Python scripts using HuggingFace Transformers (batch processing)

### Dual AI Integration
The project has **two parallel AI service implementations**:

1. **HuggingFace Services** (Primary, 100% Free)
   - Location: `backend/src/services/huggingface/` and `automation/huggingface/`
   - Uses free/open-source models from HuggingFace Hub
   - Models: emotion detection, NER, zero-shot classification
   - No API costs - runs locally or via free HuggingFace API

2. **Llama Services** (Alternative, API-based)
   - Location: `backend/src/services/llama/` (stub files, not implemented)
   - Placeholder for Meta Llama integration via Together AI/Groq
   - Requires API key and has usage costs

**Important**: When working on AI features, prefer the HuggingFace implementation as it's actively used and cost-free.

## Common Development Commands

### Install Dependencies
```bash
# Install all workspaces (frontend + backend)
npm install

# Or install individually
cd frontend && npm install
cd backend && npm install
```

### Development Server
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually
npm run dev:frontend  # Vite dev server on port 3000
npm run dev:backend   # Express server with nodemon on port 5000
```

### Python Environment (Automation Scripts)
```bash
# First-time setup
./setup-python-venv.sh

# Activate virtual environment (do this every session)
cd automation
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Run batch analysis
cd huggingface
python batch_analyze.py        # Full analysis
python batch_analyze.py test   # Test mode
python batch_analyze.py report # Generate report

# Deactivate when done
deactivate
```

### Database Operations
```bash
# Seed sample mediator data
node backend/src/scripts/seed-data.js

# Start local MongoDB (if not using Atlas)
mongod
```

### Build for Production
```bash
npm run build              # Build both frontend and backend
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Key Technical Patterns

### AI Service Architecture

The HuggingFace services use a consistent pattern:

1. **Configuration Layer** (`config.js`): Centralizes model selection and parameters
2. **Client Layer** (`hfClient.js`): Handles API calls to HuggingFace Inference API
3. **Service Layer** (`chatService.js`, `affiliationDetector.js`, `ideologyClassifier.js`): Business logic for specific AI tasks
4. **Utils Layer** (`utils.js`): Shared utilities for text processing, scoring, and validation

When adding new AI features:
- Add model configuration to `config.js`
- Use `hfClient.js` for HuggingFace API calls
- Create new service files for specific use cases
- Share common logic through `utils.js`

### API Route Structure

All API routes follow REST conventions:
- `/api/mediators` - CRUD operations for mediator profiles
- `/api/chat` - Natural language search powered by HuggingFace NLP
- `/api/affiliations` - Conflict detection and affiliation analysis

Routes are mounted in `backend/src/server.js` with security middleware (helmet, CORS, rate limiting).

### Data Models

MongoDB schemas are defined in `backend/src/models/`:
- `Mediator.js`: Core schema with fields for name, firm, practice areas, ideology score (-2 to +2), affiliations, and ratings

### Frontend Component Pattern

React components use a functional pattern with hooks:
- `App.jsx`: Main layout with horizontal split (chat left, results right)
- `components/ChatPanel.jsx`: Chat interface with message history
- `components/MediatorList.jsx`: Displays filtered mediators by ideology (Liberal/Neutral/Conservative)
- `components/MediatorCard.jsx`: Individual mediator cards with affiliation flags (🔴🟡🟢)
- `services/api.js`: Axios client for backend communication

## Environment Configuration

### Backend (.env)
Required environment variables for backend:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/fairmediator  # Or Atlas URI

# Server
PORT=5000
NODE_ENV=development

# HuggingFace API (Optional - for cloud inference)
HUGGINGFACE_API_KEY=your_key_here  # Free tier available

# Security
JWT_SECRET=your_random_secret
SESSION_SECRET=another_random_secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Automation (.env)
Python scripts use `automation/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/fairmediator
HUGGINGFACE_API_KEY=optional_for_cloud_api
```

## Critical Development Notes

### HuggingFace Model Usage
- All models are free/open-source from HuggingFace Hub
- Can run locally (no API key needed) or via free HuggingFace Inference API
- Models are selected in `backend/src/services/huggingface/config.js`
- Python scripts use Transformers library for batch processing

### MongoDB Connection
- Uses Mongoose ODM with connection in `backend/src/server.js`
- Database name: `fairmediator`
- Connection options include `useNewUrlParser` and `useUnifiedTopology`

### Security Practices
- Helmet.js for security headers
- CORS configured for frontend origin
- Rate limiting on all `/api/` routes (100 requests per 15 minutes default)
- JWT for future authentication implementation

### Port Configuration
- Frontend: 3000 (Vite default)
- Backend: 5000 or 5001 (check server.js line 19)
- If port conflicts occur, backend will use PORT environment variable

### Workspaces Architecture
This is a monorepo using npm workspaces:
- Root `package.json` defines workspaces: `["frontend", "backend"]`
- Shared dev dependencies in root (concurrently, nodemon, TypeScript types)
- App-specific dependencies in workspace package.json files
- Run `npm install` from root to install all dependencies

### Python Virtual Environment
- **Always activate** the virtual environment before running Python scripts
- Location: `automation/venv/`
- Look for `(venv)` prefix in terminal prompt to confirm activation
- Use `setup-python-venv.sh` for initial setup

### AI Integration Philosophy
This project prioritizes **free and open-source AI tools**:
- Primary: HuggingFace Transformers (100% free)
- Alternative: Meta Llama (requires API key, has costs)
- Future: Consider fine-tuning open models for legal domain

When implementing new AI features, default to HuggingFace models unless there's a specific reason to use paid APIs.

## Common Development Workflows

### Adding a New Mediator Field
1. Update `backend/src/models/Mediator.js` schema
2. Update API routes in `backend/src/routes/mediators.js`
3. Update frontend components in `frontend/src/components/MediatorCard.jsx`
4. Re-seed database: `node backend/src/scripts/seed-data.js`

### Adding a New AI Feature
1. Select appropriate HuggingFace model from Hub
2. Add model config to `backend/src/services/huggingface/config.js`
3. Create new service file in `backend/src/services/huggingface/`
4. Create API route in `backend/src/routes/`
5. Mount route in `backend/src/server.js`
6. Add frontend API call in `frontend/src/services/api.js`
7. Update UI components as needed

### Debugging AI Services
- Check HuggingFace model names match Hub exactly
- Verify model supports Inference API (look for "Hosted inference API" on model page)
- Use smaller models for testing (faster, same API)
- Check rate limits if using free HuggingFace API (1000 requests/day)

### Working with Dual Implementations
- HuggingFace services are in `backend/src/services/huggingface/` (active)
- Llama services are in `backend/src/services/llama/` (stub files, mostly empty)
- Default to HuggingFace unless user explicitly requests Llama integration

## Testing Approach

### Backend Testing
- Use Jest for unit tests
- Test AI services with mock responses (don't hit real APIs in tests)
- Test routes with supertest
- Run: `cd backend && npm test`

### Frontend Testing
- Test components with React Testing Library (when configured)
- Run: `cd frontend && npm test`

### Manual Testing
1. Start MongoDB: `mongod`
2. Seed data: `node backend/src/scripts/seed-data.js`
3. Start dev servers: `npm run dev`
4. Open browser: `http://localhost:3000`
5. Test chat interface with queries like "Find me a mediator for IP disputes"
6. Add parties to check for conflicts

## Documentation References

Key documentation files:
- `README.md`: Project overview and tech stack
- `GETTING_STARTED.md`: Setup instructions
- `PROJECT_SUMMARY.md`: Feature summary
- `docs/ARCHITECTURE.md`: Visual architecture diagram
- `CONTRIBUTING.md`: Contribution guidelines
- `automation/README.md`: Python venv quick reference

## Special Considerations

### Affiliation Detection
- Uses color-coded risk flags: 🔴 (HIGH), 🟡 (MEDIUM), 🟢 (LOW)
- Analyzes mediator connections to parties/firms
- Primary implementation in `backend/src/services/huggingface/affiliationDetector.js`

### Ideology Classification
- Scores mediators on -2 (liberal) to +2 (conservative) scale
- Based on professional history, publications, organizational memberships
- Implementation in `backend/src/services/huggingface/ideologyClassifier.js`

### Batch Processing
- Python scripts in `automation/huggingface/` for bulk analysis
- Use when analyzing many mediators at once
- Saves results to MongoDB
- Run from activated virtual environment

## Known Issues & Gotchas

1. **Llama stub files**: The `backend/src/services/llama/` directory contains empty stub files. This is intentional - HuggingFace is the active implementation.

2. **Port conflicts**: Backend defaults to 5001 in server.js but .env.example shows 5000. Check which port is actually in use when connecting from frontend.

3. **MongoDB deprecation warnings**: The `useNewUrlParser` and `useUnifiedTopology` options are deprecated in newer Mongoose versions but kept for compatibility.

4. **Python dependencies**: Some dependencies (torch, sentencepiece) are commented out in requirements.txt. Only uncomment if doing local inference.

5. **HuggingFace free tier limits**: Free Inference API has rate limits (1000 requests/day). For production, consider local inference or paid tier.
