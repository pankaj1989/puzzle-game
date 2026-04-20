const env = require('./config/env');
const { connect } = require('./config/db');
const { createApp } = require('./app');

async function start() {
  await connect();
  const app = createApp();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on :${env.PORT}`);
  });
}

start().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
