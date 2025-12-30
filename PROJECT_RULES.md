# FairMediator Project Rules

> **⚠️ CRITICAL: Read before making any changes to the project**

**Last Updated:** December 30, 2024

---

## 🚨 Rule #1: NO DUPLICATION

### Documentation Files
- **ONE file per topic** - No multiple files covering the same subject
- Before creating a new `.md` file, check if existing file covers the topic
- Before deleting any file, verify ALL content is preserved in the consolidated file

### Code Files
- **DRY Principle** - Don't Repeat Yourself
- Extract shared logic into utilities/services
- No copy-paste code between components

---

## 📁 Current Documentation Structure (APPROVED)

### Core Documentation
```
README.md                  - Main project overview & quick start
CONTEXT.md                 - Project state, progress, next steps (ALWAYS update)
CONTRIBUTING.md            - How to contribute
SECURITY.md                - Security policies & practices
TESTING.md                 - Testing guidelines
PROJECT_RULES.md           - This file (project rules)
```

### Deployment Documentation
```
DEPLOYMENT.md              - Traditional deployment (Render backend + Netlify frontend)
NETLIFY.md                 - Serverless deployment (Netlify Functions + frontend)
```

**When to use which:**
- **DEPLOYMENT.md**: Use when deploying full Node.js backend to Render/Vercel/Railway
- **NETLIFY.md**: Use when deploying serverless (Netlify Functions only, no dedicated backend)

---

## ✅ Before Creating New Documentation

1. **Check existing files** - Can this be added to an existing .md file?
2. **Ask yourself**: "Does this duplicate ANY existing documentation?"
3. **If yes**: Update existing file, don't create new one
4. **If no**: Create new file with clear, unique purpose

---

## ✅ Before Deleting Any File

1. **Read the entire file** - Understand all content
2. **Check dependencies** - Is it referenced elsewhere?
3. **Verify consolidation** - Is ALL content preserved in consolidated file?
4. **Compare line-by-line** - Don't rely on assumptions
5. **Get approval** - Ask before deleting

---

## 📋 File Creation Checklist

Before adding a new file to the project root:

- [ ] Checked if existing file can be updated instead
- [ ] Verified no duplication with existing content
- [ ] File has a clear, unique purpose
- [ ] File name is descriptive and follows convention
- [ ] Added to this rules document (if it's documentation)

---

## 📋 File Deletion Checklist

Before deleting ANY file:

- [ ] Read the entire file to understand content
- [ ] Verified ALL content is preserved elsewhere
- [ ] Checked for references in other files
- [ ] Tested that nothing breaks without this file
- [ ] Got user approval for deletion

---

## 🔧 Code Organization Rules

### Component Structure
```
frontend/src/
├── components/          - Reusable UI components
├── pages/              - Page-level components
├── services/           - API calls, business logic
├── utils/              - Helper functions
└── contexts/           - React contexts
```

### Backend Structure
```
backend/src/
├── routes/             - API endpoints
├── models/             - Database models
├── services/           - Business logic
│   ├── huggingface/    - HF API integration
│   ├── ai/             - AI services (RAG, embeddings)
│   └── learning/       - Active learning system
├── middleware/         - Express middleware
└── utils/              - Helper functions
```

---

## 🎯 Naming Conventions

### Documentation Files
- Use UPPERCASE for root-level docs: `README.md`, `DEPLOYMENT.md`
- Use descriptive names: `NETLIFY.md` not `SETUP.md`
- One topic per file: `SECURITY.md` not `SECURITY_AND_TESTING.md`

### Code Files
- Components: PascalCase - `FeedbackForm.jsx`
- Services: camelCase - `chatService.js`
- Utils: camelCase - `apiFactory.js`
- Constants: UPPER_SNAKE_CASE - `API_CONSTANTS.js`

---

## 🔄 Update CONTEXT.md Rule

**CRITICAL: After completing ANY significant work:**

1. Open `CONTEXT.md`
2. Update "Last Updated" date
3. Add entry under "Recent Changes"
4. Update relevant status sections
5. This is NOT optional - ALWAYS do this

---

## 🚫 What NOT to Do

### Documentation
- ❌ Don't create `GUIDE.md` when `README.md` exists
- ❌ Don't create `SETUP.md` when setup is in `README.md`
- ❌ Don't create multiple deployment guides for the same stack
- ❌ Don't create temporary instruction files (delete after use)

### Code
- ❌ Don't copy-paste functions between files
- ❌ Don't duplicate API calls in multiple components
- ❌ Don't create multiple services doing the same thing
- ❌ Don't bypass established patterns

---

## ✅ What TO Do

### Documentation
- ✅ Update existing files when adding related content
- ✅ Keep files focused on ONE topic
- ✅ Add clear headers explaining file purpose
- ✅ Cross-reference related documentation

### Code
- ✅ Extract shared logic into services/utils
- ✅ Use existing patterns and conventions
- ✅ Import from single source of truth
- ✅ Follow DRY principle religiously

---

## 📊 Current Project Stats

**Root Documentation Files:** 7
- README.md
- CONTEXT.md
- CONTRIBUTING.md
- SECURITY.md
- TESTING.md
- DEPLOYMENT.md
- NETLIFY.md
- PROJECT_RULES.md (this file)

**Netlify Functions:** 2
- chat.js
- check-affiliations.js

**Frontend Pages:** 6+
**Backend Services:** 20+

---

## 🎯 Consolidation Completed

**Date:** December 30, 2024

**Actions Taken:**
- ✅ Consolidated 4 Netlify docs into 1 (NETLIFY.md)
- ✅ Deleted duplicates: NETLIFY_SETUP.md, QUICK_START_NETLIFY.md, NETLIFY_INTEGRATION_SUMMARY.md, SETUP_COMPLETE.md
- ✅ Kept DEPLOYMENT.md separate (different architecture)
- ✅ Created this rules document

---

## 🔮 Future Rules

As the project grows, follow these principles:

1. **Question every new file** - Is it necessary?
2. **Consolidate aggressively** - Merge similar content
3. **Delete obsolete files** - Remove after consolidation
4. **Document decisions** - Update this file
5. **Review periodically** - Check for new duplication monthly

---

**Remember: LESS IS MORE. Quality over quantity. DRY over WET.**
