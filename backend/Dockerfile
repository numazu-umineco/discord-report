FROM node:22

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY backend/src ./backend/src

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "src/index.js"]
