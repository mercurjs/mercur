FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 9000

RUN yarn build
RUN yarn db:migrate

CMD ["yarn", "start"]
