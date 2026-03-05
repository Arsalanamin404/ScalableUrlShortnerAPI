FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma client (--config   Custom path to Prisma config file)
RUN npx prisma generate --config prisma.config.ts

RUN npm run build

EXPOSE 4000

# Apply migrations then start app
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.ts && node dist/src/main.js"]