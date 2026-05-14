# Next.js Marketing Site Dockerfile for Cloud Run
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Cloud Run expects port 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

# Start the Next.js server
CMD ["npm", "start", "--", "-p", "8080"]
