import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import issuesRouter from './routes/issues';
import warrantyRouter from './routes/warranty';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import contractorsRouter from './routes/contractors';
import { env } from './config/env';
import { store } from './db/json-store';
import { testPinataConnection } from './services/ipfs.service';
import { toHttpError } from './utils/http-error';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  })
);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(env.uploadsDir));

// Skip JSON parsing for multipart upload routes so Busboy can parse the raw stream.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/upload')) return next();
  express.json({ limit: '1mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  const db = store.read();

  res.json({
    status: 'ok',
    service: 'CityPramaan backend',
    users: db.users.length,
    issues: db.issues.length,
    contractors: db.contractors.length,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/warranty', warrantyRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/contractors', contractorsRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const httpError = toHttpError(error);
  res.status(httpError.status).json({
    success: false,
    error: httpError.message,
    code: httpError.code,
  });
});

if (require.main === module) {
  testPinataConnection();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}
