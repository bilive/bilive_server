FROM node:14-alpine

WORKDIR /app
COPY . /app
RUN mkdir /app/options && cp /app/nedb/roomList.db /app/options/roomList.db && npm install && npm run build

EXPOSE 20080
CMD ["npm", "start"]
