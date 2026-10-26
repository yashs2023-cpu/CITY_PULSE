// PM2 ecosystem file — run with:  pm2 start ecosystem.config.js
// Keeps both servers alive on crash and across reboots (pm2 startup + pm2 save).
// Logs go to the repo's logs/ folder (persistent on non-ephemeral disks).
'use strict';
module.exports = {
  apps: [
    {
      name: 'citypulse-main',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
        // TOMTOM_API_KEY must be in .env or exported in the shell environment
      },
      out_file: 'logs/pm2-main-out.log',
      error_file: 'logs/pm2-main-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'citypulse-admin',
      script: 'admin/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 4000
        // ADMIN_USER / ADMIN_PASSWORD must be in .env or shell environment
      },
      out_file: 'logs/pm2-admin-out.log',
      error_file: 'logs/pm2-admin-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
