FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001
ENV MONGO_URI=mongodb://mongo-user:27017/user-db
ENV JWT_SECRET=your_jwt_secret_key_change_me_in_production

EXPOSE 3001

CMD ["node", "dist/main"] 
