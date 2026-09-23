import crypto from 'crypto';

/**
 * Generate a cryptographically secure random state for OAuth2
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a cryptographically secure random session secret
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate if a redirect URL is safe (matches allowed origin)
 */
export function isValidRedirectUrl(url: string, allowedOrigin: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const parsedOrigin = new URL(allowedOrigin);

    return (
      parsedUrl.protocol === parsedOrigin.protocol &&
      parsedUrl.hostname === parsedOrigin.hostname &&
      parsedUrl.port === parsedOrigin.port
    );
  } catch {
    return false;
  }
}

/**
 * Validate input to prevent injection attacks
 */
export function validateInput(input: unknown, type: 'string' | 'number' = 'string'): boolean {
  if (type === 'string') {
    return typeof input === 'string' && input.length > 0 && input.length < 1000;
  }
  if (type === 'number') {
    return typeof input === 'number' && input > 0;
  }
  return false;
}

/**
 * Hash a value for comparison (simple hash, not for passwords)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
