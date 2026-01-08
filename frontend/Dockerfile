# Build stage
FROM node:22 AS builder

WORKDIR /app

# Copy all package files for workspace
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./frontend/

# Build frontend
RUN npm run build --workspace=frontend

# Production stage
FROM nginx:1.28

# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config template
COPY frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
