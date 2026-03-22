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

### 4. Port Range Validation (RULE 9)
- **CRITICAL**: ALL ports MUST be in 4000-4499 range
- Extract all port numbers from docker-compose files
- Validate each port is within allowed range
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

5. **Validate Port Range (RULE 9)**
   ```bash
   # CRITICAL: Validate ALL ports are in 4000-4499 range
   # Exception: Ports 80/443 allowed ONLY in docker-compose.management.yml for Traefik
   echo "Validating RULE 9: Port Range 4000-4499..."

   for file in docker-compose.yml docker-compose.dev.yml docker-compose.management.yml; do
     if [ -f "$file" ]; then
       echo "Checking $file..."
       # Extract host ports (left side of port mapping)
       grep -hE "^\s+- ['\"]?([0-9.]+:)?[0-9]+:" "$file" | \
         grep -oE '([0-9.]+:)?([0-9]+):' | \
         grep -oE '^[0-9]+:' | \
         grep -oE '[0-9]+' | \
         while read port; do
           # Exception: Allow 80/443 in management.yml for Traefik
           if [ "$file" = "docker-compose.management.yml" ] && ([ "$port" -eq 80 ] || [ "$port" -eq 443 ]); then
             echo "  ℹ️  Port $port (Traefik HTTP/HTTPS - allowed exception)"
             continue
           fi

           if [ $port -lt 4000 ] || [ $port -gt 4499 ]; then
             echo "❌ RULE 9 VIOLATION: Port $port outside 4000-4499 range in $file"
             exit 2
           else
             echo "  ✅ Port $port within range"
           fi
         done
     fi
   done

   # Check .env files for PORT variables
   echo "Checking .env PORT variables..."
   grep -hE '^[A-Z_]*PORT\s*=\s*[0-9]+' .env backend/.env 2>/dev/null | \
     grep -oE '[0-9]+' | \
     sort -u | \
     while read port; do
       if [ $port -lt 4000 ] || [ $port -gt 4499 ]; then
         echo "❌ RULE 9 VIOLATION: PORT=$port outside 4000-4499 range in .env"
         exit 2
       else
         echo "  ✅ PORT=$port within range"
       fi
     done

   echo "✅ All ports within 4000-4499 range (RULE 9 compliant)"

   # Check port availability
   echo "Checking port availability..."
   lsof -i :4000 || echo "Port 4000 (frontend prod) available"
   lsof -i :4001 || echo "Port 4001 (backend prod/internal) available"
   lsof -i :4010 || echo "Port 4010 (frontend dev) available"
   lsof -i :4011 || echo "Port 4011 (backend dev) available"
   lsof -i :4030 || echo "Port 4030 (MongoDB) available"
   ```

## Example Output

```
🐳 DOCKER VALIDATION

✅ docker-compose.yml syntax valid
✅ All environment variables defined in .env
✅ Build contexts exist:
   - ./backend → backend/Dockerfile
   - ./frontend → frontend/Dockerfile
✅ RULE 9: All ports within 4000-4499 range
✅ Port allocation compliant:
   - 4000: Frontend (production)
   - 4001: Backend API (production & internal)
   - 4010: Frontend (development)
   - 4011: Backend API (development)
   - 4030: MongoDB
✅ All ports available (no conflicts)
✅ Volume mounts valid:
   - ./backend/src → /app/src
   - ./backend/logs → /app/logs
✅ Network configuration valid
✅ Health checks configured for all services

PORT ALLOCATION (RULE 9):
- Using standardized 4000-4499 range (see PORT_ALLOCATION.md)
- No conflicts with common dev tools (3000, 5000, 8080)
- All ports validated as RULE 9 compliant

RECOMMENDATION: Safe to commit. All validations passed.
```

## Exit Codes
- 0: All validations passed
- 1: Warnings only (safe to proceed)
- 2: Critical issues (block commit)
