# Docker Validate Skill

## Purpose
Ensure Docker configuration is valid and builds succeed before committing. Prevent broken Docker deployments.

## When to Use
- After modifying Dockerfile (backend or frontend)
- After modifying docker-compose.yml
- Before pushing to main/production branches
- As part of deployment-checklist

## Validation Checks

### 1. Syntax Validation
- Run `docker compose config` to validate docker-compose.yml syntax
- Check for YAML syntax errors
- Verify service names are valid
- Ensure no circular dependencies

### 2. Environment Variable Check
- List all env vars referenced in docker-compose.yml
- Verify they exist in root .env file
- Check for missing required variables
- Warn about default values that should be overridden

### 3. Build Context Validation
- Verify build contexts exist (./backend, ./frontend)
- Check Dockerfile paths are correct
- Ensure COPY/ADD source paths exist
- Validate multi-stage build references

### 4. Port Conflict Check
- Check if ports are already in use
- Verify no port conflicts between services
- Ensure exposed ports match application configuration

### 5. Volume Mount Validation
- Check volume mount paths exist
- Verify permissions on mounted directories
- Ensure logs directory exists for backend

### 6. Network Configuration
- Validate network names
- Check service connectivity requirements
- Ensure depends_on relationships are correct

### 7. Health Check Validation
- Verify health check commands are valid
- Check timeout and retry settings are reasonable
- Test health check endpoints exist

## Task Execution

1. **Validate Syntax**
   ```bash
   docker compose config --quiet
   ```

2. **Check Environment Variables**
   ```bash
   # Extract env vars from docker-compose.yml
   grep -oE '\$\{[A-Z_]+' docker-compose.yml | sed 's/\${//' | sort -u
   
   # Compare with .env
   while read var; do
     grep -q "^${var}=" .env || echo "Missing: $var"
   done
   ```

3. **Verify Build Contexts**
   ```bash
   docker compose config | grep "context:" | awk '{print $2}'
   # Check each context exists
   ```

4. **Test Build (Optional)**
   ```bash
   # Dry run - validate without actually building
   docker compose build --dry-run 2>&1
   ```

5. **Check Port Availability**
   ```bash
   # Check if ports 5001, 3000, 27017 are available
   lsof -i :5001 || echo "Port 5001 available"
   lsof -i :3000 || echo "Port 3000 available"
   lsof -i :27017 || echo "Port 27017 available"
   ```

## Example Output

```
🐳 DOCKER VALIDATION

✅ docker-compose.yml syntax valid
✅ All environment variables defined in .env
✅ Build contexts exist:
   - ./backend → backend/Dockerfile
   - ./frontend → frontend/Dockerfile
⚠️  Port 27017 already in use (MongoDB running locally)
✅ Volume mounts valid:
   - ./backend/src → /app/src
   - ./backend/logs → /app/logs
✅ Network configuration valid
✅ Health checks configured for all services

WARNINGS:
- Consider stopping local MongoDB to avoid port conflict
  OR change docker-compose.yml to use port 27018

RECOMMENDATION: Safe to commit, but be aware of port 27017 conflict.
```

## Exit Codes
- 0: All validations passed
- 1: Warnings only (safe to proceed)
- 2: Critical issues (block commit)
