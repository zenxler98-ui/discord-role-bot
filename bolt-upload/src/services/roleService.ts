import { discordService } from './discordService';
import { config } from '../config/env';

export type RoleStatus =
  | 'NOT_CONNECTED'
  | 'NOT_MEMBER'
  | 'ALREADY_HAS_ROLE'
  | 'ROLE_ASSIGNED'
  | 'BOT_PERMISSION_ERROR'
  | 'ROLE_HIERARCHY_ERROR'
  | 'DISCORD_API_ERROR'
  | 'INTERNAL_ERROR';

export interface RoleCheckResult {
  status: RoleStatus;
  isMember: boolean;
  hasRole: boolean;
  roleAssigned: boolean;
  server?: {
    id: string;
    name: string;
    icon: string | null;
    inviteUrl: string;
  };
}

export class RoleService {
  /**
   * Check and assign role to user
   */
  async checkAndAssignRole(userId: string): Promise<RoleCheckResult> {
    try {
      const guildId = config.discord.guildId;
      const roleId = config.discord.roleId;

      // Step 1: Check if user is member of guild
      const isMember = await discordService.checkGuildMembership(userId, guildId);

      if (!isMember) {
        console.log(`[RoleService] User ${userId} is not a member of guild ${guildId}`);
        return {
          status: 'NOT_MEMBER',
          isMember: false,
          hasRole: false,
          roleAssigned: false,
          server: {
            id: guildId,
            name: config.discord.inviteUrl, // Fallback to invite URL
            icon: null,
            inviteUrl: config.discord.inviteUrl,
          },
        };
      }

      // Step 2: Get user's current roles
      const userRoles = await discordService.getUserRoles(userId, guildId);
      const hasRole = userRoles.includes(roleId);

      if (hasRole) {
        console.log(`[RoleService] User ${userId} already has role ${roleId}`);

        // Get guild info for response
        const guild = await discordService.getGuild(guildId);

        return {
          status: 'ALREADY_HAS_ROLE',
          isMember: true,
          hasRole: true,
          roleAssigned: false,
          server: {
            id: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            inviteUrl: config.discord.inviteUrl,
          },
        };
      }

      // Step 3: Validate role hierarchy
      const role = await discordService.getRole(guildId, roleId);
      const botHighestRole = await discordService.getBotHighestRole(guildId);

      if (role.position >= botHighestRole.position) {
        console.error(`[RoleService] Target role is higher or equal to bot's highest role`);
        return {
          status: 'ROLE_HIERARCHY_ERROR',
          isMember: true,
          hasRole: false,
          roleAssigned: false,
        };
      }

      // Step 4: Add role to user
      await discordService.addRoleToUser(userId, guildId, roleId);
      console.log(`[RoleService] Successfully assigned role ${roleId} to user ${userId}`);

      // Step 5: Get guild info for response
      const guild = await discordService.getGuild(guildId);

      return {
        status: 'ROLE_ASSIGNED',
        isMember: true,
        hasRole: true,
        roleAssigned: true,
        server: {
          id: guild.id,
          name: guild.name,
          icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          inviteUrl: config.discord.inviteUrl,
        },
      };
    } catch (error: any) {
      const errorMessage = error.message || 'INTERNAL_ERROR';
      console.error(`[RoleService] Error checking/assigning role:`, error);

      if (errorMessage === 'BOT_PERMISSION_ERROR') {
        return {
          status: 'BOT_PERMISSION_ERROR',
          isMember: false,
          hasRole: false,
          roleAssigned: false,
        };
      }

      if (errorMessage === 'ROLE_HIERARCHY_ERROR') {
        return {
          status: 'ROLE_HIERARCHY_ERROR',
          isMember: false,
          hasRole: false,
          roleAssigned: false,
        };
      }

      if (errorMessage === 'DISCORD_API_ERROR') {
        return {
          status: 'DISCORD_API_ERROR',
          isMember: false,
          hasRole: false,
          roleAssigned: false,
        };
      }

      return {
        status: 'INTERNAL_ERROR',
        isMember: false,
        hasRole: false,
        roleAssigned: false,
      };
    }
  }

  /**
   * Get current role status for user
   */
  async getRoleStatus(userId: string): Promise<RoleCheckResult> {
    try {
      const guildId = config.discord.guildId;
      const roleId = config.discord.roleId;

      // Check if user is member of guild
      const isMember = await discordService.checkGuildMembership(userId, guildId);

      if (!isMember) {
        return {
          status: 'NOT_MEMBER',
          isMember: false,
          hasRole: false,
          roleAssigned: false,
          server: {
            id: guildId,
            name: config.discord.inviteUrl,
            icon: null,
            inviteUrl: config.discord.inviteUrl,
          },
        };
      }

      // Get user's current roles
      const userRoles = await discordService.getUserRoles(userId, guildId);
      const hasRole = userRoles.includes(roleId);

      // Get guild info
      const guild = await discordService.getGuild(guildId);

      return {
        status: hasRole ? 'ALREADY_HAS_ROLE' : 'NOT_MEMBER',
        isMember: true,
        hasRole,
        roleAssigned: false,
        server: {
          id: guild.id,
          name: guild.name,
          icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          inviteUrl: config.discord.inviteUrl,
        },
      };
    } catch (error) {
      console.error(`[RoleService] Error getting role status:`, error);
      return {
        status: 'DISCORD_API_ERROR',
        isMember: false,
        hasRole: false,
        roleAssigned: false,
      };
    }
  }
}

export const roleService = new RoleService();
