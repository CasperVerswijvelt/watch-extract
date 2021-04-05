FROM node:15

# Create app directory
WORKDIR /usr/src/app

ENV EXTRACT_FOLDER=extracted
ENV WATCH_PATH=.

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD ["sh", "-c", "node index.js --path ${WATCH_PATH} --extractFolder ${EXTRACT_FOLDER}"]