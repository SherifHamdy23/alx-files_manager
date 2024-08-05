import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getStatus(req, res) {
  if (dbClient.isAlive() === false) {
    await dbClient.connect();
  }
  res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
}

async function getStats(req, res) {
  if (dbClient.isAlive() === false) {
    await dbClient.connect();
  }
  Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
    .then(([usersCount, filesCount]) => {
      res.status(200).json({ users: usersCount, files: filesCount });
    });
}
const AppController = {
  getStatus,
  getStats,
};

export default AppController;
