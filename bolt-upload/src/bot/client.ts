import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Role,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { config } from '../config/env';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

/**
 * Generate OAuth2 authorization URL from bot
 */
function getOAuthStartUrl(): string {
  return `${new URL(config.oauth.redirectUri).origin}/auth/discord`;
}

/**
 * Discord Bot ready event
 */
client.on('ready', () => {
  console.log(`✅ [Bot] Discord Bot logged in as ${client.user?.tag}`);
  console.log(`   Bot ID: ${client.user?.id}`);
  console.log(`   Guild: ${config.discord.guildId}`);
  console.log(`   Role ID: ${config.discord.roleId}`);
});

/**
 * Register slash commands
 */
async function registerCommands(): Promise<void> {
  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.botToken);

    const commands = [
      new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup role claiming system')
        .setDefaultMemberPermissions(8) // Administrator permission
        .toJSON(),
      new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a role claim embed')
        .setDefaultMemberPermissions(8)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('create')
            .setDescription('Create an embed with a role claim button')
            .addStringOption((option) =>
              option.setName('title').setDescription('Embed title').setRequired(true)
            )
            .addStringOption((option) =>
              option.setName('description').setDescription('Embed description').setRequired(true)
            )
            .addStringOption((option) =>
              option.setName('image').setDescription('Direct image or GIF URL').setRequired(false)
            )
            .addStringOption((option) =>
              option.setName('color').setDescription('Hex color, for example #5865F2').setRequired(false)
            )
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName('buttonrole')
        .setDescription('Create a button role panel')
        .setDefaultMemberPermissions(8)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('create')
            .setDescription('Create a button that starts the role claim flow')
            .addRoleOption((option) =>
              option.setName('role').setDescription('Configured role to assign').setRequired(true)
            )
            .addStringOption((option) =>
              option.setName('label').setDescription('Button label').setRequired(true)
            )
            .addStringOption((option) =>
              option.setName('emoji').setDescription('Button emoji').setRequired(false)
            )
            .addStringOption((option) =>
              option.setName('description').setDescription('Panel description').setRequired(false)
            )
            .addStringOption((option) =>
              option.setName('image').setDescription('Direct image or GIF URL').setRequired(false)
            )
            .addStringOption((option) =>
              option.setName('color').setDescription('Hex color, for example #5865F2').setRequired(false)
            )
        )
        .toJSON(),
    ];

    console.log('[Bot] Registering slash commands...');

    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: commands,
    });

    console.log('✅ [Bot] Slash commands registered');
  } catch (error) {
    console.error('[Bot] Failed to register slash commands:', error);
  }
}

/**
 * Slash command handler
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const command = interaction.commandName;

  if (command === 'setup') {
    await handleSetupCommand(interaction);
    return;
  }

  if (command === 'embed' && interaction.isChatInputCommand()) {
    await handleEmbedCreate(interaction);
    return;
  }

  if (command === 'buttonrole' && interaction.isChatInputCommand()) {
    await handleButtonRoleCreate(interaction);
  }
});

/**
 * Button interaction handler
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }

  const customId = interaction.customId;

  if (customId === 'claim_role_button') {
    await handleClaimRoleButton(interaction);
  }
});

/**
 * Handle /setup command
 */
async function handleSetupCommand(interaction: CommandInteraction): Promise<void> {
  try {
    // Check if user is administrator
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to use this command',
        ephemeral: true,
      });
      return;
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#ff4b2b')
      .setTitle('รับยศ')
      .setDescription('กดปุ่มด้านล่างเพื่อเชื่อมต่อ Discord และรับยศของเซิร์ฟเวอร์')
      .addFields(
        {
          name: 'วิธีรับยศ',
          value:
            'กดปุ่มรับยศ → อนุญาต Discord OAuth2 → ระบบตรวจสอบและมอบยศให้อัตโนมัติ',
        },
        {
          name: 'ปลอดภัย',
          value: 'ระบบขอสิทธิ์เฉพาะข้อมูลโปรไฟล์ Discord ที่จำเป็นเท่านั้น',
        }
      )
      .setFooter({ text: 'ระบบรับยศผ่าน Discord OAuth2' })
      .setTimestamp();

    if (config.discord.bannerGifUrl) {
      embed.setImage(config.discord.bannerGifUrl);
    }

    // Create button
    const button = new ButtonBuilder()
      .setCustomId('claim_role_button')
      .setLabel('🎖️ รับยศ')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send message
    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    console.log(`[Bot] /setup command executed in guild ${interaction.guildId}`);
  } catch (error) {
    console.error('[Bot] Error handling /setup command:', error);
    await interaction.reply({
      content: '❌ An error occurred while setting up the system',
      ephemeral: true,
    });
  }
}

