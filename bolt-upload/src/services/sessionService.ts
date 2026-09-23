import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { config } from '../config/env';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    avatar?: string;
    oauthState?: string;
  }
}

/**
 * Create session middleware
 */
export function createSessionMiddleware(): any {
  return session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.server.nodeEnv === 'production', // Requires HTTPS in production
      httpOnly: true, // Prevents JavaScript access
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
}

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

/**
 * Store OAuth state in session
 */
export function storeOAuthState(req: Request, state: string): void {
  req.session.oauthState = state;
  req.session.save((err) => {
    if (err) {
      console.error('[SessionService] Failed to save OAuth state to session:', err);
    }
  });
}

/**
 * Verify and clear OAuth state from session
 */
export function verifyAndClearOAuthState(req: Request, incomingState: string): boolean {
  const storedState = req.session.oauthState;
  delete req.session.oauthState;
  req.session.save();

  return storedState === incomingState && storedState !== undefined;
}

/**
 * Store user session
 */
export function storeUserSession(
  req: Request,
  userId: string,
  username: string,
  avatar: string
): void {
  req.session.userId = userId;
  req.session.username = username;
  req.session.avatar = avatar;
  req.session.save((err) => {
    if (err) {
      console.error('[SessionService] Failed to save user session:', err);
    }
  });
}

/**
 * Destroy user session (logout)
 */
export function destroyUserSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('[SessionService] Failed to destroy session:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get current user from session
 */
export function getCurrentUser(req: Request): { userId: string; username: string; avatar: string } | null {
  if (req.session.userId) {
    return {
      userId: req.session.userId,
      username: req.session.username || 'Unknown',
      avatar: req.session.avatar || '',
    };
  }
  return null;
}
