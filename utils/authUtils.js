import { createHash } from 'crypto';
import { Buffer } from 'buffer';

export function hashPassword(value) {
  const hash = createHash('sha1');
  hash.update(value);
  return hash.digest('hex');
}

export function decodeBase64(base64String) {
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
