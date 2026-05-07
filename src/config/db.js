const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  const connection = await mongoose.connect(env.mongoUri);
  const { host, name } = connection.connection;
  console.log(`MongoDB conectado em ${host}/${name} (source=${env.mongoUriSource})`);
}

module.exports = connectDb;
