FROM node:16.16.0
WORKDIR /app
RUN npm install -g @angular/cli@14.2.9
COPY package*.json .
RUN yarn install

