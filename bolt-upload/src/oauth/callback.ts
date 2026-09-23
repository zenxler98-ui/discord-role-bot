import { Request, Response } from 'express';
import { config } from '../config/env';
import { generateOAuthState, isValidRedirectUrl, validateInput } from '../utils/security';
import { storeOAuthState, verifyAndClearOAuthState, storeUserSession } from '../services/sessionService';
import { discordService, DiscordUser } from '../services/discordService';
import { roleService } from '../services/roleService';

/**
 * Generate Discord OAuth2 authorization URL
 */
export function generateDiscordOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.oauth.redirectUri,
    response_type: 'code',
    scope: 'identify', // Only request identify scope
    state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Handle OAuth2 authorization initiation
 */
export async function initiateOAuth(req: Request, res: Response): Promise<void> {
  try {
    const state = generateOAuthState();
    storeOAuthState(req, state);

    const authUrl = generateDiscordOAuthUrl(state);
    console.log(`[OAuth] OAuth flow initiated for session with state: ${state.substring(0, 8)}...`);

    res.json({ authUrl });
  } catch (error) {
    console.error('[OAuth] Failed to initiate OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
}

/**
 * Handle OAuth2 callback
 */
export async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state } = req.query;

    // Step 1: Validate input
    if (!validateInput(code, 'string') || !validateInput(state, 'string')) {
      console.warn('[OAuth] Invalid OAuth parameters received');
      const redirectUrl = new URL(config.web.url);
      redirectUrl.searchParams.set('error', 'OAUTH_INVALID_PARAMS');
      res.redirect(redirectUrl.toString());
      return;
    }

    // Step 2: Verify state parameter (CSRF protection)
    if (!verifyAndClearOAuthState(req, state as string)) {
      console.warn('[OAuth] OAuth state validation failed');
      const redirectUrl = new URL(config.web.url);
      redirectUrl.searchParams.set('error', 'OAUTH_STATE_INVALID');
      res.redirect(redirectUrl.toString());
      return;
    }

    console.log(`[OAuth] OAuth callback received with valid state`);

    // Step 3: Exchange code for access token
    let accessToken: string;
    try {
      const tokenData = await discordService.exchangeCodeForToken(code as string);
      accessToken = tokenData.access_token;
      console.log(`[OAuth] Successfully exchanged code for access token`);
    } catch (error) {
      console.error('[OAuth] Failed to exchange code:', error);
      const redirectUrl = new URL(config.web.url);
      redirectUrl.searchParams.set('error', 'OAUTH_CODE_INVALID');
      res.redirect(redirectUrl.toString());
      return;
    }

    // Step 4: Get user info
    let discordUser: DiscordUser;
    try {
      discordUser = await discordService.getCurrentUser(accessToken);
      console.log(`[OAuth] Retrieved Discord user: ${discordUser.username} (${discordUser.id})`);
    } catch (error) {
      console.error('[OAuth] Failed to get user info:', error);
      const redirectUrl = new URL(config.web.url);
      redirectUrl.searchParams.set('error', 'DISCORD_API_ERROR');
      res.redirect(redirectUrl.toString());
      return;
    }

    // Step 5: Check and assign role
    const roleResult = await roleService.checkAndAssignRole(discordUser.id);

    // Step 6: Store user session
    storeUserSession(req, discordUser.id, discordUser.username, discordUser.avatar || '');
    console.log(`[OAuth] User session created for ${discordUser.username}`);

    // Step 7: Redirect with status
    const redirectUrl = new URL(config.web.url);

    if (roleResult.status === 'ROLE_ASSIGNED') {
      redirectUrl.searchParams.set('status', 'success');
      console.log(`[OAuth] OAuth flow completed successfully - role assigned`);
    } else if (roleResult.status === 'ALREADY_HAS_ROLE') {
      redirectUrl.searchParams.set('status', 'already_has_role');
      console.log(`[OAuth] OAuth flow completed - user already has role`);
    } else if (roleResult.status === 'NOT_MEMBER') {
      redirectUrl.searchParams.set('status', 'not_member');
      console.log(`[OAuth] OAuth flow completed - user is not a guild member`);
    } else {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('error', roleResult.status);
      console.log(`[OAuth] OAuth flow completed with error: ${roleResult.status}`);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[OAuth] Unexpected error in OAuth callback:', error);
    const redirectUrl = new URL(config.web.url);
    redirectUrl.searchParams.set('error', 'INTERNAL_ERROR');
    res.redirect(redirectUrl.toString());
  }
}
