import { createHash } from 'crypto';
import { DBClient } from '../utils/db';

function hashPassword(value) {
  const hash = createHash('sha1');
  hash.update(value);
  return hash.digest('hex');
}

async function postNew(req, res) {
  const data = req.body;

  // ensure mongo is connected
  const { db } = await DBClient.getInstance();
  if (!data.email) { return res.status(400).send({ error: 'Missing email' }); }
  if (!data.password) { return res.status(400).send({ error: 'Missing password' }); }
  const user = await db.collection('users').findOne({ email: data.email });
  if (user) {
    return res.status(400).send({ error: 'Already exist' });
  }
  const users = db.collection('users');
  const newUser = await users.insertOne({
    email: data.email,
    password: hashPassword(data.password),
  });
  return res.status(201).send({
    email: data.email,
    id: newUser.insertedId,
  });
}

const UsersController = {
  postNew,
};

export default UsersController;
