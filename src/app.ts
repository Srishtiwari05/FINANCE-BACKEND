import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { connectDB } from './config/db';
import { env } from './config/env';
import router from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ─── API Docs ─────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Finance API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Not Found & Error Handlers ──────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`🚀 Server running at http://localhost:${env.port}`);
    console.log(`📖 API Docs at http://localhost:${env.port}/api/docs`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
  });
};

if (env.nodeEnv !== 'test') {
  startServer();
}

export { app, startServer };
