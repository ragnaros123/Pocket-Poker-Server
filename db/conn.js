const { MongoClient } = require("mongodb");

const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString);

let dbConnection;

module.exports = {
  connectToServer: function (callback) {
    client.connect(function (err, db) {
      if (err || !db) {
        return callback(err);
      }
      console.log("Successfully connected to MongoDB.");
      return callback();
    });
  },

  getDb: function () {
    return dbConnection;
  },
};
