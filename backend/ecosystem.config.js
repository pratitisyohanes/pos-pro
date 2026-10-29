// PM2 process file used on the VPS: keeps the POS API running next to booking-api
module.exports = {
  apps: [
    {
      name: 'pos-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      // Lower than booking-api (300M) because both share a 1 GB VPS
      max_memory_restart: '250M',
      time: true,
    },
  ],
};
