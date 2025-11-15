# MongoDB Setup with Docker

## Quick Start

### 1. Start MongoDB

```bash
# Start MongoDB (and optional web UI)
docker-compose up -d

# Check if running
docker-compose ps

# View logs
docker-compose logs mongodb
```

### 2. Verify Connection

Your backend is already configured to connect! The `.env` file has:
```
MONGODB_URI=mongodb://localhost:27017/fairmediator
```

### 3. Access MongoDB

**Option 1: Via your backend**
```bash
cd backend
npm run dev
# Look for: "✅ MongoDB connected successfully"
```

**Option 2: Via Mongo Express (Web UI)**
- Open: http://localhost:8081
- Username: `admin`
- Password: `admin123`
- Browse your database visually

**Option 3: Via MongoDB Shell**
```bash
# Connect to MongoDB container
docker exec -it fairmediator-mongodb mongosh

# Inside mongosh:
use fairmediator
show collections
db.users.find()
exit
```

## Common Commands

### Start/Stop MongoDB

```bash
# Start
docker-compose up -d

# Stop (keeps data)
docker-compose stop

# Stop and remove (keeps data in volumes)
docker-compose down

# Stop and DELETE all data
docker-compose down -v
```

### View Database

```bash
# See all containers
docker-compose ps

# View MongoDB logs
docker-compose logs -f mongodb

# Access MongoDB shell
docker exec -it fairmediator-mongodb mongosh fairmediator

# Backup database
docker exec fairmediator-mongodb mongodump --out /data/backup

# Restore database
docker exec fairmediator-mongodb mongorestore /data/backup
```

### Troubleshooting

**"Connection refused" or "ECONNREFUSED"**
```bash
# Check if MongoDB is running
docker-compose ps

# Restart if needed
docker-compose restart mongodb

# Check logs for errors
docker-compose logs mongodb
```

**"Port 27017 already in use"**
```bash
# Check what's using the port
lsof -i :27017

# Kill it or change docker-compose.yml port to "27018:27017"
```

**Reset Everything**
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Database Structure

FairMediator uses these collections:

### Core Collections
- `users` - User accounts and authentication
- `mediators` - Mediator profiles and data
- `subscriptions` - Stripe subscription records
- `usagelogs` - Analytics and usage tracking

### Sample Queries

```javascript
// Find all premium users
db.users.find({ subscriptionTier: 'premium' })

// Find mediators by practice area
db.mediators.find({ practiceAreas: 'Technology' })

// Get usage stats for last 7 days
db.usagelogs.find({
  timestamp: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
})

// Count active subscriptions
db.subscriptions.countDocuments({ status: 'active' })
```

## Seeding Sample Data

Want to populate your database with sample mediators for testing?

```bash
cd backend

# Create seed script
npm run seed

# Or manually via mongosh
docker exec -it fairmediator-mongodb mongosh fairmediator
```

```javascript
// Sample mediator
db.mediators.insertOne({
  name: "Jane Smith",
  email: "jane.smith@example.com",
  practiceAreas: ["Technology", "IP", "Corporate"],
  jurisdiction: "CA",
  location: { city: "San Francisco", state: "CA" },
  yearsExperience: 15,
  rating: 4.8,
  totalCases: 150,
  bio: "Experienced mediator specializing in tech disputes",
  availability: "available",
  ideology: { score: 0, label: "neutral" },
  knownAffiliations: [],
  caseHistory: []
})
```

## Data Persistence

Your MongoDB data is stored in Docker volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration

**Data persists even when you stop containers!**

To see volumes:
```bash
docker volume ls | grep fairmediator
```

To backup volumes:
```bash
docker run --rm -v fairmediator_mongodb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## Production Notes

For production, you'll want to:
1. ✅ Use MongoDB Atlas (free 512MB tier)
2. ✅ Enable authentication
3. ✅ Set up automated backups
4. ✅ Use connection pooling
5. ✅ Monitor performance

The current setup is perfect for local development!
