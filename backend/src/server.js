const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

// Verify the database connection before accepting requests
const start = async () => {
  await sequelize.authenticate();
  const server = app.listen(env.PORT, () => {
    console.log(`POS API running on http://localhost:${env.PORT}`);
    console.log(`Swagger docs on http://localhost:${env.PORT}/api/docs`);
    console.log(`Booking API expected at ${env.BOOKING_API_URL}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await sequelize.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch(async (err) => {
  console.error('Failed to start server:', err.message);
  await sequelize.close();
  process.exit(1);
});
