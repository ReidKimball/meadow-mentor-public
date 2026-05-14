# Multi-stage Dockerfile to build client inside the image and run backend

# 1) Build the client (Vite) so we don't rely on a prebuilt dist on host
FROM node:22-slim AS client-builder
WORKDIR /app/client

# Install client deps using lockfile for reproducibility and caching
COPY client/package*.json ./
RUN npm ci

# Copy client source and build
COPY client/ .
RUN npm run build

# 2) Runtime image for backend + serve built client assets
# Select a base image that includes Node
FROM node:22-slim
# Set a general working directory for the project root in the container
# Using /usr/src/app as a common convention for Node.js apps
WORKDIR /usr/src/app
# Set NODE_ENV to production for the container
# This is good practice for optimizations and can be used by dependencies
ENV NODE_ENV=production

# Copy the backend application files into a 'backend' subdirectory within /usr/src/app
# This means index.js will be at /usr/src/app/backend/index.js
COPY backend/ /usr/src/app/backend/

# Copy built client from the builder stage
COPY --from=client-builder /app/client/dist/ /usr/src/app/client/dist/

# App port (Express should bind to this)
ENV PORT=8000

# Install backend production dependencies
WORKDIR /usr/src/app/backend
RUN npm install --only=production --legacy-peer-deps

# Start the backend (must be defined in backend/package.json)
CMD ["npm", "start"]
