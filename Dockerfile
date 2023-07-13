# base image
FROM devops-registry.ekenya.co.ke/tra-project/customer-portal-builder as builder
WORKDIR /app
COPY . .
RUN ng build --prod --base-href /tra-customer-portal/ --deploy-url /tra-customer-portal/
## Create nginx image
FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
