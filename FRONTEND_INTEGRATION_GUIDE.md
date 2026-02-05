# Frontend Integration Guide - AI Features

## New Pages Created

### 1. SafeguardsPage (`/safeguards`)
**Location**: `frontend/src/pages/SafeguardsPage.jsx`

**What It Contains:**
- **Ethics & Standards Tab**: SafeGate protocol, ICODR standards, human mediator explanation
- **AI Intelligence Tab**: Detailed breakdown of all 3 AI features with technical details
  - Conflict Graph Intelligence
  - Settlement Range Predictions
  - Case Outcome Pattern Analysis
- **Cost Transparency**: Explanation of how the platform stays free
- **Data Sources**: Complete list of public APIs used

**Design Updates:**
- ✅ Silver/gray banner (replaced green/teal)
- ✅ Neomorphism design (`shadow-neumorphic`, `shadow-neumorphic-hover`)
- ✅ Tabbed interface for better organization
- ✅ Human-readable but technical explanations
- ✅ Real-world impact examples included

**Route**: `/safeguards`

---

### 2. MediatorsPage (`/mediators`)
**Location**: `frontend/src/pages/MediatorsPage.jsx`

**What It Contains:**
- **Regional Breakdown**: 5 U.S. regions with state-specific requirements
  - Northeast (NY, NJ, PA, MA, CT, RI, VT, NH, ME)
  - Southeast (FL, GA, NC, SC, VA, TN, AL, MS, LA, AR, KY, WV)
  - Midwest (IL, OH, MI, IN, WI, MN, IA, MO, KS, NE, SD, ND)
  - Southwest (TX, OK, NM, AZ)
  - West (CA, WA, OR, NV, ID, UT, CO, WY, MT, AK, HI)

- **For Each Region:**
  - Certification requirements
  - Court integration details
  - Common specialties
  - Average hourly rates
  - Unique state requirements
  - Real examples

- **How We Handle Complexity**: 4 major challenges explained
  - Different certification standards
  - Varying conflict-of-interest rules
  - Court vs. private mediation
  - Multi-state disputes

- **AI Consistency**: Why conflict detection works the same nationwide
- **Coming Soon**: State-specific AI features roadmap

**Design Updates:**
- ✅ Silver/gray banner (replaced green/teal)
- ✅ Neomorphism design throughout
- ✅ Interactive region filter
- ✅ Technical + accessible language
- ✅ Problem/Solution cards

**Route**: `/mediators`

---

## Routing Changes

### Updated: `frontend/src/App.jsx`

```javascript
// Added imports
const SafeguardsPage = lazy(() => import('./pages/SafeguardsPage'));
const MediatorsPage = lazy(() => import('./pages/MediatorsPage'));

// Added routes
<Route path="/ethics" element={<EthicsPage />} />  // Old ethics page preserved
<Route path="/safeguards" element={<SafeguardsPage />} />  // New safeguards page
<Route path="/mediators" element={<MediatorsPage />} />  // New mediators page
```

---

## Navigation Updates

### Footer (`frontend/src/components/Footer.jsx`)

Added link to new Mediators page:

```jsx
<Link to="/mediators">Mediators Across America</Link>
<Link to="/safeguards">How We Protect Your Mediation</Link>
```

---

## Design System

### Neomorphism Classes Used

**Shadows:**
- `shadow-neumorphic` - Soft raised effect
- `shadow-neumorphic-hover` - Enhanced on hover
- `shadow-inner` - Inset shadow for depth

**Colors:**
- Banner: `bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600`
- Cards: `bg-gray-50`
- Accents: `bg-gradient-to-br from-gray-200 to-gray-300`
- Borders: `border-gray-400`

**Typography:**
- Headers: `text-gray-800`
- Body: `text-gray-600` / `text-gray-700`
- Captions: `text-gray-500`
- Technical notes: `font-mono bg-gray-50`

**Hover Effects:**
- `hover:shadow-neumorphic-hover`
- `hover:-translate-y-1`
- `transition-all duration-200` / `transition-shadow duration-300`

---

## Content Strategy

### Writing Style

**Before:**
```
"Our AI uses advanced algorithms to detect conflicts."
```

**After:**
```
"Think of it as 'Six Degrees of Kevin Bacon,' but for detecting
bias in legal professionals. We trace relationships across 6 degrees
of connection: employment history, shared court cases, co-authored
publications, campaign donations, and conference attendance."
```

**Principles:**
- ✅ Use analogies (Six Degrees of Kevin Bacon)
- ✅ Show real numbers (90% win rate, 82% R² score)
- ✅ Explain "why" not just "what"
- ✅ Include technical details in separate sections
- ✅ Add italicized footnotes for context
- ✅ Use concrete examples instead of abstractions

---

## State-by-State Differentiation

### Regional Characteristics Covered

Each region includes:
1. **Certification requirements** (e.g., "40+ hours training + CLE")
2. **Court integration** (e.g., "mandatory mediation since 1980s")
3. **Common specialties** (e.g., "tech sector disputes, environmental law")
4. **Average costs** (e.g., "$350-$500/hour")
5. **Unique requirements** (e.g., "FL requires county-specific family certification")

