FROM node:14.17.3 as builder
WORKDIR /app
RUN yarn global add @angular/cli@14.2.10
COPY package.json .
RUN yarn install
COPY . .
RUN ng build --configuration production --aot

## Create nginx image
FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
