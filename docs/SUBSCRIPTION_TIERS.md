# FairMediator Subscription Tiers

## Overview

FairMediator offers two subscription tiers designed to serve both casual users and legal professionals who need comprehensive mediator selection tools.

## Free Tier

**Price:** $0/month

### Features
- 5 mediator searches per day
- Basic conflict detection
- Basic ideology classification
- Public chat (history not saved)
- Standard support
- View up to 10 mediator profiles per day

### Limitations
- Chat history deleted after session
- No advanced filters
- No export functionality
- No saved searches
- Standard response time (best effort)
- HuggingFace AI rate limits apply

### Use Cases
- Individual users exploring the platform
- One-time mediator selection needs
- Students and researchers
- Price-sensitive users

---

## Premium Tier

**Price:**
- $9.99/month (promotional - first 3 months)
- $19.99/month (regular price)
- $199/year (save 2 months - annual plan)

### Core Features

#### Unlimited Access
- ✅ **Unlimited mediator searches**
- ✅ **Unlimited profile views**
- ✅ **No daily rate limits**

#### Private Chat & History
- ✅ **Private chat with full history saved**
- ✅ **Search and filter past conversations**
- ✅ **Export chat transcripts**
- ✅ **Organize chats by case**

#### Advanced Filtering
- ✅ **Years of experience range** (e.g., 10-20 years)
- ✅ **Success rate filter** (minimum % threshold)
- ✅ **Fee range filter** ($/hour or flat fee)
- ✅ **Multiple practice areas** (AND/OR logic)
- ✅ **Specialty certifications** (e.g., AAA certified)
- ✅ **Languages spoken** (multilingual support)
- ✅ **Geographic radius** (miles from location)
- ✅ **Availability filters** (next 7/30/90 days)

#### Data Export & Reporting
- ✅ **Export results to PDF** (formatted reports)
- ✅ **Export to CSV** (for analysis)
- ✅ **Enhanced conflict detection reports** (detailed risk analysis)
- ✅ **Custom mediator comparison charts**

#### Productivity Features
- ✅ **Save searches for later** (unlimited saved searches)
- ✅ **Email alerts for new mediators** (matching saved criteria)
- ✅ **Analytics dashboard** (your search patterns and insights)
- ✅ **Priority support** (24-48 hour response time)

### Future Premium Features (Phase 2)
These features are planned for Premium subscribers:

- **AI-powered case matching**: Upload case details, get AI recommendations
- **Direct booking integration**: Schedule mediations directly through platform
- **Case document upload and analysis**: AI analyzes case documents for mediator matching
- **Mediator availability calendar**: Real-time availability checking
- **Team collaboration**: Share searches and notes with colleagues
- **API access**: Integrate with case management software
- **White-label options**: Custom branding for law firms

### Use Cases
- Law firms with regular mediation needs
- Corporations managing multiple disputes
- Professional mediator networks
- Legal departments needing comprehensive data
- Solo practitioners building client cases

---

## Feature Comparison Table

| Feature | Free | Premium |
|---------|------|---------|
| Mediator searches per day | 5 | Unlimited |
| Profile views per day | 10 | Unlimited |
| Chat history saved | ❌ | ✅ |
| Advanced filters | ❌ | ✅ |
| Export to PDF/CSV | ❌ | ✅ |
| Saved searches | ❌ | ✅ Unlimited |
| Email alerts | ❌ | ✅ |
| Conflict detection | Basic | Enhanced |
| Support response time | Best effort | 24-48 hours |
| Analytics dashboard | ❌ | ✅ |
| Mediator comparisons | ❌ | ✅ |

---

## Technical Implementation

### Usage Tracking

**Free Tier Limits:**
```javascript
{
  dailySearches: 5,        // Reset at midnight UTC
  dailyProfileViews: 10,   // Reset at midnight UTC
  chatHistoryRetention: 0, // Deleted on logout/session end
  aiCallsPerDay: 20        // HuggingFace API limits
}
```