### Real Examples Included

- **New York**: Unified Court System registration requirement
- **Florida**: Supreme Court certification system (gold standard)
- **Minnesota**: $1M liability insurance mandate
- **Texas**: No statewide certification (relies on organizations)
- **California**: Separate tracks for civil vs. family mediation

---

## Cross-Page Links

Pages link to each other:

**SafeguardsPage → MediatorsPage**
```jsx
<Link to="/mediators">
  Explore State-by-State Differences →
</Link>
```

**MediatorsPage → SafeguardsPage**
```jsx
<Link to="/safeguards">
  Read Our AI Documentation →
</Link>
```

This creates a natural flow:
1. User learns about AI safeguards
2. Gets curious about state differences
3. Learns how mediators vary by state
4. Returns to understand technical details

---

## Testing Checklist

### Visual Testing
- [ ] Verify silver banner appears (not green/teal)
- [ ] Check neomorphism shadows render correctly
- [ ] Test responsive layout on mobile (320px to 768px)
- [ ] Confirm all cards have hover effects
- [ ] Check tab switching on SafeguardsPage

### Content Testing
- [ ] Verify all 3 AI features are explained (Conflict Graph, Settlement Predictor, Case Outcome)
- [ ] Check all 5 regions display on MediatorsPage
- [ ] Test region filter functionality
- [ ] Confirm all links work (internal and email)
- [ ] Verify code snippets display in monospace font

### Accessibility Testing
- [ ] Check color contrast (WCAG AA minimum)
- [ ] Test keyboard navigation (Tab through all interactive elements)
- [ ] Verify screen reader compatibility
- [ ] Check touch target sizes (min 44x44pt)

---

## Future Enhancements

### Phase 1: API Integration (Next Sprint)
- Wire up conflict detection to mediator cards
- Add settlement prediction to case intake form
- Implement batch conflict checking with CSV upload

### Phase 2: Interactive Features
- Add state map visualization (click states to filter)
- Include mediator search with state filter
- Add "Find Mediator in Your State" widget

### Phase 3: Advanced Content
- Add blog/case studies section
- Include video explainers for AI features
- Create interactive demos (e.g., "Try Our Conflict Detector")

---

## SEO & Metadata

### Recommended Meta Tags

```html
<!-- SafeguardsPage -->
<title>AI Safeguards & Ethics | FairMediator</title>
<meta name="description" content="Learn how our AI conflict detection, settlement prediction, and bias analysis protect your mediation. Full transparency on data sources, algorithms, and limitations." />

<!-- MediatorsPage -->
<title>Mediator Requirements by State | FairMediator</title>
<meta name="description" content="Understand how mediator certification, conflict rules, and court integration differ across all 50 states. Compare regional requirements and AI consistency." />
```

### Keywords to Target

- "mediator conflict of interest detection"
- "False Claims Act settlement prediction"
- "state mediation requirements"
- "court-connected mediation rules"
- "AI bias detection for mediators"

---

## Analytics Tracking

### Events to Track

```javascript
// SafeguardsPage
trackEvent('safeguards_tab_switch', { tab: 'ethics' | 'ai' });
trackEvent('ai_feature_viewed', { feature: 'conflict_graph' | 'settlement' | 'case_outcome' });
trackEvent('ethics_contact_clicked');

// MediatorsPage
trackEvent('region_filter_used', { region: 'northeast' | 'southeast' | ... });
trackEvent('state_info_viewed', { state: 'CA' | 'NY' | ... });
trackEvent('cross_page_link_clicked', { from: 'mediators', to: 'safeguards' });
```

---

## Questions & Support

### Common User Questions to Address

**"Why is this free?"**
→ Answered in "Cost Transparency" section on SafeguardsPage

**"How accurate are settlement predictions?"**
→ Answered in "Settlement Range Predictions" with R² score (82%)

**"Can I use a California mediator for a Texas case?"**
→ Answered in "Multi-State Disputes" challenge on MediatorsPage

**"What if my state isn't listed?"**
→ Covered in "Coming Soon: State-Specific Features"

---

## Developer Notes

### Component Dependencies

Both pages require:
- `Header` component
- `Footer` component
- `react-router-dom` for `<Link>` and `useNavigate`
- Tailwind CSS with neomorphism utilities

### State Management

No complex state needed. Both pages use:
- Simple `useState` for tab/filter switching
- No API calls (pure informational content)
- No authentication required (public pages)

### Performance Considerations

- Both pages are lazy-loaded in App.jsx
- No heavy images or videos
- Minimal re-renders (static content)
- Could add React.memo if needed for large data sets

---

## Deployment Checklist

- [x] Create SafeguardsPage.jsx
- [x] Create MediatorsPage.jsx
- [x] Update App.jsx routing
- [x] Update Footer navigation
- [ ] Test all routes work in development
- [ ] Test all routes work in production (Netlify)
- [ ] Verify sitemap includes new pages
- [ ] Submit to Google Search Console
- [ ] Update robots.txt if needed

---

**Last Updated**: February 5, 2026
**Status**: ✅ Ready for Testing
**Estimated Dev Time to Wire APIs**: 1-2 weeks