function getEmbedColor(value: string | null): `#${string}` {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value as `#${string}`;
  }
  return '#5865f2';
}

function createRoleClaimEmbed(
  interaction: ChatInputCommandInteraction,
  title: string,
  description: string,
  image: string | null,
  color: string | null
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(getEmbedColor(color))
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'ระบบรับยศผ่าน Discord OAuth2' });

  if (image) {
    embed.setImage(image);
  }

  return embed;
}

function createRoleClaimButton(label: string, emoji: string | null): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId('claim_role_button')
    .setLabel(label.slice(0, 80))
    .setStyle(ButtonStyle.Primary);

  if (emoji) {
    button.setEmoji(emoji);
  }

  return button;
}

async function handleEmbedCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description', true);
  const image = interaction.options.getString('image');
  const color = interaction.options.getString('color');
  const embed = createRoleClaimEmbed(interaction, title, description, image, color);
  const button = createRoleClaimButton('รับยศ', '🎖️');
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleButtonRoleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const role = interaction.options.getRole('role', true) as Role;
  if (role.id !== config.discord.roleId) {
    await interaction.reply({
      content: `❌ คำสั่งนี้ใช้ได้เฉพาะ Role ที่ตั้งใน DISCORD_ROLE_ID เท่านั้น (<@&${config.discord.roleId}>)`,
      ephemeral: true,
    });
    return;
  }

  const label = interaction.options.getString('label', true);
  const emoji = interaction.options.getString('emoji');
  const description = interaction.options.getString('description') || 'กดปุ่มด้านล่างเพื่อเชื่อมต่อ Discord และรับยศ';
  const image = interaction.options.getString('image') || config.discord.bannerGifUrl || null;
  const color = interaction.options.getString('color');
  const embed = createRoleClaimEmbed(interaction, 'รับยศ', description, image, color);
  const button = createRoleClaimButton(label, emoji);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.reply({ embeds: [embed], components: [row] });
}

/**
 * Handle claim role button click
 */
async function handleClaimRoleButton(interaction: ButtonInteraction): Promise<void> {
  try {
    // Generate OAuth URL
    const oauthUrl = getOAuthStartUrl();

    // Create embed with OAuth link
    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('🔐 เชื่อมต่อ Discord')
      .setDescription('กดปุ่มด้านล่างเพื่อเริ่มการยืนยันตัวตนและรับยศ')
      .addFields({
        name: 'ขั้นตอนถัดไป',
        value:
          'ระบบจะพาไป Discord เพื่อกดยืนยัน จากนั้นจะตรวจสมาชิกและมอบยศให้อัตโนมัติ',
      })
      .setFooter({ text: 'ระบบขอเฉพาะสิทธิ์ identify ที่จำเป็น' });

    if (config.discord.bannerGifUrl) {
      embed.setImage(config.discord.bannerGifUrl);
    }

    const button = new ButtonBuilder().setLabel('🎖️ รับยศ').setStyle(ButtonStyle.Link).setURL(oauthUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

    console.log(`[Bot] Claim role button clicked by user ${interaction.user.tag}`);
  } catch (error) {
    console.error('[Bot] Error handling claim role button:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your request',
      ephemeral: true,
    });
  }
}

/**
 * Login and initialize bot
 */
export async function initializeBot(): Promise<void> {
  try {
    console.log('[Bot] Initializing Discord Bot...');
    await client.login(config.discord.botToken);
    console.log('[Bot] Logging in...');
    
    // Wait for ready event
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[Bot] Bot ready timeout - proceeding anyway');
        resolve();
      }, 10000);

      client.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Register commands
    await registerCommands();
  } catch (error) {
    console.error('[Bot] Failed to initialize bot:', error);
    throw error;
  }
}

/**
 * Shutdown bot gracefully
 */
export async function shutdownBot(): Promise<void> {
  try {
    console.log('[Bot] Shutting down bot...');
    await client.destroy();
    console.log('[Bot] Bot disconnected');
  } catch (error) {
    console.error('[Bot] Error shutting down bot:', error);
  }
}

export { client };
