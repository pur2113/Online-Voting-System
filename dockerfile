FROM node:10

# Create app directory
WORKDIR /usr/app
COPY . /usr/app/

RUN npm install

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 3000
CMD [ "node", "src/server.js" ]