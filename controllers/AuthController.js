import { v4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { DBClient } from '../utils/db';
import redisClient from '../utils/redis';
import { decodeBasicToken, hashPassword, generateAuthKey } from '../utils/authUtils';

const uuidv4 = v4;

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;
  const { db } = await DBClient.getInstance();
  if (authHeader) {
    const [email, password] = decodeBasicToken(authHeader);
    if (!email || !password) { return res.status(401).send({ error: 'Unauthorized' }); }
    const user = await db.collection('users').findOne({ email });
    if (user && user.password === hashPassword(password)) {
      const token = uuidv4();
      const authKey = generateAuthKey(token);
      redisClient.set(authKey, user._id.toString(), 24 * 60 * 60);
      return res.send({
        token,
      });
    } return res.status(401).send({ error: 'Unauthorized' });
  }
  return res.status(401).send({ error: 'Unauthorized' });
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) { return res.status(401).send({ error: 'Unauthorized' }); }

  const { db } = await DBClient.getInstance();
  const user = await db.collection('users').findOne({
    _id: new ObjectId(userId),
  });
  if (!user) { return res.status(401).send({ error: 'Unauthorized' }); }

  await redisClient.del(`auth_${token}`);
  return res.status(204).send();
}

async function getMe(req, res) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) { return res.status(401).send({ error: 'Unauthorized' }); }

  const { db } = await DBClient.getInstance();
  const user = await db.collection('users').findOne({
    _id: new ObjectId(userId),
  });
  if (!user) { return res.status(401).send({ error: 'Unauthorized' }); }
  return res.send({
    id: userId,
    email: user.email,
  });
}

const AuthController = {
  getConnect,
  getDisconnect,
  getMe,
};

export default AuthController;
