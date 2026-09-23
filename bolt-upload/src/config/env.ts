import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  discord: {
    botToken: string;
    clientId: string;
    clientSecret: string;
    guildId: string;
    roleId: string;
    inviteUrl: string;
    bannerGifUrl?: string;
  };
  oauth: {
    redirectUri: string;
  };
  web: {
    url: string;
  };
  session: {
    secret: string;
  };
  server: {
    port: number;
    nodeEnv: 'development' | 'production';
  };
}

function validateEnv(): Config {
  const required = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_GUILD_ID',
    'DISCORD_ROLE_ID',
    'DISCORD_INVITE_URL',
    'DISCORD_REDIRECT_URI',
    'WEB_URL',
    'SESSION_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error(`   Copy .env.example to .env and fill in the missing values`);
    process.exit(1);
  }

  return {
    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN!,
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      guildId: process.env.DISCORD_GUILD_ID!,
      roleId: process.env.DISCORD_ROLE_ID!,
      inviteUrl: process.env.DISCORD_INVITE_URL!,
      bannerGifUrl: process.env.DISCORD_BANNER_GIF_URL || undefined,
    },
    oauth: {
      redirectUri: process.env.DISCORD_REDIRECT_URI!,
    },
    web: {
      url: process.env.WEB_URL!,
    },
    session: {
      secret: process.env.SESSION_SECRET!,
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    },
  };
}

export const config = validateEnv();
