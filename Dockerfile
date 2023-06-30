# base image
FROM devops-registry.ekenya.co.ke/tra-project/customer-portal-builder as builder

# install chrome for protractor tests
#RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
#RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
#RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
# ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
# COPY package.json /app/package.json
# RUN npm install
# RUN npm install @angular/cli@14.2.10

# add app
COPY . /app

# EXPOSE 8000

# run tests
#RUN ng test --watch=false
#RUN ng e2e --port 4202

# generate build
# RUN ng build --prod --output-path=dist
# RUN ng build --configuration production --output-path=dist
RUN ng build --configuration production --base-href /tra-customer-portal/ --deploy-url /tra-customer-portal/
# RUN ng build --prod


############
### prod ###
############

# base image
FROM nginx:1.17.1-alpine
# Replace default nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# copy artifact build from the 'build environment'
COPY --from=builder /app/dist /usr/share/nginx/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]