**Premium Tier:**
```javascript
{
  dailySearches: Infinity,
  dailyProfileViews: Infinity,
  chatHistoryRetention: Infinity, // Stored indefinitely
  aiCallsPerDay: 1000      // Higher limit, cached responses
}
```

### Middleware Enforcement

All API routes checking subscription tier:
- `/api/chat` - Check daily search limit (free) or allow (premium)
- `/api/mediators/:id` - Check daily profile view limit
- `/api/chat/history` - Premium only
- `/api/export/*` - Premium only
- `/api/searches/save` - Premium only

### Database Schema

**User Model:**
```javascript
{
  email: String,
  passwordHash: String,
  subscriptionTier: 'free' | 'premium',
  subscriptionStatus: 'active' | 'cancelled' | 'expired',
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  usageStats: {
    searchesToday: Number,
    profileViewsToday: Number,
    lastResetDate: Date
  }
}
```

---

## Upgrade Path

### Free to Premium Upgrade Flow

1. User hits rate limit or clicks "Upgrade" button
2. Show upgrade modal with feature comparison
3. Redirect to payment page (Stripe Checkout)
4. On successful payment:
   - Update `subscriptionTier` to `premium`
   - Reset usage counters
   - Send welcome email with premium features guide
   - Redirect to dashboard with success message

### Premium Cancellation Flow

1. User clicks "Cancel subscription" in settings
2. Show confirmation modal (offer to pause instead)
3. On confirmation:
   - Set `subscriptionStatus` to `cancelled`
   - Keep premium access until end of billing period
   - Send cancellation confirmation email
4. On `subscriptionEndDate`:
   - Downgrade to `free` tier
   - Retain chat history (read-only for 30 days grace period)
   - Send "We miss you" email with re-activation offer

---

## Pricing Strategy

### Why $19.99/month?

**Competitive Analysis:**
- Legal research tools: $30-100/month
- LexisNexis: $100+/month
- Westlaw: $100+/month
- PACER alternatives: $20-50/month
- **FairMediator at $19.99 is positioned as affordable premium**

### Target Customer Value

**For a law firm:**
- Time saved: 2-3 hours per mediator search
- Lawyer hourly rate: $200-500/hour
- **ROI: 20-75x return on $19.99 investment**

**For a corporation:**
- Better mediator selection = better outcomes
- Average mediation cost: $5,000-50,000
- **Small premium for significantly better selection**

---

## Future Considerations

### Enterprise Tier (Phase 3)

**Potential pricing:** $199/month or $1,999/year

**Features:**
- Unlimited team members
- Advanced analytics and reporting
- API access with higher rate limits
- Dedicated account manager
- Custom integrations
- White-label options
- Priority feature requests
- SLA guarantees

---

## Analytics & Metrics to Track

### Key Conversion Metrics
- Free to Premium conversion rate (target: 5-10%)
- Time to first upgrade (median days)
- Upgrade triggers (hit rate limit vs proactive)
- Trial to paid conversion (if we add trials)

### Retention Metrics
- Monthly churn rate (target: <5%)
- Customer lifetime value (LTV)
- Premium subscriber engagement (searches/month)
- Feature usage by premium users

### Revenue Metrics
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Acquisition Cost (CAC)

---

## Implementation Checklist

- [ ] Create `Subscription` model in MongoDB
- [ ] Create `UsageLog` model for tracking
- [ ] Implement subscription middleware
- [ ] Add usage tracking to all endpoints
- [ ] Create upgrade UI components
- [ ] Integrate Stripe for payments
- [ ] Implement email notifications (Resend)
- [ ] Add analytics tracking (PostHog)
- [ ] Create admin dashboard for monitoring
- [ ] Write tests for all subscription logic
- [ ] Document API changes
- [ ] Update CLAUDE.md with subscription info

---

**Last Updated:** 2025-11-14
**Version:** 1.0
