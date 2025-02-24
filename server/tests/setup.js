const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = {
  setUp: async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  },

  dropDatabase: async () => {
    if (mongod) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await mongod.stop();
    }
  },

  dropCollections: async () => {
    if (mongod) {
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany();
      }
    }
  }
};