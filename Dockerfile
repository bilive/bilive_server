FROM node:12

WORKDIR /srv/bilive_client
COPY . /srv/bilive_client
RUN npm install && npm run build

EXPOSE 20080/tcp
CMD [ "npm", "start" ]
