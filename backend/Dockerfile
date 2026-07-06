# ---- Backend production image ----
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY . .

# Run as non-root user for security
RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production
EXPOSE 5000

# Basic container healthcheck against the API health endpoint.
# Uses $PORT (dynamic, set by PaaS like Render) with fallback to 5000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

CMD ["node", "src/index.js"]
