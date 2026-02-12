# SEO Implementation TODO List

## Completed ✅
- [x] Installed `react-helmet-async` for dynamic meta tags
- [x] Created SEO component (`frontend/src/components/SEO/SEO.jsx`)
- [x] Created Schema.org helpers (`frontend/src/components/SEO/schemas.js`)

---

## Remaining Tasks

### 1. Integrate SEO Component into App
**File:** `frontend/src/App.jsx`

Add HelmetProvider wrapper:
```jsx
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      {/* existing routes */}
    </HelmetProvider>
  );
}
```

---

### 2. Add SEO to All Pages

#### HomePage (`frontend/src/pages/HomePage.jsx`)
```jsx
import SEO from '../components/SEO/SEO';
import { getOrganizationSchema, getWebSiteSchema } from '../components/SEO/schemas';

<SEO
  title="AI-Powered Mediator Selection"
  description="Find qualified, unbiased mediators using AI-powered conflict analysis. Transparent matching for family, business, and civil disputes."
  keywords={['mediator', 'mediation', 'conflict resolution', 'AI matching', 'dispute resolution']}
  jsonLd={getOrganizationSchema()}
/>
```

#### MediatorsPage (`frontend/src/pages/MediatorsPage.jsx`)
```jsx
<SEO
  title="Find Professional Mediators"
  description="Browse verified mediators with transparent credentials, specializations, and conflict-of-interest analysis."
  keywords={['find mediator', 'professional mediators', 'mediation services']}
  jsonLd={getLocalBusinessSchema()}
/>
```

#### Individual Mediator Profiles
```jsx
<SEO
  title={mediator.name}
  description={`Professional mediator specializing in ${mediator.specializations.join(', ')}. ${mediator.yearsExperience}+ years experience.`}
  type="profile"
  jsonLd={getMediatorPersonSchema(mediator)}
  image={mediator.profileImage}
/>
```

#### Other Pages
- `EthicsPage.jsx`: "Our Ethics & Transparency Standards"
- `SafeguardsPage.jsx`: "Conflict Detection & Safeguards"
- `DashboardPage.jsx`: Set `noindex={true}` (private page)
- `LoginPage.jsx`: "Login to FairMediator"
- etc.

---

### 3. Create Static Assets

#### A. Open Graph Image (`frontend/public/og-image.jpg`)
- Dimensions: 1200x630px
- Include: FairMediator logo + tagline
- Tool: Canva (free)

#### B. Favicon Package
Generate at: https://realfavicongenerator.net/
- Upload logo
- Download package
- Place in `frontend/public/`

---

### 4. Create robots.txt
**File:** `frontend/public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /upgrade
Disallow: /api/

Sitemap: https://fairmediator.netlify.app/sitemap.xml
```

---

### 5. Generate sitemap.xml

#### Option A: Static Sitemap
**File:** `frontend/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fairmediator.netlify.app/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fairmediator.netlify.app/mediators</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Add more URLs -->
</urlset>
```

#### Option B: Dynamic Sitemap (Better)
Install: `npm install --save-dev vite-plugin-sitemap`

**vite.config.js:**
```js
import sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [
    sitemap({
      hostname: 'https://fairmediator.netlify.app',
      dynamicRoutes: ['/mediators', '/ethics', '/safeguards'],
    }),
  ],
});
```

---

### 6. Setup Lighthouse CI

#### A. Install
```bash
npm install -g @lhci/cli
```

#### B. Create Config
**File:** `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173/", "http://localhost:4173/mediators"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

#### C. Add Script to package.json
```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

#### D. Run Audit
```bash
npm run build
npm run lighthouse
```

---

### 7. Google Search Console Setup

#### A. Verify Ownership
1. Go to: https://search.google.com/search-console
2. Add property: `https://fairmediator.netlify.app`
3. Choose verification method:
   - **HTML Tag** (easiest for React):
     ```html
     <meta name="google-site-verification" content="YOUR_CODE_HERE" />
     ```
   - Add to `index.html` or SEO component

#### B. Submit Sitemap
1. In Search Console → Sitemaps
2. Submit: `https://fairmediator.netlify.app/sitemap.xml`

#### C. Request Indexing
- Submit homepage and key pages for immediate crawling

---

### 8. Performance Optimizations

#### A. Preconnect to External Domains
**File:** `frontend/index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://api.fairmediator.netlify.app">
```

#### B. Add Meta Tags to index.html
```html
<meta name="theme-color" content="#1e40af">
<meta name="mobile-web-app-capable" content="yes">
```

---

### 9. Social Media Integration

#### Twitter/X
```jsx
<meta name="twitter:site" content="@fairmediator" />
<meta name="twitter:creator" content="@carolbonk" />
```

#### LinkedIn
Already handled by Open Graph tags

---

### 10. Analytics Setup (Optional)

#### Google Analytics 4 (Free)
1. Create GA4 property
2. Install: `npm install --save-dev vite-plugin-google-analytics`
3. Add to `vite.config.js`

---

## Priority Order

1. **HIGH**: Add SEO component to all pages (1 hour)
2. **HIGH**: Create robots.txt + sitemap.xml (30 min)
3. **MEDIUM**: Setup Lighthouse CI (30 min)
4. **MEDIUM**: Create og-image.jpg (1 hour)
5. **LOW**: Google Search Console setup (30 min)
6. **LOW**: Analytics integration (1 hour)

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Check Google Search Console for errors
- [ ] Monitor page rankings for target keywords
- [ ] Run Lighthouse audits

### Monthly Tasks
- [ ] Update sitemap if new pages added
- [ ] Review Core Web Vitals
- [ ] Check for broken links

---

## Expected Results

**Timeline:**
- Week 1: Pages start getting indexed
- Week 2-4: Rankings improve for brand terms
- Month 2-3: Rankings for target keywords improve

**Target Keywords:**
- "AI mediator selection"
- "find professional mediator"
- "conflict of interest mediator"
- "transparent mediation platform"

---

## Resources

- React Helmet Async Docs: https://github.com/staylor/react-helmet-async
- Schema.org Reference: https://schema.org/
- Google Search Console: https://search.google.com/search-console
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Structured Data Testing: https://search.google.com/test/rich-results

---

**Estimated Total Time: 6-8 hours**
**Difficulty: Beginner-Intermediate**
