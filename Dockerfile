# base image
# FROM devops-registry.ekenya.co.ke/tra-project/customer-portal-builder as builder
# WORKDIR /app
# COPY . .
# RUN ng build --configuration production --base-href /tra-customer-portal/ --deploy-url /tra-customer-portal/
## Create nginx image
FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/
COPY dist/ /usr/share/nginx/html
EXPOSE 80
CMD sed -i s#CUSTOMER_API_URL#$CUSTOMER_API_URL#g /usr/share/nginx/html/main.*.js && sed -i s#STANDARDS_API_URL#$STANDARDS_API_URL#g /usr/share/nginx/html/main.*.js && nginx -g 'daemon off;'
