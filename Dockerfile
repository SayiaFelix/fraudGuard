# base image
FROM devops-registry.ekenya.co.ke/tra-project/customer-portal-builder as build
# WORKDIR /app
# COPY . .
# RUN ng build

# ## Create nginx image
# FROM nginx:1.17.1-alpine
# COPY default.conf /etc/nginx/conf.d/
# COPY --from=builder /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD [ "nginx", "-g", "daemon off;" ]

# set working directory
WORKDIR /app
# add app
COPY . /app
RUN ng build

# # base image
FROM nginx:1.17.1-alpine
# Replace default nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# copy artifact build from the 'build environment'
COPY --from=build /app/dist /usr/share/nginx/html
# expose port 80
EXPOSE 80
# run nginx
CMD ["nginx", "-g", "daemon off;"]


