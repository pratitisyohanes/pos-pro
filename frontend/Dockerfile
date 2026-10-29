# Build stage: Vite bakes VITE_* values into the bundle at build time
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_BOOKING_URL=http://localhost:8080
ENV VITE_API_URL=/api/v1 VITE_AUTH_URL=/auth VITE_BOOKING_URL=$VITE_BOOKING_URL
RUN npm run build

# Serve stage: static files plus the same /api and /auth proxy rules as production
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
