// PM2 process definition. Run from the backend/ directory:
//   pm2 start ecosystem.config.cjs --env production
//
// .cjs extension is required: the backend's package.json sets
// "type": "module", and PM2 loads config files with require(), which
// can't load an ES module — .cjs is unambiguous CommonJS regardless of
// that setting (same reasoning as database.cjs for sequelize-cli).
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      // Runs the local tsx binary directly against the TS entrypoint —
      // same execution path as `npm start` (see package.json), so
      // dev/prod behavior stays identical. No separate compile step.
      script: 'node_modules/.bin/tsx',
      args: 'src/index.ts',
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
