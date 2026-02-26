# Multi-stage build for FairMediator Backend (Monorepo)
# Build context should be project root, not backend/

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /monorepo

# Copy root workspace configuration
COPY package*.json ./

# Copy backend workspace
COPY backend/package*.json ./backend/

# Install all dependencies (root + backend workspace)
RUN npm install --workspace=backend --include-workspace-root

# Copy backend source code
COPY backend/ ./backend/

# Stage 2: Production stage
FROM node:20-alpine AS production

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Labels
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/carolbonk/fairmediator.ai" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="FairMediator Backend" \
      org.opencontainers.image.description="Backend API for FairMediator platform"

# Install Python for ML models and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-scikit-learn \
    py3-pandas

WORKDIR /monorepo

# Copy root workspace configuration
COPY package*.json ./

# Copy backend workspace package files
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm install --workspace=backend --include-workspace-root --omit=dev && npm cache clean --force

# Copy backend application code from builder
COPY --from=builder /monorepo/backend/src ./backend/src

# Install remaining Python dependencies (numpy, scikit-learn, pandas from apk above)
# Only install additional packages not available in Alpine repos
COPY backend/src/ml_models/settlement_predictor/requirements.txt ./ml_requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages joblib

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p /monorepo/backend/logs && chown -R nodejs:nodejs /monorepo

# Switch to non-root user
USER nodejs

# Set working directory to backend
WORKDIR /monorepo/backend

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
