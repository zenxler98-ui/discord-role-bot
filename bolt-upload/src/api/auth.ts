import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUser, destroyUserSession } from '../services/sessionService';
import { roleService } from '../services/roleService';

const router = Router();

/**
 * GET /api/auth/status
 * Get current authentication status and user info
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    res.json({
      authenticated: true,
      user: {
        id: user.userId,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[AuthAPI] Error getting auth status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout the user and destroy session
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    await destroyUserSession(req);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[AuthAPI] Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
