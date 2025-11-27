FROM nginx:alpine

# Copy Angular built files
COPY dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


# FROM node:18-alpine

# WORKDIR /app

# RUN npm install -g json-server

# COPY db.json /app/db.json

# EXPOSE 3000

# CMD ["json-server", "--watch", "db.json", "--port", "3000", "--host", "0.0.0.0"]


# # backend/Dockerfile
# FROM node:18-alpine


# WORKDIR /app


# # install json-server globally
# RUN npm install -g json-server


# # copy db.json
# COPY db.json /app/db.json


# EXPOSE 3000


# # expose on all interfaces so other containers can reach it
# CMD ["json-server", "--watch", "db.json", "--port", "3000", "--host", "0.0.0.0"]