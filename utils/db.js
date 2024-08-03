import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const {
    MONGO_URI: uri,
    DB_HOST: dbHost = 'localhost',
    DB_PORT: dbPort = 27017,
    DB_DATABASE: dbName = 'files_manager'
} = dotenv.config().parsed;

class DBClient {
    constructor() {
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        this.connected = false;
        DBClient.client = this.client;
    }

    static async getInstance() {
        if (!DBClient.instance) {
            DBClient.instance = new DBClient();
            const client = DBClient.instance.client;
            await client.connect();
        }
        const db = DBClient.instance.client.db(dbName);
        return {
            instance: DBClient.instance,
            db: db
        }
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
        const count =  await this.db.collection('users').countDocuments();
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
    DBClient
};