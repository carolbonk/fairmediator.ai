#!/bin/bash

# Docker Isolation Verification Script
# Tests that FairMediator is properly isolated from other Docker projects

set -e

echo "========================================"
echo "FairMediator Docker Isolation Verification"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    fail "Docker is not running. Please start Docker first."
    exit 1
fi
pass "Docker is running"

# Check if containers are running
echo ""
echo "1. Checking Container Isolation"
echo "--------------------------------"

CONTAINERS=$(docker ps --filter "name=fairmediator" --format "{{.Names}}" | wc -l | tr -d ' ')
if [ "$CONTAINERS" -gt 0 ]; then
    pass "Found $CONTAINERS FairMediator containers running"
    docker ps --filter "name=fairmediator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    warn "No FairMediator containers running. Start them with: docker-compose up -d"
fi

# Check network isolation
echo ""
echo "2. Checking Network Isolation"
echo "------------------------------"

NETWORKS=$(docker network ls --filter "name=fairmediator" --format "{{.Name}}" | wc -l | tr -d ' ')
if [ "$NETWORKS" -gt 0 ]; then
    pass "Found $NETWORKS isolated FairMediator networks"
    docker network ls --filter "name=fairmediator" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

    # Check for proper network segmentation
    if docker network inspect fairmediator_db_network > /dev/null 2>&1; then
        pass "Database network (fairmediator_db_network) exists"
        SUBNET=$(docker network inspect fairmediator_db_network -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
        echo "   Subnet: $SUBNET"
    fi

    if docker network inspect fairmediator_backend_network > /dev/null 2>&1; then
        pass "Backend network (fairmediator_backend_network) exists"
        SUBNET=$(docker network inspect fairmediator_backend_network -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
        echo "   Subnet: $SUBNET"
    fi
else
    warn "No FairMediator networks found. They'll be created when you start the containers."
fi

# Check volume isolation
echo ""
echo "3. Checking Volume Isolation"
echo "----------------------------"

VOLUMES=$(docker volume ls --filter "name=fairmediator" --format "{{.Name}}" | wc -l | tr -d ' ')
if [ "$VOLUMES" -gt 0 ]; then
    pass "Found $VOLUMES isolated FairMediator volumes"
    docker volume ls --filter "name=fairmediator" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
else
    warn "No FairMediator volumes found. They'll be created when you start the containers."
fi

# Check port bindings
echo ""
echo "4. Checking Port Security"
echo "-------------------------"

if [ "$CONTAINERS" -gt 0 ]; then
    # Check if MongoDB is bound to localhost only
    MONGO_PORT=$(docker ps --filter "name=fairmediator-mongodb" --format "{{.Ports}}" | grep -o "127.0.0.1:27017" || true)
    if [ -n "$MONGO_PORT" ]; then
        pass "MongoDB bound to localhost only (127.0.0.1:27017)"
    else
        MONGO_PORT_ANY=$(docker ps --filter "name=fairmediator-mongodb" --format "{{.Ports}}" | grep "27017" || true)
        if [ -n "$MONGO_PORT_ANY" ]; then
            warn "MongoDB port exposed - consider binding to 127.0.0.1 only"
            echo "   Current: $MONGO_PORT_ANY"
        fi
    fi

    # Check if Backend is bound to localhost only
    BACKEND_PORT=$(docker ps --filter "name=fairmediator-backend" --format "{{.Ports}}" | grep -o "127.0.0.1:4001" || true)
    if [ -n "$BACKEND_PORT" ]; then
        pass "Backend API bound to localhost only (127.0.0.1:4001)"
    else
        BACKEND_PORT_ANY=$(docker ps --filter "name=fairmediator-backend" --format "{{.Ports}}" | grep "4001" || true)
        if [ -n "$BACKEND_PORT_ANY" ]; then
            warn "Backend port exposed - consider binding to 127.0.0.1 only"
            echo "   Current: $BACKEND_PORT_ANY"
        fi
    fi
fi

# Check security options
echo ""
echo "5. Checking Security Hardening"
echo "------------------------------"

if [ "$CONTAINERS" -gt 0 ]; then
    for container in $(docker ps --filter "name=fairmediator" --format "{{.Names}}"); do
        echo ""
        echo "Container: $container"

        # Check no-new-privileges
        NO_NEW_PRIV=$(docker inspect "$container" -f '{{.HostConfig.SecurityOpt}}' | grep "no-new-privileges:true" || true)
        if [ -n "$NO_NEW_PRIV" ]; then
            pass "  no-new-privileges enabled"
        else
            warn "  no-new-privileges not enabled"
        fi

        # Check dropped capabilities
        CAP_DROP=$(docker inspect "$container" -f '{{.HostConfig.CapDrop}}' | grep "ALL" || true)
        if [ -n "$CAP_DROP" ]; then
            pass "  All capabilities dropped"
        else
            warn "  Not all capabilities dropped"
        fi

        # Check resource limits
        CPU_LIMIT=$(docker inspect "$container" -f '{{.HostConfig.NanoCpus}}')
        if [ "$CPU_LIMIT" != "0" ]; then
            pass "  CPU limit set"
        fi

        MEM_LIMIT=$(docker inspect "$container" -f '{{.HostConfig.Memory}}')
        if [ "$MEM_LIMIT" != "0" ]; then
            pass "  Memory limit set"
        fi
    done
fi

# Test network segmentation (if containers are running)
echo ""
echo "6. Testing Network Segmentation"
echo "--------------------------------"

if docker ps --filter "name=fairmediator-frontend" --format "{{.Names}}" | grep -q frontend && \
   docker ps --filter "name=fairmediator-mongodb" --format "{{.Names}}" | grep -q mongodb; then

    echo "Testing: Frontend -> MongoDB (should FAIL - different networks)"
    if docker exec fairmediator-frontend sh -c "nc -zv -w 2 mongodb 27017" 2>&1 | grep -q "succeeded"; then
        fail "  Frontend can reach MongoDB (SECURITY ISSUE!)"
    else
        pass "  Frontend cannot reach MongoDB (properly isolated)"
    fi
fi

if docker ps --filter "name=fairmediator-backend" --format "{{.Names}}" | grep -q backend && \
   docker ps --filter "name=fairmediator-mongodb" --format "{{.Names}}" | grep -q mongodb; then

    echo "Testing: Backend -> MongoDB (should SUCCEED - same network)"
    if docker exec fairmediator-backend sh -c "nc -zv -w 2 mongodb 27017" 2>&1 | grep -q "succeeded"; then
        pass "  Backend can reach MongoDB (correctly connected)"
    else
        warn "  Backend cannot reach MongoDB (check network configuration)"
    fi
fi

# Check for conflicts with other projects
echo ""
echo "7. Checking for Conflicts"
echo "-------------------------"

# Check for subnet overlaps
ALL_SUBNETS=$(docker network ls -q | xargs docker network inspect -f '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null | grep -v "^$")
echo "All Docker network subnets:"
echo "$ALL_SUBNETS"

FAIRMEDIATOR_SUBNET_172_20=$(echo "$ALL_SUBNETS" | grep "172.20.0.0" | wc -l | tr -d ' ')
FAIRMEDIATOR_SUBNET_172_21=$(echo "$ALL_SUBNETS" | grep "172.21.0.0" | wc -l | tr -d ' ')

if [ "$FAIRMEDIATOR_SUBNET_172_20" -gt 1 ]; then
    warn "Multiple networks using 172.20.0.0/24 subnet - possible conflict"
fi
if [ "$FAIRMEDIATOR_SUBNET_172_21" -gt 1 ]; then
    warn "Multiple networks using 172.21.0.0/24 subnet - possible conflict"
fi

# Summary
echo ""
echo "========================================"
echo "Verification Complete!"
echo "========================================"
echo ""

if [ "$CONTAINERS" -eq 0 ]; then
    echo "To start FairMediator:"
    echo "  Production: docker-compose up -d"
    echo "  Development: docker-compose -f docker-compose.dev.yml up -d"
fi

echo ""
echo "For detailed documentation, see: DOCKER_ISOLATION.md"
