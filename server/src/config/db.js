const mongoose = require("mongoose");

const globalConnection = global.__mongooseConnection || {
  conn: null,
  promise: null
};

global.__mongooseConnection = globalConnection;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  if (globalConnection.conn) {
    return globalConnection.conn;
  }

  if (!globalConnection.promise) {
    globalConnection.promise = mongoose.connect(mongoUri).then((mongooseInstance) => {
      console.log("MongoDB connected");
      return mongooseInstance;
    });
  }

  globalConnection.conn = await globalConnection.promise;
  return globalConnection.conn;
};

module.exports = connectDB;
