# 🎨 FairMediator - Neumorphism Design & 100% FREE Stack

## ✨ What Changed

### Design System: Apple → Neumorphism
**Before (Apple Design):**
- Flat design with subtle shadows
- High contrast white/gray
- Minimal borders
- Apple-gray palette

**After (Neumorphism):**
- 3D soft UI with dual shadows
- Monochromatic neu-palette
- Elements appear raised/pressed
- Softer, more organic feel

### AI Service: Paid → FREE
**Before:**
- ❌ OpenAI GPT-4 ($20-200/month)
- ❌ Together AI ($25 trial)
- ❌ Meta Llama hosted ($10-50/month)

**After:**
- ✅ Hugging Face Inference API (100% FREE)
- ✅ No credit card required
- ✅ Unlimited usage (free tier)
- ✅ Multiple free models available

---

## 🚀 Quick Start

### 1. Get FREE Hugging Face API Key
```bash
# Visit: https://huggingface.co/settings/tokens
# Create account (free, no credit card)
# Generate new token
# Copy token (starts with hf_...)
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env

# Edit .env and add:
HUGGINGFACE_API_KEY=hf_your_free_token_here
MONGODB_URI=mongodb://localhost:27017/fairmediator
```

### 3. Install & Run
```bash
# Install all dependencies
chmod +x quick-start.sh
./quick-start.sh

# Or manually:
npm install              # Root dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../automation && pip install -r requirements.txt

# Run development server
npm run dev             # Frontend (port 3000) + Backend (port 5000)
```

### 4. Access Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000/api
```

---

## 🎨 Neumorphism Design Guide

### Color Palette
```javascript
neu-100: '#F0F2F5'  // Primary background
neu-200: '#E4E7EB'  // Secondary background
neu-300: '#D1D5DB'  // Borders
neu-500: '#6B7280'  // Secondary text
neu-700: '#374151'  // Primary text
neu-800: '#1F2937'  // Headings
```

### Component Classes
```jsx
// Buttons
<button className="btn-neu">Normal Button</button>
<button className="btn-neu-primary">Primary Button</button>

// Cards
<div className="card-neu">Raised Card</div>
<div className="card-neu-flat">Flat Card</div>

// Inputs
<input className="input-neu" placeholder="Inset input" />

// Badges
<span className="badge-neu badge-liberal">Liberal</span>
<span className="badge-neu badge-conservative">Conservative</span>
<span className="badge-neu badge-neutral">Neutral</span>
```

### Shadow System
```css
/* Raised (buttons, cards) */
shadow-neu: 8px 8px 16px rgba(163, 177, 198, 0.6),
            -8px -8px 16px rgba(255, 255, 255, 0.5)

/* Pressed (inputs, active states) */
shadow-neu-inset: inset 4px 4px 8px rgba(163, 177, 198, 0.5),
                  inset -4px -4px 8px rgba(255, 255, 255, 0.5)

/* Floating (modals, dropdowns) */
shadow-neu-lg: 12px 12px 24px rgba(163, 177, 198, 0.6),
               -12px -12px 24px rgba(255, 255, 255, 0.5)
```

---

## 💰 Cost Breakdown

### Monthly Costs: $0.00

| Service | Plan | Cost |
|---------|------|------|
| **Hugging Face AI** | Free Tier | $0 |
| **MongoDB Atlas** | 512MB Free | $0 |
| **Frontend (Netlify)** | 100GB/month | $0 |
| **Backend (Render/Railway)** | Free Tier | $0 |
| **Domain (optional)** | Freenom/etc | $0 |
| **SSL Certificate** | Auto (Let's Encrypt) | $0 |
| **Total** | | **$0/month** ✅ |

### Feature Comparison

| Feature | Before (Paid) | After (FREE) |
|---------|---------------|--------------|
| AI Chat | OpenAI GPT-4 | Hugging Face Llama 3 |
| Ideology Analysis | Llama 70B | HF Llama 8B + Keywords |
| Conflict Detection | API-based | HF API + String Matching |
| Monthly Cost | $30-250 | $0 |
| Credit Card | Required | Not Required |
| API Limits | Pay-per-use | Generous free tier |

---

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS (Neumorphism config)
- **Build**: Vite
- **Icons**: React Icons
- **HTTP**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **AI Client**: Axios (Hugging Face API)
- **Security**: Helmet, CORS

### AI/ML
- **Provider**: Hugging Face (FREE)
- **Models**:
  - Primary: `meta-llama/Meta-Llama-3-8B-Instruct`
  - Alt 1: `microsoft/DialoGPT-large`
  - Alt 2: `facebook/blenderbot-400M-distill`
  - Lightweight: `TinyLlama/TinyLlama-1.1B-Chat-v1.0`

### Python Automation
- **Hugging Face Hub**: `huggingface-hub`
- **Transformers**: `transformers`
- **Web Scraping**: BeautifulSoup4, Selenium, Playwright
- **Data**: Pandas, NumPy
- **Database**: PyMongo

---

## 📁 Updated File Structure

```
FairMediator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx (neumorphism + FREE badge)
│   │   │   ├── ChatPanel.jsx (neu styles)
│   │   │   ├── MediatorList.jsx (neu cards)
│   │   │   └── MediatorCard.jsx (neu effects)
│   │   ├── App.jsx (neu layout)
│   │   └── index.css (neumorphism utilities)
│   └── tailwind.config.js (neu design tokens)
│
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── huggingface/  ← NEW (was llama/)
│   │   │       ├── hfClient.js (FREE API client)
│   │   │       ├── chatService.js (FREE chat)
│   │   │       ├── affiliationDetector.js (FREE)
│   │   │       └── ideologyClassifier.js (FREE)
│   │   └── routes/
│   │       ├── chat.js (updated to HF)
│   │       ├── mediators.js (updated to HF)
│   │       └── affiliations.js (updated to HF)
│   ├── .env.example (FREE config)
│   └── package.json (removed openai)
│
├── automation/
│   ├── huggingface/  ← NEW (was llama/)
│   │   ├── affiliation_detector.py (FREE)
│   │   ├── ideology_classifier.py (FREE)
│   │   └── batch_analyze.py (FREE)
│   └── requirements.txt (FREE packages only)
│
└── docs/
    ├── NEUMORPHISM_FREE_DESIGN.md  ← NEW
    └── SETUP_FREE.md  ← THIS FILE
