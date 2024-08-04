import express from 'express';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(routes);

app.listen(5000, () => {
  console.log('App listening in port 5000');
});

export default app;
