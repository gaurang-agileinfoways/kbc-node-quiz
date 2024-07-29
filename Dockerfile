FROM node:current
WORKDIR /usr/src/app/

COPY quiz/package*.json /usr/src/app/

RUN npm install

COPY quiz/. .

RUN npm run build

CMD ["npm", "run", "start"]