# Account Type Implementation

## Overview

This document describes the implementation of the `accountType` field to distinguish between three types of users in FairMediator.

## Account Types

1. **Mediator** (`mediator`)
   - Professional mediators providing services
   - Can link to Mediator profiles
   - Access to Mediator Dashboard with profile stats

2. **Attorney** (`attorney`)
   - Attorneys representing clients
   - Search for mediators
   - Access to Attorney Dashboard with search tools

3. **Party** (`party`)
   - Individuals or entities in disputes
   - Seeking mediators
   - Access to Party Dashboard with educational resources

## Architecture

### Database Schema

**User Model** (`backend/src/models/User.js`)
```javascript
{
  accountType: {
    type: String,
    enum: ['mediator', 'attorney', 'party'],
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  }
}
```

**Key Points:**
- `accountType`: User classification (mediator/attorney/party)
- `role`: Permission level (user/moderator/admin)
- Clear separation of concerns

**Indexes:**
```javascript
{ accountType: 1 }                          // Single index
{ accountType: 1, subscriptionTier: 1 }     // Compound index
```

**Mediator Model** (`backend/src/models/Mediator.js`)
```javascript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  }
}
```

### Backend API

**Authentication Routes** (`backend/src/routes/auth.js`)

1. **Registration**
   ```
   POST /api/auth/register
   Body: { email, password, name, accountType }
   ```
   - Requires `accountType` field
   - Auto-links mediator profiles by email

2. **Login**
   ```
   POST /api/auth/login
   Body: { email, password, accountType? }
   ```
   - Optional `accountType` verification
   - Returns user with `accountType` in response

3. **Account Type Selection (Migration)**
   ```
   PUT /api/auth/select-account-type
   Body: { accountType }
   ```
   - For legacy users without `accountType`
   - One-time selection only

**Mediator Routes** (`backend/src/routes/mediators.js`)

1. **Link Profile**
   ```
   POST /api/mediators/link-profile
   ```
   - Links user to mediator profile by email
   - Requires mediator accountType

2. **Get My Profile**
   ```
   GET /api/mediators/my-profile
   ```
   - Returns linked mediator profile

3. **Create Profile**
   ```
   POST /api/mediators/create-profile
   Body: { name, bio, specializations, ... }
   ```
   - Creates new mediator profile linked to user

**Services** (`backend/src/services/mediatorLinkingService.js`)

- `linkUserToMediatorProfile(userId)` - Auto-link by email
- `createMediatorProfile(userId, data)` - Create new profile
- `getMediatorProfileByUserId(userId)` - Get linked profile
- `unlinkMediatorProfile(userId)` - Remove link

### Frontend Implementation

**Components**

1. **LoginForm** (`src/components/auth/LoginForm.jsx`)
   - Role selection: Mediator / Attorney / Party
   - Sends `accountType` with credentials

2. **RegisterForm** (`src/components/auth/RegisterForm.jsx`)
   - Role selection UI added
   - Validates `accountType` before submission

3. **AccountTypeSelector** (`src/components/auth/AccountTypeSelector.jsx`)
   - Modal for legacy users without `accountType`
   - Shows on first login after migration
   - One-time selection

4. **ProtectedRoute** (`src/components/ProtectedRoute.jsx`)
   - Checks for `user.accountType`
   - Shows AccountTypeSelector if missing

**Dashboards**

1. **DashboardPage** (`src/pages/dashboard/DashboardPage.jsx`)
   - Router based on `user.accountType`
   - Routes to appropriate dashboard

2. **MediatorDashboard** (`src/pages/dashboard/MediatorDashboard.jsx`)
   - Profile views, ratings, cases
   - Profile completion alerts
   - Quick actions for mediators

3. **AttorneyDashboard** (`src/pages/dashboard/AttorneyDashboard.jsx`)
   - Search activity, saved mediators
   - Conflict checker tools
   - Recent search history

4. **PartyDashboard** (`src/pages/dashboard/PartyDashboard.jsx`)
   - Educational content
   - Recommended mediators
   - Step-by-step guidance

**Context Updates** (`src/contexts/AuthContext.jsx`)

```javascript
login(email, password, accountType)
register(email, password, name, accountType)
```

## Migration

### Database Migration Script

**Location:** `backend/src/scripts/migrate-add-accountType.js`

**Usage:**
```bash
# Preview changes
node backend/src/scripts/migrate-add-accountType.js --dry-run

# Apply migration
node backend/src/scripts/migrate-add-accountType.js
```

**Logic:**
1. Find users without `accountType`
2. Check for linked Mediator profile → `mediator`
3. Default all others → `party`

### User Migration (Production)

For existing users, three approaches:

1. **Automatic (Development)**
   - Run migration script
   - Assigns defaults based on data

2. **User Self-Selection (Production)**
   - AccountTypeSelector modal on next login
   - One-time selection
   - Persists to database

3. **Manual (Case-by-case)**
   - Admin reviews and assigns
   - Update via MongoDB shell

## Security

- **Account type verification on login** (optional)
- **JWT includes accountType** for authorization
- **Validation at API layer** prevents invalid types
- **Role-based access control** for mediator endpoints

## Performance

**Query Complexity:**
- `User.find({ accountType: 'mediator' })` → O(log n) with index
- Compound index for common patterns
- Sparse index on `Mediator.userId` saves space

**Caching:**
- No additional caching needed
- Existing mediator cache still applies

## Testing

**Backend Tests:**
```bash
# Test registration with accountType
npm test -- auth.test.js

# Test account type selection
npm test -- accountType.test.js

# Test mediator linking
npm test -- mediatorLinking.test.js
```

**Frontend Tests:**
```bash
# Test dashboard routing
npm test -- DashboardPage.test.jsx

# Test account type selector
npm test -- AccountTypeSelector.test.jsx
```

## Documentation

- **Migration Guide:** `backend/MIGRATION_GUIDE.md`
- **API Documentation:** Update Swagger/OpenAPI docs
- **User Guide:** Add to help center

## Rollback Plan

If issues occur:

1. **Stop new registrations** (disable accountType requirement)
2. **Remove field from User model**
3. **Run rollback script:**
   ```javascript
   db.users.updateMany({}, { $unset: { accountType: "" } })
   ```
4. **Restore from backup** if needed

## Future Enhancements

1. **Account type change requests**
   - User submits request
   - Admin reviews and approves
   - Logs change history

2. **Multi-role support**
   - Users can have multiple roles
   - Array of accountTypes
   - Primary role designation

3. **Role-specific features**
   - Mediator: Profile editing, case management
   - Attorney: Advanced conflict detection
   - Party: Educational resources, guided workflows

## Support

**Common Issues:**

1. **Users can't select account type**
   - Check API endpoint: `PUT /api/auth/select-account-type`
   - Verify user doesn't already have accountType
   - Check browser console for errors

2. **Migration fails**
   - Review logs in `backend/logs/`
   - Check MongoDB connection
   - Verify User model schema

3. **Dashboard not loading**
   - Ensure user has accountType
   - Check dashboard routing in DashboardPage.jsx
   - Verify API returns accountType in /auth/me

**Contact:**
- Development team: dev@fairmediator.ai
- Support: support@fairmediator.ai
