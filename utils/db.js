import { MongoClient } from 'mongodb';

const {
  DB_HOST: dbHost = 'localhost',
  DB_PORT: dbPort = 27017,
  DB_DATABASE: dbName = 'files_manager',
} = process.env;

const url = `mongodb://${dbHost}:${dbPort}/${dbName}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.connected = false;
  }

  async connect() {
    await this.client.connect();
    this.connected = true;
    this.db = this.client.db(dbName);
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return await this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return await this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
(async () => {
  await dbClient.connect();
})();

export default dbClient;
