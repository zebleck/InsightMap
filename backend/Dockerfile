FROM node:latest

WORKDIR /app

COPY . .

RUN npm install -g nodemon
RUN npm install

CMD ["nodemon", "index.js"]
