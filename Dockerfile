FROM node:18.20.4-alpine3.20 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:18.20.4-alpine3.20
WORKDIR /app
COPY --from=builder /app/node_modules /node_modules
ADD /scripts/start.sh /start.sh
RUN chmod +x /start.sh
COPY . .

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/start.sh" ]