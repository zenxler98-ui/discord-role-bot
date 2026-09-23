import { Router, Request, Response } from 'express';
import { initiateOAuth, handleOAuthCallback } from '../oauth/callback';

const router = Router();

/**
 * GET /auth/discord
 * Initiate Discord OAuth2 flow
 */
router.get('/discord', async (req: Request, res: Response): Promise<void> => {
  await initiateOAuth(req, res);
});

/**
 * GET /auth/discord/callback
 * Handle Discord OAuth2 callback
 */
router.get('/discord/callback', async (req: Request, res: Response): Promise<void> => {
  await handleOAuthCallback(req, res);
});

export default router;
