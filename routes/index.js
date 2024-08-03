import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController'

const routes = express.Router();

routes.get('/status', AppController.getStatus);
routes.get('/stats', AppController.getStats);

routes.post('/users', UsersController.postNew);
export default routes;
