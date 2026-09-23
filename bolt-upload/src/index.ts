import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { createSessionMiddleware } from './services/sessionService';
import authRoutes from './routes/auth';
import authAPIRoutes from './api/auth';
import serverAPIRoutes from './api/server';
import { initializeBot, shutdownBot } from './bot/client';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.web.url,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(createSessionMiddleware());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: false,
});

app.use(limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    bot: true,
    timestamp: new Date().toISOString(),
  });
});

// OAuth routes (with rate limiting)
app.use('/auth', authLimiter, authRoutes);

// API routes
app.use('/api/auth', authAPIRoutes);
app.use('/api/server', serverAPIRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('[Server] Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('🚀 Starting Discord Role Bot Server');
    console.log('═══════════════════════════════════════════════\n');

    // Initialize bot
    await initializeBot();

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      console.log(`\n✅ [Server] HTTP Server listening on port ${config.server.port}`);
      console.log(`   Environment: ${config.server.nodeEnv}`);
      console.log(`   Web URL: ${config.web.url}`);
      console.log(`   OAuth Redirect: ${config.oauth.redirectUri}`);
      console.log('\n═══════════════════════════════════════════════');
      console.log('✅ All systems ready!');
      console.log('═══════════════════════════════════════════════\n');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n\n📍 Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await shutdownBot();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('\n❌ [Server] Failed to start:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
