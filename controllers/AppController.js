import { DBClient } from '../utils/db';
import redisClient from '../utils/redis';

async function getStatus(req, res) {
  const { instance: dbclient } = await DBClient.getInstance();
  res.status(200).send({ redis: redisClient.isAlive(), db: dbclient.isAlive() });
}

async function getStats(req, res) {
  const { instance: dbclient } = await DBClient.getInstance();
  let countUsers = 0;
  let countFiles = 0;
  if (dbclient.isAlive()) {
    countUsers = await dbclient.nbUsers();
    countFiles = await dbclient.nbFiles();
  }

  res.status(200).send({ users: countUsers, files: countFiles });
}
const AppController = {
  getStatus,
  getStats,
};

export default AppController;
