FROM nginx:alpine

# Copy built Angular app
COPY dist/ams-portal /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

EXPOSE 5035

CMD ["nginx", "-g", "daemon off;"]
