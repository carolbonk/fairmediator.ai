# FairMediator Setup Guide

> **Complete local development setup - 100% Free Tier**

**Last Updated:** January 13, 2026

---

## 📑 Quick Navigation

- [Quick Start (5 min)](#-quick-start-5-minutes)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Docker Development](#-docker-development)
- [Development Tools](#-development-tools)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start (5 Minutes)

**Get running locally in 5 steps:**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd FairMediator
npm install

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env - add your HUGGINGFACE_API_KEY (free from huggingface.co)

# 3. Start MongoDB (choose one):
# Option A: Docker (recommended)
docker-compose -f docker-compose.dev.yml up -d

# Option B: MongoDB Atlas (free cloud)
# Get connection string from mongodb.com/cloud/atlas

# 4. Start the app
npm run dev

# 5. Open browser
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
```

**Done!** The app is running. Continue below for advanced features.

---

## 🔧 Environment Setup

### Required Variables

**Minimum to run locally:**

```bash
# backend/.env

# Database (choose one)
MONGODB_URI=mongodb://localhost:27017/fairmediator  # Docker
# OR
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fairmediator  # Atlas

# AI/ML (FREE - get from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_your_free_key_here

# Server
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Security (development - use simple keys for local dev)
JWT_SECRET=dev_jwt_secret_key
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key
SESSION_SECRET=dev_session_secret_key
```

### Optional Variables

**For production features in development:**

```bash
# Netlify Blobs Storage (images, documents)
NETLIFY_SITE_ID=your_site_id
NETLIFY_TOKEN=your_netlify_token

# Email Service (optional - logs to console if not configured)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=FairMediator <noreply@fairmediator.com>

# Free Tier Limits (optional - uses defaults)
HUGGINGFACE_DAILY_LIMIT=900
HUGGINGFACE_MONTHLY_LIMIT=30000
RESEND_DAILY_LIMIT=90
RESEND_MONTHLY_LIMIT=3000
MONGODB_SIZE_LIMIT=536870912
```

### Complete .env.example

See `backend/.env.example` for all available options with detailed comments.

---

## 🗄️ Database Setup

### MongoDB (Required)

**Option 1: Docker MongoDB (Recommended for Development)**

```bash
# Start MongoDB using docker-compose
docker-compose -f docker-compose.dev.yml up -d

# Verify it's running
docker ps | grep mongo

# Connection string for .env:
MONGODB_URI=mongodb://localhost:27017/fairmediator

# View logs
docker-compose -f docker-compose.dev.yml logs -f mongo

# Stop MongoDB
docker-compose -f docker-compose.dev.yml down
```

**Option 2: MongoDB Atlas (Free Cloud - Recommended for Production-like Testing)**

1. **Create free account:** https://mongodb.com/cloud/atlas
2. **Create M0 FREE cluster:**
   - Click "Build a Database" → FREE tier (M0 Sandbox)
   - Provider: AWS
   - Region: Closest to you (e.g., us-west-2)
   - Cluster Name: `FairMediator`
3. **Create database user:**
   - Go to "Database Access"
   - Add New Database User
   - Username: `fairmediator`
   - Auto-generate password (save it!)
   - Privileges: "Read and write to any database"
4. **Whitelist your IP:**
   - Go to "Network Access"
   - Add IP Address → "Add Current IP Address"
   - Or use 0.0.0.0/0 for anywhere (less secure but convenient for dev)
5. **Get connection string:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password
   - Add to `.env`:
     ```
     MONGODB_URI=mongodb+srv://fairmediator:PASSWORD@cluster.mongodb.net/fairmediator
     ```

**Option 3: Local MongoDB Installation**

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongod

# Windows - Use Docker option instead
```

### Seed Database (Optional)

Add sample mediator data for testing:

```bash
cd backend
node src/scripts/seed-data.js
```

### MongoDB Atlas Vector Search Index (Optional - For Semantic Search)

If using MongoDB Atlas, you can enable vector search for semantic mediator matching:

1. **Generate embeddings for existing mediators:**
   ```bash
   cd backend
   node src/scripts/initializeVectorDB.js
   ```

2. **Create vector search index in Atlas UI:**
   - Go to MongoDB Atlas → Your cluster
   - Navigate to "Browse Collections" → `fairmediator` → `mediators`
   - Click "Atlas Search" tab → "Create Search Index"
   - Choose "JSON Editor"
   - Index name: `mediator_vector_search`
   - Paste this definition:
     ```json
     {
       "fields": [
         {
           "type": "vector",
           "path": "embedding",
           "numDimensions": 384,
           "similarity": "cosine"
         }
       ]
     }
     ```
   - Click "Create Search Index"
   - Wait for index to become "Active"

3. **Test vector search:**
   ```bash
   node src/scripts/initializeVectorDB.js --show-index
   ```

For complete vector search setup, see [MONGODB_VECTOR_SEARCH_SETUP.md](./MONGODB_VECTOR_SEARCH_SETUP.md)

---

## 🐳 Docker Development

### Docker Compose (Simplified - MongoDB Only)

The project includes `docker-compose.dev.yml` for local MongoDB:

```bash
# Start MongoDB
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Clean up volumes
docker-compose -f docker-compose.dev.yml down -v
```

### What's Included

**docker-compose.dev.yml provides:**
- MongoDB 7.0 on port 27017
- Persistent volume for data
- Automatic restart

**What's NOT in Docker (runs directly on your machine):**
- Backend Node.js server (faster hot-reload)
- Frontend React dev server (better DX with Vite)

### Docker Commands

```bash
# Check running containers
docker ps

# View MongoDB logs
docker logs -f fairmediator-mongo

# Access MongoDB shell
docker exec -it fairmediator-mongo mongosh

# Reset database (delete all data)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

---

## 🛠️ Development Tools

### NPM Scripts

**Root directory (runs both frontend + backend):**

```bash
npm run dev          # Start full stack (frontend + backend)
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only
npm install          # Install all dependencies
npm test             # Run all tests
```

**Backend directory:**

```bash
cd backend

npm run dev          # Start with nodemon (hot reload)
npm start            # Start production mode
npm test             # Run Jest tests
npm test:watch       # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

**Frontend directory:**

```bash
cd frontend

npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Code Quality

```bash
# Linting
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues

# Security
npm audit            # Check for vulnerabilities
npm audit fix        # Fix vulnerabilities
```

### Database Scripts

```bash
cd backend

# Seed database with sample data
node src/scripts/seed-data.js

# Initialize vector search (generate embeddings)
node src/scripts/initializeVectorDB.js

# Clear all embeddings
node src/scripts/initializeVectorDB.js --clear

# Re-index all mediators
node src/scripts/initializeVectorDB.js --reindex
```

---

## 🧪 Testing

### Test Stack

**Current:** Jest + Supertest (54 tests passing)
- Integration tests for API endpoints
- AI systems integration tests
- Service layer unit tests

**Removed:** Playwright (E2E - all tests failing, not cost-effective)

### Run Tests

```bash
# All tests
npm test

# Backend tests only
cd backend && npm test

# Watch mode (re-run on file changes)
cd backend && npm test:watch

# Coverage report
cd backend && npm run test:coverage

# Specific test file
cd backend && npm test -- --testPathPattern=chatService
```

### Test Coverage

**Current coverage:** ~16%

**Goal:** 30% (high-value tests only)

**Focus areas:**
- API endpoints (authentication, mediator search, chat)
- AI service integration (HuggingFace, embeddings)
- Security middleware (CSRF, rate limiting)
- Free tier monitoring

### Manual Testing Scenarios

For E2E testing scenarios (previously tested with Playwright), see CONTEXT.md "E2E Test Scenarios (Manual Testing Reference)" section.

We're exploring free alternatives to Playwright for automated E2E testing.

---

## 🌐 Production Features in Development

### Netlify Blobs Storage (Optional)

To test file upload/download locally:

1. **Get Netlify credentials:**
   - Deploy site to Netlify (or use existing site)
   - Get Site ID from site dashboard
   - Create Personal Access Token in User Settings → Applications

2. **Add to .env:**
   ```bash
   NETLIFY_SITE_ID=your_site_id
   NETLIFY_TOKEN=your_personal_access_token
   ```

3. **Test upload:**
   ```bash
   curl -X POST http://localhost:5001/api/storage/mediator/123/image \
     -H "Content-Type: multipart/form-data" \
     -F "image=@/path/to/image.jpg"
   ```

### Email Service (Optional)

To test email sending locally:

1. **Get Resend API key:**
   - Sign up at https://resend.com (free tier: 100 emails/day)
   - Get API key from dashboard

2. **Add to .env:**
   ```bash
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=FairMediator <noreply@yourdomain.com>
   ```

3. **Test email:**
   ```bash
   # Trigger password reset
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com"}'
   ```

**Without Resend configured:**
- Emails are logged to console only
- App works normally, just no actual emails sent

---

## 🆘 Troubleshooting

### Common Issues

**"MongoDB connection failed"**

```bash
# Check MongoDB is running
# Docker:
docker ps | grep mongo

# Local installation:
mongosh  # Should connect

# Fix:
docker-compose -f docker-compose.dev.yml up -d  # Start Docker MongoDB
# OR
brew services start mongodb-community  # Mac
sudo systemctl start mongod  # Linux
```

**"Port 5001 already in use"**

```bash
# Find process using port
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5002
```

**"Module not found" errors**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For backend specifically
cd backend
rm -rf node_modules package-lock.json
npm install
```

**"HuggingFace API error" or "Rate limited"**

```bash
# Check your API key is valid
echo $HUGGINGFACE_API_KEY

# Verify it works
curl https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY"

# Get new key if needed:
# https://huggingface.co/settings/tokens

# Check free tier usage
curl http://localhost:5001/api/monitoring/free-tier
```

**"Cannot connect to MongoDB Atlas"**

- Check network access whitelist includes your IP (or 0.0.0.0/0)
- Verify password is correct and URL-encoded
- Check connection string format
- Ensure database user has correct permissions

**"Vector search not working"**

- Check if vector search index exists and is "Active" in MongoDB Atlas
- Run embedding generation: `node src/scripts/initializeVectorDB.js`
- Verify mediators have `embedding` field in database
- Wait 1-2 minutes after creating index for it to become active

**"Docker MongoDB won't start"**

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs mongo

# Common fix: Remove old volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# Check if port 27017 is already in use
lsof -i :27017
# If MongoDB is running locally, stop it or use Atlas instead
```

**"Frontend won't connect to backend"**

- Check backend is running on port 5001
- Verify CORS_ORIGIN in backend/.env matches frontend URL
- Check browser console for CORS errors
- Ensure both frontend and backend are running

### Development Workflow Issues

**Hot reload not working**

```bash
# Backend: Make sure using nodemon
cd backend && npm run dev

# Frontend: Make sure using Vite dev server
cd frontend && npm run dev

# Check file watchers aren't exhausted (Mac/Linux)
# Increase limit if needed
```

**Tests failing after pulling changes**

```bash
# Reinstall dependencies
npm install

# Clear Jest cache
cd backend && npx jest --clearCache

# Run tests
npm test
```

---

## 🔐 Security Setup

### Development vs Production

**Development (local):**
- Use simple secrets for JWT (e.g., `dev_jwt_secret`)
- MongoDB without authentication (Docker) is OK
- CORS allows localhost:3000

**Production (see DEPLOYMENT.md):**
- Generate secure random secrets (64+ characters)
- MongoDB with authentication required
- CORS limited to your domain only
- All traffic over HTTPS

### Generate Production Secrets

```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Security Checklist

**Never commit to git:**
- [ ] `.env` files
- [ ] API keys (HuggingFace, Resend, Netlify)
- [ ] MongoDB connection strings with credentials
- [ ] JWT secrets
- [ ] Any passwords or tokens

**Always use:**
- [ ] `.gitignore` includes `.env` and `*.env`
- [ ] Environment variables for all secrets
- [ ] HTTPS in production (automatic on Netlify)
- [ ] CORS with specific origins in production

For complete security guidelines, see [SECURITY.md](./SECURITY.md)

---

## 📊 Architecture Overview

### Technology Stack (100% FREE)

**Backend:**
- Node.js 18+ + Express.js
- MongoDB Atlas M0 (512MB) - Database + Vector Search
- HuggingFace API - AI/ML inference
- JWT + bcryptjs - Authentication
- Helmet + CORS + CSRF - Security
- Winston - Logging

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router DOM

**AI/ML:**
- HuggingFace Transformers - Ideology classification, conflict detection
- MongoDB Atlas Vector Search - Semantic search, RAG
- sentence-transformers/all-MiniLM-L6-v2 - 384-dim embeddings

**Storage:**
- Netlify Blobs - Images, documents (100GB bandwidth/month)

**Testing:**
- Jest + Supertest - 54 tests passing
- Manual testing for critical user flows

**Deployment:**
- Netlify - Frontend + Functions + Blobs
- MongoDB Atlas - Database + Vector Search
- GitHub Actions - CI/CD (optional)

**Cost:** $0/month (100% free tier)

### API Structure

```
/api/
├── /auth          - Authentication (register, login, JWT)
├── /mediators     - Mediator CRUD operations
├── /chat          - AI chat with semantic search
├── /matching      - Mediator matching algorithms
├── /subscription  - Premium tier (future)
├── /dashboard     - User dashboard data
├── /scraping      - Web scraping (admin only)
├── /analysis      - Conflict analysis
├── /feedback      - Active learning feedback
├── /monitoring    - Free tier usage monitoring
├── /affiliations  - Bias/conflict detection
└── /storage       - File upload/download (Netlify Blobs)
```

### Database Schema

**Collections (MongoDB):**
1. `users` - User accounts
2. `mediators` - Mediator profiles (includes `embedding` field for vector search)
3. `subscriptions` - User subscription data
4. `usagelogs` - Free tier usage tracking
5. `conflictfeedback` - User feedback for AI training
6. `mediatorselections` - User selection history
7. `caseoutcomes` - Case outcome tracking
8. `errorlogs` - Application error monitoring (capped collection)

---

## 📚 Free Services Used

| Service | Free Tier | What We Use | Setup Required |
|---------|-----------|-------------|----------------|
| **HuggingFace** | Rate limited | AI chat, embeddings | ✅ API key |
| **MongoDB Atlas** | 512MB | Database + Vector Search | ✅ Account |
| **Netlify** | 100GB bandwidth | Frontend + Functions | ⚪ For deployment |
| **Netlify Blobs** | 100GB bandwidth | File storage | ⚪ Optional |
| **Resend Email** | 100/day | Email notifications | ⚪ Optional |
| **Docker** | Free forever | Local MongoDB | ⚪ For local dev |

**Total Cost:** $0/month 🎉

---

## 🎯 Next Steps After Setup

1. **✅ Verify everything works:**
   ```bash
   # Backend health check
   curl http://localhost:5001/health

   # Frontend
   # Open http://localhost:3000
   ```

2. **Test core features:**
   - [ ] User registration/login
   - [ ] Mediator search
   - [ ] AI chat functionality
   - [ ] Monitoring dashboard

3. **Optional enhancements:**
   - [ ] Enable vector search (if using MongoDB Atlas)
   - [ ] Configure Netlify Blobs for file storage
   - [ ] Set up email service with Resend

4. **Deploy to production:**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guide
   - Free deployment on Netlify
   - Takes ~20 minutes

5. **Start developing:**
   - Check [CONTEXT.md](./CONTEXT.md) for project rules and architecture
   - See API documentation in code comments
   - Review test examples in `/backend/src/tests/`

---

## 📝 Related Documentation

- **[CONTEXT.md](./CONTEXT.md)** - Project rules, tech stack, recent changes, TODO
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (Netlify)
- **[MONGODB_VECTOR_SEARCH_SETUP.md](./MONGODB_VECTOR_SEARCH_SETUP.md)** - Vector search setup guide
- **[SECURITY.md](./SECURITY.md)** - Security best practices and audit
- **[README.md](./README.md)** - Project overview and quick start

---

**Questions?** Check [CONTEXT.md](./CONTEXT.md) for project state and rules.

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.
