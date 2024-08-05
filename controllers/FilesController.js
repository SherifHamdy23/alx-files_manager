import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { getUserByToken, Missing, Unauthorized } from '../utils/authUtils';
import { DBClient } from '../utils/db';

const {
  FOLDER_PATH = '/tmp/files_manager',
} = process.env;

async function storeData(filePath, data) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    const decodedBase64 = Buffer.from(data, 'base64');
    // Write the data to the file
    await fs.promises.writeFile(filePath, decodedBase64);
    return true;
  } catch (error) {
    return false;
  }
}

async function postUpload(req, res) {
  // Get Token and use db instance from DBclient
  const token = req.headers['x-token'];
  const { db } = await DBClient.getInstance();

  // check of the given token have a valid user Id
  if (token) {
    const user = await getUserByToken(token);
    if (!user) return Unauthorized(res);

    // get the data of the request from request body
    const {
      name,
      type,
      data,
      parentId = 0,
      isPublic = false,
    } = req.body;

    // handle if there's a missing field
    if (!name) return Missing(res, 'name');
    if (!type) return Missing(res, 'type');
    if (!data && type !== 'folder') return Missing(res, 'data');

    // if the parent is not the root, i need to check if parent exist
    // and if exist check type of the document
    if (parentId !== 0) {
      let document = null;
      try {
        document = await db.collection('files').findOne({
          _id: new ObjectId(parentId),
        });
      } catch (err) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (document) {
        if (document.type !== 'folder') {
          return res.status(400).send({ error: 'Parent is not a folder' });
        }
      } else {
        return res.status(400).send({ error: 'Parent not found' });
      }
    }

    // prepare data to be stored in the database
    const userId = user._id;
    const fileData = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };
    // storing the document in the database
    const filePath = `${FOLDER_PATH}/${uuidv4()}`;
    const { insertedId: fileId } = await db.collection('files').insertOne({ ...fileData, localPath: filePath });

    // storing the data of the file in local disk
    if (type !== 'folder') {
      if (!storeData(filePath, data)) {
        return res.status(400).send({ error: 'Something Wrong with Storing the file' });
      }
    }
    res.status(201).send({ id: fileId, ...fileData });
  } else return Unauthorized(res);
  return null;
}

async function getShow(request, response) {
  const user = await getUserByToken(request.headers['x-token']);
  const dbClient = await DBClient.getInstance();
  if (!user) {
    return response.status(401).json({ error: 'Unauthorized' });
  }
  const fileId = request.params.id;
  const files = dbClient.db.collection('files');
  const idObject = new ObjectId(fileId);
  const file = await files.findOne({ _id: idObject, userId: user._id });
  if (!file) {
    return response.status(404).json({ error: 'Not found' });
  }
  delete file._id;
  delete file.localPath;
  return response.status(200).json({ id: fileId, ...file });
}

async function getIndex(request, response) {
  const dbClient = await DBClient.getInstance();
  const user = await getUserByToken(request.headers['x-token']);
  if (!user) {
    return response.status(401).json({ error: 'Unauthorized' });
  }
  const {
    parentId,
    page,
  } = request.query;
  const pageNum = page || 0;
  const files = dbClient.db.collection('files');
  let query;
  if (!parentId) {
    query = { userId: user._id };
  } else {
    query = { userId: user._id, parentId: ObjectId(parentId) };
  }
  files.aggregate(
    [
      { $match: query },
      { $skip: 20 * parseInt(pageNum, 10) },
      { $limit: 20 },
    ],
  ).toArray((err, result) => {
    if (result) {
      const final = result.map((file) => {
        const tmpFile = {
          id: file._id,
          ...file,
        };
        delete tmpFile._id;
        delete tmpFile.localPath;
        return tmpFile;
      });
      return response.status(200).json(final);
    }
    console.log('Error occured');
    return response.status(404).json({ error: 'Not found' });
  });
  return null;
}

async function putPublish(request, response) {
  const user = await getUserByToken(request.headers['x-token']);
  if (!user) return Unauthorized(response);

  const { db } = await DBClient.getInstance();
  const filesCollection = await db.collection('files');

  const { value: file } = await filesCollection.findOneAndUpdate({
    userId: user._id,
    _id: new ObjectId(request.params.id),
  },
  { $set: { isPublic: true } },
  { returnDocument: 'after' });

  if (!file) {
    return response.status(404).send({ error: 'Not found' });
  }
  return response.status(200).send({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
}

async function putUnpublish(request, response) {
  const user = await getUserByToken(request.headers['x-token']);
  if (!user) return Unauthorized(response);

  const { db } = await DBClient.getInstance();
  const filesCollection = await db.collection('files');

  const { value: file } = await filesCollection.findOneAndUpdate({
    userId: user._id,
    _id: new ObjectId(request.params.id),
  },
  { $set: { isPublic: false } },
  { returnDocument: 'after' });

  if (!file) {
    return response.status(404).send({ error: 'Not found' });
  }
  return response.status(200).send({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
}

const FilesController = {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
};

export default FilesController;
