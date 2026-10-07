import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { createEngine } from './engine/index.js';
import { buildPrismaRepositories } from './repositories/prisma/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();
  const repositories = buildPrismaRepositories();
  const engine = createEngine({ repositories });

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  app.locals.engine = engine;

  app.use('/api/v1/heartly', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
