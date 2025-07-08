# # Stage 1: Build
# FROM node:16 as builder
# WORKDIR /app
# # Copy dependency files first
# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile

# # Copy ALL config files (add these lines)
# COPY angular.json tsconfig.json tsconfig.app.json ./
# # Copy source files
# COPY src ./src
# # Build
# RUN npm run build -- --configuration production

# # Stage 2: Serve (unchanged)
# FROM nginx:alpine
# COPY --from=builder /app/dist/analytics-portal /usr/share/nginx/html
# COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
# EXPOSE 5017
# CMD ["nginx", "-g", "daemon off;"]


# Directly serve pre-built files with Nginx
FROM nginx:alpine

# Copy pre-built Angular app
COPY dist/ /usr/share/nginx/html

# Copy custom Nginx config 
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

# Expose port 5017
EXPOSE 5005

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]