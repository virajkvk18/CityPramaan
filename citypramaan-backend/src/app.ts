import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import issuesRouter from './routes/issues';
import warrantyRouter from './routes/warranty';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import { testPinataConnection } from './services/ipfs.service';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Skip express.json() for multipart upload routes so multer can parse them
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/upload')) return next();
  express.json()(req, res, next);
});

app.get('/health', (req, res) => {
  res.json({ status: 'CityPramaan backend running!' });
});

app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/warranty', warrantyRouter);
app.use('/api/upload', uploadRouter);

testPinataConnection();

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});