FROM node:20-alpine as builder

WORKDIR /app

COPY package.json yarn.lock ./

COPY apps/backend/package.json ./apps/backend/

RUN yarn install --frozen-lockfile

COPY apps/backend ./apps/backend

RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

COPY apps/backend/package.json ./apps/backend/

RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 9000
CMD yarn db:migrate && yarn start
