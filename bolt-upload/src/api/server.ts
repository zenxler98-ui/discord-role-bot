import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUser } from '../services/sessionService';
import { roleService } from '../services/roleService';
import { discordService } from '../services/discordService';
import { config } from '../config/env';

const router = Router();

/**
 * GET /api/server/status
 * Get server and role status for authenticated user
 */
router.get('/status', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get role status for user
    const roleStatus = await roleService.getRoleStatus(user.userId);

    res.json({
      authenticated: true,
      userId: user.userId,
      isMember: roleStatus.isMember,
      hasRole: roleStatus.hasRole,
      status: roleStatus.status,
      server: roleStatus.server,
    });
  } catch (error) {
    console.error('[ServerAPI] Error getting server status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/server/claim-role
 * Claim role if not already assigned
 */
router.post('/claim-role', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check and assign role
    const result = await roleService.checkAndAssignRole(user.userId);

    res.json({
      success: result.status === 'ROLE_ASSIGNED' || result.status === 'ALREADY_HAS_ROLE',
      status: result.status,
      isMember: result.isMember,
      hasRole: result.hasRole,
      roleAssigned: result.roleAssigned,
      server: result.server,
    });
  } catch (error) {
    console.error('[ServerAPI] Error claiming role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/server/info
 * Get server information without authentication
 */
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  try {
    const guildId = config.discord.guildId;

    const guild = await discordService.getGuild(guildId);

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      inviteUrl: config.discord.inviteUrl,
    });
  } catch (error) {
    console.error('[ServerAPI] Error getting server info:', error);
    res.status(500).json({ error: 'Failed to get server info' });
  }
});

export default router;
