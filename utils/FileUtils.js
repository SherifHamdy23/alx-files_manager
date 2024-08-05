import { ObjectId } from 'mongodb';
import { DBClient } from './db';

async function isFolder(parentId) {
  const { db } = await DBClient.getInstance();
  const files = db.collection('files');

  if (parentId === 0 || parentId === '0') return true;
  const folder = files.findOne({
    _id: new ObjectId(parentId),
    type: 'folder',
  });
  if (!folder) return false;
  return true;
}

export default isFolder;
