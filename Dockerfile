# Multi-stage Dockerfile for MediCompare Production Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build client bundle & seed database
RUN cd client && npm run build
RUN node server/scripts/build_full_dataset.js

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/server.js"]
