# Account Type Migration Guide

This guide explains how to migrate existing User accounts to include the new `accountType` field.

## Overview

The `accountType` field was added to distinguish between three types of users:
- **mediator**: Professional mediators providing services
- **attorney**: Attorneys searching for mediators
- **party**: Parties in disputes seeking mediators

## Migration Options

### Option 1: Automatic Migration (Recommended for Development)

Automatically assigns account types based on:
- Users with linked Mediator profiles → `mediator`
- All other users → `party` (safe default)

**Dry Run (Preview Changes):**
```bash
cd backend
node src/scripts/migrate-add-accountType.js --dry-run
```

**Apply Migration:**
```bash
node src/scripts/migrate-add-accountType.js
```

### Option 2: Manual Assignment

For production environments, you may want to manually review and assign account types:

1. Export user list:
```bash
# MongoDB shell
use fairmediator
db.users.find({ accountType: { $exists: false } }, { email: 1, name: 1 }).pretty()
```

2. Update individually:
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { accountType: "mediator" } }
)
```

### Option 3: User Self-Selection on Next Login

The system will automatically prompt users without `accountType` to select their role on next login.

**Implementation:**
1. Frontend middleware checks for `user.accountType`
2. If missing, shows account type selection modal
3. User selects: Mediator / Attorney / Party
4. Updates via API: `PUT /api/auth/select-account-type`

## Migration Steps

### Before Migration

1. **Backup Database:**
```bash
mongodump --uri="mongodb://localhost:27017/fairmediator" --out=./backup-$(date +%Y%m%d)
```

2. **Review Linked Mediators:**
```bash
node src/scripts/migrate-add-accountType.js --dry-run
```

### Run Migration

**For Development:**
```bash
node src/scripts/migrate-add-accountType.js
```

**For Production:**
```bash
# 1. Test on staging first
NODE_ENV=staging node src/scripts/migrate-add-accountType.js --dry-run

# 2. Apply on staging
NODE_ENV=staging node src/scripts/migrate-add-accountType.js

# 3. If successful, apply on production
NODE_ENV=production node src/scripts/migrate-add-accountType.js
```

### After Migration

1. **Verify Migration:**
```javascript
// MongoDB shell
use fairmediator

// Count users by account type
db.users.aggregate([
  { $group: { _id: "$accountType", count: { $sum: 1 } } }
])

// Check for users without accountType
db.users.countDocuments({ accountType: { $exists: false } })
```

2. **Test Application:**
- Login as each account type
- Verify correct dashboard loads
- Check role-specific features

## Rollback

If you need to rollback:

```javascript
// MongoDB shell - Remove accountType field from all users
db.users.updateMany(
  {},
  { $unset: { accountType: "" } }
)
```

Then restore from backup:
```bash
mongorestore --uri="mongodb://localhost:27017/fairmediator" ./backup-20260318
```

## Validation Schema

After migration, the User model enforces:

```javascript
accountType: {
  type: String,
  enum: ['mediator', 'attorney', 'party'],
  required: true
}
```

**Note:** New users must provide `accountType` during registration.

## Troubleshooting

### Migration fails with "MongoServerError: E11000 duplicate key"
- This shouldn't happen with accountType, but check for other unique index issues
- Verify database indexes: `db.users.getIndexes()`

### Some users still don't have accountType after migration
- Check migration logs for errors
- Manually verify those specific users
- Consider running migration again (it's idempotent)

### Users assigned wrong account type
- Review mediator linking logic in `src/services/mediatorLinkingService.js`
- Manually update: `db.users.updateOne({ email: "..." }, { $set: { accountType: "mediator" } })`

## Support

For issues or questions, check:
- Migration script logs
- Backend logs: `backend/logs/`
- Database connection settings in `.env`
