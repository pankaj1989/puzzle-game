const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = mongod.getUri();
  process.env.__MONGOD_URI__ = mongod.getUri();
};
