# Use Nginx to serve static files
FROM nginx:alpine

# Copy pre-built Angular dist folder
COPY dist/ams-portal /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 5035

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
