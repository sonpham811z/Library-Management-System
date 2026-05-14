# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install ONLY production dependencies (no devDependencies)
RUN npm ci --omit=dev

# ─── Stage 2: Final runtime image ─────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Set NODE_ENV to production at build time
# (Runtime secrets like DB credentials are injected via Container App env vars)
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port declared in main.tf → ingress.target_port
EXPOSE 3000

# Switch to non-root
USER appuser

# Start the API
CMD ["node", "src/app.js"]
