import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import issuesRouter from './routes/issues';
import warrantyRouter from './routes/warranty';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'CityPramaan backend running!' });
});

app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/warranty', warrantyRouter);

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});