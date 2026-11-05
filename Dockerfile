FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ARG BACKEND_API_URL=http://app:5000
ENV BACKEND_API_URL=${BACKEND_API_URL}

COPY package*.json ./
RUN npm ci --include=dev
COPY --chown=node:node . .
RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force \
  && chown -R node:node .next

USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
