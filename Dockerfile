FROM node:18.20.4

WORKDIR /app

COPY package*.json ./

RUN npm install

ADD /scripts/start.sh /start.sh

RUN chmod +x /start.sh

COPY /supervisor  .

RUN node train.js

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/start.sh" ]