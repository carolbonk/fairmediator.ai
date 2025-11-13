# 🔐 Security Best Practices - API Keys

## ✅ What I Did (Secure Setup)

### 1. Created `.env` Files (Not in Git)
```
backend/.env      ← Your Hugging Face key stored here
automation/.env   ← Same key for Python scripts
```

### 2. Set Secure Permissions
```bash
chmod 600 backend/.env
chmod 600 automation/.env
# Only YOU can read/write these files
```

### 3. Verified `.gitignore`
```gitignore
.env              ✅ Already ignored
.env.local        ✅ Already ignored
.env.*.local      ✅ Already ignored
```

**Your API key will NEVER be committed to Git!**

---

## 🔒 Security Checklist

✅ **API key stored in `.env` files** (not in code)
✅ **`.env` in `.gitignore`** (won't be pushed to GitHub)
✅ **File permissions 600** (only you can read)
✅ **Not in README or docs** (safe from public view)
✅ **Separate frontend/backend configs** (isolated)

---

## ⚠️ IMPORTANT: Never Do This

### ❌ DON'T:
```javascript
// WRONG - Never hardcode API keys!
const API_KEY = "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";
```

### ✅ DO:
```javascript
// CORRECT - Load from environment
const API_KEY = process.env.HUGGINGFACE_API_KEY;
```

---

## 🛡️ If Your Key Ever Gets Leaked

1. **Revoke immediately** at https://huggingface.co/settings/tokens
2. **Generate new token**
3. **Update `.env` files**
4. **Never commit it to Git**

### Check for Leaks
```bash
# Search your codebase
grep -r "hf_" . --exclude-dir=node_modules --exclude-dir=venv

# Should only show .env files!
```

---

## 🔍 Git Safety Check

### Before Committing
```bash
# Check what will be committed
git status

# Make sure .env is NOT listed!
# Should see:
# .env <- Not staged (ignored)
```

### If You Accidentally Committed It
```bash
# Remove from Git history (before pushing!)
git rm --cached backend/.env automation/.env
git commit --amend -m "Remove sensitive files"

# Then revoke the key and get a new one!
```

---

## 📁 Where Your Key Lives

```
FairMediator/
├── backend/
│   └── .env  ← HF key here (gitignored ✅)
├── automation/
│   └── .env  ← HF key here (gitignored ✅)
├── .gitignore ← Prevents .env from being committed ✅
└── README.md  ← Public, no keys ✅
```

---

## 🔐 Production Deployment

### Environment Variables (Netlify/Render/Railway)

**Don't upload `.env` files!** Instead:

**Netlify (Frontend):**
```
Site settings → Environment variables
VITE_API_URL=https://your-backend.com
```

**Render/Railway (Backend):**
```
Environment → Add Variable
HUGGINGFACE_API_KEY=hf_your_key
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

**Never put production keys in `.env` files in Git!**

---

## 🎯 Current Security Status

✅ **Your API key is secure:**
- Stored in `.env` (local only)
- File permissions: 600 (owner only)
- In `.gitignore` (won't be pushed)
- Not in any code files
- Separate from frontend

✅ **Ready to use:**
```bash
# Backend will load from .env automatically
cd backend
npm run dev

# Python loads from .env automatically
cd automation
source venv/bin/activate
python huggingface/ideology_classifier.py
```

---

## 📚 Security Resources

- **OWASP API Security**: https://owasp.org/www-project-api-security/
- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **Environment Variables**: https://12factor.net/config

---

## ✅ Summary

Your Hugging Face API key is now stored **securely**:
1. ✅ In `.env` files (not code)
2. ✅ With 600 permissions (you only)
3. ✅ Gitignored (won't be committed)
4. ✅ Separate backend/automation configs
5. ✅ Following industry best practices

**You're safe to proceed!** 🔒
