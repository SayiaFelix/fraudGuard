FROM node:14.20.1-alpine
WORKDIR /app
RUN yarn global add @angular/cli@14.2.10
COPY package.json .
RUN yarn install