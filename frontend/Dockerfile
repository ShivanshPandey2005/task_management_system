# --- build the static bundle ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Leave empty to call the API on the same origin (nginx proxies /api); set a full URL to call another host.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- serve it ---
FROM nginx:1.27-alpine
# The official image renders /etc/nginx/templates/*.template with the container's env vars at startup.
ENV API_UPSTREAM=http://api:8000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
