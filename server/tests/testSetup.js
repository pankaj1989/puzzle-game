const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.__MONGOD_URI__ || process.env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

function registerHooks() {
  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(disconnectDB);
}

module.exports = { connectDB, clearDB, disconnectDB, registerHooks };
