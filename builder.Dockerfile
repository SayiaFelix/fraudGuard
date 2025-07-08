FROM node:16.16.0
WORKDIR /app
RUN npm install --location=global @angular/cli@14.2.9
COPY package*.json .
RUN npm install 

