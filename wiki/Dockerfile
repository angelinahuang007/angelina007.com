# Wiki service — lightweight Node.js server for markdown wiki
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

# Copy application code
COPY server.js ./
COPY public/ ./public/
COPY content/ ./content/

# Create non-root user
RUN addgroup --system --gid 1001 wiki && \
    adduser --system --uid 1001 --ingroup wiki wiki
USER wiki

EXPOSE 4000

ENV PORT=4000 \
    NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/articles', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

CMD ["node", "server.js"]
