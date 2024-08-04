import { MongoClient } from 'mongodb';

const {
  DB_HOST: dbHost = 'localhost',
  DB_PORT: dbPort = 27017,
  DB_DATABASE: dbName = 'files_manager',
} = process.env;

const uri = `mongodb://${dbHost}:${dbPort}/${dbName}`;
class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.connected = false;
    DBClient.client = this.client;
  }

  static async getInstance() {
    if (!DBClient.instance) {
      DBClient.instance = new DBClient();
      const { client } = DBClient.instance;
      await client.connect();
    }
    const db = DBClient.instance.client.db(dbName);
    return {
      instance: DBClient.instance,
      db,
    };
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
    const count = await this.db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    const count = await this.db.collection('files').countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
(async () => {
  await dbClient.connect();
})();

export default dbClient;
export {
  DBClient,
};
