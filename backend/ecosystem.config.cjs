// PM2 process definition (only needed for a self-managed VPS deployment —
// Hostinger's managed Node.js App hosting runs the entry file itself and
// does not need PM2). Run from the backend/ directory:
//   npm run build
//   pm2 start ecosystem.config.cjs --env production
//
// .cjs extension is required so PM2 (which loads config files with
// require()) always reads this as CommonJS, independent of whatever the
// backend's own package.json "type" is set to.
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      // Runs the compiled output directly with plain node — same as
      // `npm start` (see package.json). Run `npm run build` first so
      // dist/index.js exists.
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      // Matches `pm2 start ecosystem.config.cjs --env production`.
      env_production: {
        NODE_ENV: 'production',
      },
      // stdout/stderr land here instead of PM2's default location, so
      // they sit next to the app and are easy to find/rotate.
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
