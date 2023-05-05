FROM node:16.16.0
WORKDIR /app
RUN yarn global add @angular/cli@14.2.10
COPY package.json .
RUN yarn install