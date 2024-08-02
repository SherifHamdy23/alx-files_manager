import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function getStatus(req, res) {
  res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
}

async function getStats(req, res) {
  let countUsers = 0;
  let countFiles = 0;
  if (dbClient.isAlive()) {
    countUsers = await dbClient.nbUsers();
    countFiles = await dbClient.nbFiles();
  }

  res.status(200).send({ users: countUsers, files: countFiles });
}
const AppController = {
  getStatus,
  getStats,
};

export default AppController;
