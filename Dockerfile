FROM devops-registry.ekenya.co.ke/channel-manager/portal-builder:latest as builder
WORKDIR /app
COPY . .
RUN ng build --configuration production --aot

## Create nginx image
FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
