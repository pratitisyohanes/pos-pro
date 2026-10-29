FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .sequelizerc ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 5001

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]
