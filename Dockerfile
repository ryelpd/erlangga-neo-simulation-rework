# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Vue app
COPY --from=build /app/dist /usr/share/nginx/html

# Pre-compress WASM files
RUN find /usr/share/nginx/html -type f -name "*.wasm" -exec gzip -9 -k {} \;

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
