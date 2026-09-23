import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  features: string[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: number;
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordGuildMember {
  user?: DiscordUser;
  nick: string | null;
  roles: string[];
  joined_at: string;
  premium_since: string | null;
  deaf: boolean;
  mute: boolean;
}

export class DiscordService {
  private axiosInstance: AxiosInstance;
  private readonly API_BASE = 'https://discord.com/api/v10';
  private readonly BOT_TOKEN = config.discord.botToken;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.API_BASE,
      timeout: 10000,
    });
  }

  /**
   * Exchange OAuth2 authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  }> {
    try {
      const response = await axios.post<any>(
        `${this.API_BASE}/oauth2/token`,
        {
          client_id: config.discord.clientId,
          client_secret: config.discord.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.oauth.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('[DiscordService] Failed to exchange code for token:', error);
      throw new Error('OAUTH_CODE_INVALID');
    }
  }

  /**
   * Get current user info using OAuth access token
   */
  async getCurrentUser(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await axios.get<DiscordUser>(
        `${this.API_BASE}/users/@me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('[DiscordService] Failed to get current user:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Check if user is a member of a specific guild
   */
  async checkGuildMembership(userId: string, guildId: string, botToken: string = this.BOT_TOKEN): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.API_BASE}/guilds/${guildId}/members/${userId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      return response.status === 200;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      console.error('[DiscordService] Failed to check guild membership:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Get user's roles in a guild
   */
  async getUserRoles(
    userId: string,
    guildId: string,
    botToken: string = this.BOT_TOKEN
  ): Promise<string[]> {
    try {
      const response = await axios.get<DiscordGuildMember>(
        `${this.API_BASE}/guilds/${guildId}/members/${userId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      return response.data.roles;
    } catch (error) {
      console.error('[DiscordService] Failed to get user roles:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Add role to user
   */
  async addRoleToUser(
    userId: string,
    guildId: string,
    roleId: string,
    botToken: string = this.BOT_TOKEN
  ): Promise<void> {
    try {
      await axios.put(
        `${this.API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {},
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error('[DiscordService] Bot does not have permission to add role:', error);
        throw new Error('BOT_PERMISSION_ERROR');
      }
      console.error('[DiscordService] Failed to add role:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Get guild info
   */
  async getGuild(guildId: string, botToken: string = this.BOT_TOKEN): Promise<DiscordGuild> {
    try {
      const response = await axios.get<DiscordGuild>(
        `${this.API_BASE}/guilds/${guildId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('[DiscordService] Failed to get guild:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Get role info
   */
  async getRole(guildId: string, roleId: string, botToken: string = this.BOT_TOKEN): Promise<DiscordRole> {
    try {
      const response = await axios.get<DiscordRole[]>(
        `${this.API_BASE}/guilds/${guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      const role = response.data.find((r) => r.id === roleId);
      if (!role) {
        throw new Error('ROLE_NOT_FOUND');
      }

      return role;
    } catch (error: any) {
      if (error.message === 'ROLE_NOT_FOUND') {
        throw error;
      }
      console.error('[DiscordService] Failed to get role:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }

  /**
   * Get bot's highest role in guild
   */
  async getBotHighestRole(guildId: string, botToken: string = this.BOT_TOKEN): Promise<DiscordRole> {
    try {
      const roles = await axios.get<DiscordRole[]>(
        `${this.API_BASE}/guilds/${guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      const botRoles = roles.data.filter((r) => r.managed); // Bot roles are managed
      const highest = botRoles.sort((a, b) => b.position - a.position)[0];

      if (!highest) {
        throw new Error('BOT_NOT_IN_SERVER');
      }

      return highest;
    } catch (error: any) {
      if (error.message === 'BOT_NOT_IN_SERVER') {
        throw error;
      }
      console.error('[DiscordService] Failed to get bot highest role:', error);
      throw new Error('DISCORD_API_ERROR');
    }
  }
}

export const discordService = new DiscordService();
