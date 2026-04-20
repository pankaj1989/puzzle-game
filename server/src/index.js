const env = require('./config/env');
const { connect, disconnect } = require('./config/db');
const { createApp } = require('./app');

let server;

async function start() {
  await connect();
  const app = createApp();
  server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on :${env.PORT}`);
  });
}

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully`);
  const timeout = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Forcefully exiting after shutdown timeout');
    process.exit(1);
  }, 10_000);
  try {
    if (server) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    await disconnect();
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error during shutdown', err);
    clearTimeout(timeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
