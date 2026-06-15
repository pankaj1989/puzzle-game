const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let connected = false;
let mongod;

function registerHooks() {
  beforeAll(async () => {
    if (!connected) {
      mongod = await MongoMemoryServer.create();
      process.env.MONGODB_URI = mongod.getUri();
      mongoose.set('strictQuery', true);
      await mongoose.connect(process.env.MONGODB_URI);
      connected = true;
    }
  }, 120000);

  beforeEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(
      Object.values(collections).map((c) => c.deleteMany({}))
    );
  });

  afterAll(async () => {
    if (connected) {
      await mongoose.disconnect();
      if (mongod) await mongod.stop();
      connected = false;
    }
  });
}

module.exports = { registerHooks };
