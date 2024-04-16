# Agrily Frontend Web Client Dockerfile
# Stage 1: Build production React bundle with Node 18
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Set build arguments and flags for OpenSSL 3 / Node 18 compatibility
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Copy package manifests for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source files
COPY . .

# Compile optimized static bundle
RUN npm run build

# Stage 2: Serve compiled React assets via lightweight Nginx Alpine
FROM nginx:1.25-alpine

# Remove default Nginx welcome assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled build from builder stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing and reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web traffic port
EXPOSE 80

# Health check verifying root page serves successfully
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