```

---

## 🎯 Key Features (Still FREE)

✅ **AI-Powered Chat** - Natural language mediator search
✅ **Ideology Classification** - Liberal/Conservative/Neutral detection
✅ **Conflict Detection** - Automatic affiliation flagging
✅ **Real-Time Analysis** - Instant feedback
✅ **Batch Processing** - Analyze multiple mediators
✅ **Beautiful UI** - Neumorphism design
✅ **Responsive** - Mobile-friendly
✅ **Accessible** - WCAG compliant
✅ **Production Ready** - Deploy anywhere

---

## 🌐 Deployment (FREE Options)

### Frontend (Netlify)
```bash
# 1. Build
cd frontend
npm run build

# 2. Deploy
npm install -g netlify-cli
netlify deploy --prod
```

### Backend (Render.com)
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push

# 2. Connect Render to GitHub
# 3. Auto-deploy on push
```

### Database (MongoDB Atlas)
```bash
# 1. Create free cluster at mongodb.com
# 2. Get connection string
# 3. Add to .env as MONGODB_URI
```

---

## 🔍 Testing Free AI

```bash
# Test Hugging Face API
cd backend
node -e "
const hfClient = require('./src/services/huggingface/hfClient');
hfClient.chat([{role: 'user', content: 'Hello'}])
  .then(res => console.log('✅ HF Working:', res))
  .catch(err => console.log('❌ Error:', err));
"

# Test Python
cd automation/huggingface
python3 ideology_classifier.py
```

---

## 📚 Resources

### Get FREE API Keys
- **Hugging Face**: https://huggingface.co/settings/tokens
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register

### Learn Neumorphism
- **Generator**: https://neumorphism.io/
- **Examples**: https://dribbble.com/tags/neumorphism
- **Tailwind Config**: https://tailwindcss.com/docs/box-shadow

### Free Models
- **Llama 3**: https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct
- **DialoGPT**: https://huggingface.co/microsoft/DialoGPT-large
- **Blenderbot**: https://huggingface.co/facebook/blenderbot-400M-distill

---

## 🐛 Troubleshooting

### Hugging Face API Not Working
```bash
# Check API key
echo $HUGGINGFACE_API_KEY

# Test endpoint
curl -X POST "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct" \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Hello"}'
```

### Model Loading (503 Error)
- **Normal**: Models "cold start" after being idle
- **Solution**: Retry after 2-3 seconds (automatic in code)
- **Alternative**: Use always-on paid hosting later

### Rate Limiting
- **Free Tier**: Generous but has limits
- **Solution**: Implement caching, use fallback keywords
- **Upgrade**: Hugging Face Pro ($9/month) if needed later

---

## 🎉 Summary

### What You Get (FREE)
- ✅ Beautiful neumorphism UI
- ✅ AI-powered features
- ✅ MongoDB database
- ✅ Unlimited deployments
- ✅ SSL certificates
- ✅ Auto-scaling
- ✅ Community support

### What You DON'T Need
- ❌ Credit card
- ❌ Monthly subscriptions
- ❌ Usage limits (within reason)
- ❌ Infrastructure management
- ❌ DevOps complexity

### Total Cost
**$0/month** for personal/testing use
**$0-20/month** if you outgrow free tiers

---

## 📞 Support

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Open issues on your repo
- **Hugging Face**: https://huggingface.co/docs
- **MongoDB**: https://www.mongodb.com/docs

---

Made with ❤️ using 100% FREE and open-source tools
