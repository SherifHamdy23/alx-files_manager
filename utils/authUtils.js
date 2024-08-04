import { createHash } from 'crypto';
import { Buffer } from 'buffer';
import { DBClient } from '../utils/db';
import redisClient from './redis';
import { ObjectId } from 'mongodb';


export function hashPassword(value) {
  const hash = createHash('sha1');
  hash.update(value);
  return hash.digest('hex');
}

export function decodeBase64(base64String) {
  if (!base64String)
    return '';
  const decoded = Buffer.from(base64String, 'base64').toString();
  return decoded;
}

export function decodeBasicToken(header) {
  const token = header.split(' ');
  const secondPart = token[1];
  const credentials = decodeBase64(secondPart);
  return credentials.split(':', 2);
}

export function generateAuthKey(token) {
  return `auth_${token}`;
}

export async function getUserByToken(token) {
  const userId = await redisClient.get(generateAuthKey(token));
  if (!userId)
    return null
  const { db } = await DBClient.getInstance();
  const user = await db.collection('users').findOne({
    _id: new ObjectId(userId)
  });
  return user;
}

export function Unauthorized(res) {
  res.status(401).send({error: "Unauthorized"});
}

export function Missing(res, thing) {
  res.status(400).send({error: `Missing ${thing}`});
}