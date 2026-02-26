# Multi-stage build for FairMediator Frontend (Monorepo)
# Build context should be project root, not frontend/

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /monorepo

# Copy root workspace configuration
COPY package*.json ./

# Copy frontend workspace
COPY frontend/package*.json ./frontend/

# Install all dependencies (root + frontend workspace)
RUN npm install --workspace=frontend --include-workspace-root

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the application from frontend workspace
WORKDIR /monorepo/frontend
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Labels
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/carolbonk/fairmediator.ai" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="FairMediator Frontend" \
      org.opencontainers.image.description="Frontend application for FairMediator platform"

# Copy built assets from builder
COPY --from=builder /monorepo/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Configure nginx to run as existing nginx user
# The nginx:alpine image already has nginx user/group
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to nginx user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
