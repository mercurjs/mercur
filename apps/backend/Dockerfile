FROM node:20
 
WORKDIR /app
 
COPY package.json ./
COPY yarn.lock ./
 
COPY apps/backend/package.json ./apps/backend/package.json
 
RUN yarn install
 
COPY . .
 
EXPOSE 8080

WORKDIR /app/apps/backend
 
RUN yarn build

RUN yarn db:migrate

CMD [ "yarn", "start" ]