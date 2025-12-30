# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite env vars
ARG VITE_USER_CORE_API
ARG VITE_RESORT_API
ARG VITE_GEAR_API_URL
ARG VITE_ENV

# Set environment variables from build args
ENV VITE_USER_CORE_API=${VITE_USER_CORE_API}
ENV VITE_RESORT_API=${VITE_RESORT_API}
ENV VITE_GEAR_API_URL=${VITE_GEAR_API_URL}
ENV VITE_ENV=${VITE_ENV}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
