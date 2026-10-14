# Multi-stage Dockerfile for MediCompare
# Stage 1: Build the Vite frontend
FROM node:18-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root & server package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install server production dependencies
WORKDIR /app/server
RUN npm install --production

WORKDIR /app
# Copy server source code and datasets
COPY server/ ./server/

# Copy built frontend assets from stage 1 into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/server.js"]
