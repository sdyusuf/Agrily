# Agrily API Backend Dockerfile
# Multi-stage production build running lightweight Node.js on Alpine Linux

FROM node:18-alpine

# Install curl for container health check probes
RUN apk add --no-cache curl

# Create application working directory
WORKDIR /usr/src/app

# Set default production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy application source code
COPY . .

# Ensure secure non-root file ownership
RUN chown -R node:node /usr/src/app

# Switch to unprivileged node user
USER node

# Expose API runtime port
EXPOSE 5000

# Container healthcheck testing category taxonomy endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/categories || exit 1

# Launch production server
CMD ["node", "server.js"]
