# Install dependencies separately so application edits can reuse this build cache.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# Copy only what the running application needs into the final stage.
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app.js package.json ./
USER node
EXPOSE 3000
CMD ["node", "app.js"]
