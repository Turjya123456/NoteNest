# ============================================================
#  NoteNest — Dockerfile
#  Node.js 20 LTS on Alpine Linux (small, fast, secure)
# ============================================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first (better Docker layer caching)
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --omit=dev

# ---- Stage 2: Final runtime image ----
FROM node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S notenest && adduser -S notenest -G notenest

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source files
COPY server.js        ./server.js
COPY package.json     ./package.json
COPY public/          ./public/
COPY data/            ./data/

# Give ownership of the app folder to the non-root user
RUN chown -R notenest:notenest /app

# Switch to non-root user
USER notenest

# Expose the application port
EXPOSE 3000

# Health check — make sure the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Start the app
CMD ["node", "server.js"]
