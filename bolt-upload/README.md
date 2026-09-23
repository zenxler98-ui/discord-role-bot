# Discord Role Bot - OAuth2 Role Assignment System

A complete Discord Bot system that allows users to claim roles through Discord OAuth2 authentication, with a backend API for integration with external websites.

## Features

✅ **Discord Bot with Slash Commands** - `/setup` command to create role-claiming interface  
✅ **Discord OAuth2 Integration** - Secure user authentication with Discord  
✅ **Automatic Role Assignment** - Bot automatically assigns roles to authenticated users  
✅ **Backend REST API** - For external websites to check user status  
✅ **Session Management** - Secure session handling with HttpOnly cookies  
✅ **Security** - CSRF protection, input validation, rate limiting  
✅ **Error Handling** - Comprehensive error states and logging  
✅ **TypeScript** - Fully typed for better developer experience  

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Discord Developer Application** (for bot token and OAuth2 credentials)
- **Discord Server** with administrator permissions

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd discord-role-bot
npm install
```

### 2. Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. **Copy the Application ID** (Client ID)

#### Bot Setup
1. Go to "Bot" section
2. Click "Add Bot"
3. Under "TOKEN" section, click "Copy" to copy the bot token
4. Under "Privileged Gateway Intents", enable:
   - Message Content Intent
   - Server Members Intent (optional but recommended)

#### OAuth2 Setup
1. Go to "OAuth2" → "General"
2. Copy the **Client ID** (if not done above)
3. **Copy the Client Secret** and save it securely
4. Go to "OAuth2" → "URL Generator"
5. **Scopes**: Select `identify`
6. Copy the generated URL (this shows what users will see)

#### Redirects
1. Go to "OAuth2" → "General"
2. In "Redirects" section, add:
   - `http://localhost:3000/auth/discord/callback` (Development)
   - `https://YOUR-DOMAIN/auth/discord/callback` (Production)

### 3. Discord Server Setup

1. Open your Discord server
2. Go to Server Settings → Roles
3. Create or select a role to assign
4. **Copy the Role ID**:
   - Enable Developer Mode in User Settings → App Settings → Developer Mode
   - Right-click the role and select "Copy Role ID"

5. Go to Server Settings → Members
6. Find your bot (it should be in the members list)
7. Check permissions:
   - The bot needs the role to be lower in the hierarchy than its own highest role
   - The bot needs "Manage Roles" permission

### 4. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in the values:

```env
# Discord Bot Token (from Developer Portal → Bot)
DISCORD_BOT_TOKEN=your-bot-token-here

# OAuth2 Credentials (from Developer Portal → OAuth2)
DISCORD_CLIENT_ID=your-client-id-here
DISCORD_CLIENT_SECRET=your-client-secret-here

# Server Configuration
DISCORD_GUILD_ID=your-server-id-here
DISCORD_ROLE_ID=your-role-id-here
DISCORD_INVITE_URL=https://discord.gg/your-invite-code

# OAuth2 Redirect (must match Discord Developer Portal)
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback

# Frontend Website URL
WEB_URL=http://localhost:3001

# Session Secret (generate a random secure string)
SESSION_SECRET=generate-a-random-secure-string-here

# Server
PORT=3000
NODE_ENV=development
```

### Getting Role ID & Guild ID

**Guild ID:**
- Enable Developer Mode in Discord
- Right-click your server name at the top
- Select "Copy Server ID"

**Role ID:**
- Right-click the role in Server Settings → Roles
- Select "Copy Role ID"

### Generate a Secure Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local Development

### Install Dependencies

```bash
npm install
```

### Type Checking

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Test the System

1. Open Discord and go to your server
2. Run `/setup` command (you need Administrator permissions)
3. Click the "🎖️ Claim Role" button
4. You'll be redirected to Discord OAuth2
5. After authorization, you should get the role automatically
6. The website will show your status

## API Endpoints

### Authentication

**Initiate OAuth2 Flow**
```
GET /auth/discord
Response: { authUrl: "https://discord.com/api/oauth2/authorize?..." }
```

**OAuth2 Callback (Handled automatically)**
```
GET /auth/discord/callback?code=...&state=...
Redirects to: WEB_URL with status parameter
```

### API Routes (Require Authentication)

**Check Authentication Status**
```
GET /api/auth/status

Response (Authenticated):
{
  "authenticated": true,
  "user": {
    "id": "DISCORD_USER_ID",
    "username": "USERNAME",
    "avatar": "AVATAR_URL"
  }
}

Response (Not Authenticated):
{
  "authenticated": false
}
```

**Logout**
```
POST /api/auth/logout

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Get Server Status (Requires Authentication)**
```
GET /api/server/status

Response:
{
  "authenticated": true,
  "userId": "DISCORD_USER_ID",
  "isMember": true,
  "hasRole": true,
  "status": "ALREADY_HAS_ROLE",
  "server": {
    "id": "GUILD_ID",
    "name": "Server Name",
    "icon": "ICON_URL",
    "inviteUrl": "INVITE_URL"
  }
}
```

**Claim Role (Requires Authentication)**
```
POST /api/server/claim-role

Response:
{
  "success": true,
  "status": "ROLE_ASSIGNED",
  "isMember": true,
  "hasRole": true,
  "roleAssigned": true,
  "server": {
    "id": "GUILD_ID",
    "name": "Server Name",
    "icon": "ICON_URL",
    "inviteUrl": "INVITE_URL"
  }
}
```

**Get Server Info (No Authentication Required)**
```
GET /api/server/info

Response:
{
  "id": "GUILD_ID",
  "name": "Server Name",
  "icon": "ICON_URL",
  "inviteUrl": "INVITE_URL"
}
```

### Health Check

```
GET /health

Response:
{
  "status": "ok",
  "bot": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Role Status States

- **NOT_CONNECTED** - User hasn't authenticated yet
- **NOT_MEMBER** - User is authenticated but not a member of the guild
- **ALREADY_HAS_ROLE** - User has the role already
- **ROLE_ASSIGNED** - Role was just assigned to the user
- **BOT_PERMISSION_ERROR** - Bot doesn't have permission to assign roles
- **ROLE_HIERARCHY_ERROR** - Target role is higher than bot's highest role
- **DISCORD_API_ERROR** - Discord API error
- **INTERNAL_ERROR** - Server-side error

## Production Deployment

### Environment Setup

Update `.env` for production:

```env
NODE_ENV=production
DISCORD_REDIRECT_URI=https://YOUR-DOMAIN/auth/discord/callback
WEB_URL=https://YOUR-WEBSITE-DOMAIN
SESSION_SECRET=your-production-secure-secret
PORT=3000
```

### Build and Run

```bash
# Build
npm run build

# Start
npm start
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t discord-role-bot .
docker run -p 3000:3000 --env-file .env discord-role-bot
```

## Integration with Frontend

Your frontend website should:

1. **On page load**, call `/api/auth/status` to check if user is logged in
2. **Show a "Claim Role" button** that opens `/auth/discord`
3. **After OAuth redirect**, the frontend should be at the `WEB_URL`
4. **Call `/api/server/status`** to get the latest user status
5. **Display status messages** based on the returned status

### Example Frontend Integration

```javascript
// Check if user is authenticated
async function checkAuth() {
  const response = await fetch('http://localhost:3000/api/auth/status', {
    credentials: 'include'
  });
  const data = await response.json();
  return data;
}

// Get server status
async function getServerStatus() {
  const response = await fetch('http://localhost:3000/api/server/status', {
    credentials: 'include'
  });
  const data = await response.json();
  return data;
}

// Initiate login
function claimRole() {
  fetch('http://localhost:3000/auth/discord', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      window.location.href = data.authUrl;
    });
}
```

## Troubleshooting

### Bot doesn't appear in server
- Check if bot token is correct
- Make sure bot is invited to the server
- Verify bot has permissions

### OAuth returns "Invalid redirect URI"
- Check that redirect URL matches exactly in Discord Developer Portal
- Make sure `DISCORD_REDIRECT_URI` in `.env` matches the one in Discord Portal

### Can't assign role
- Check bot role is higher than target role
- Verify bot has "Manage Roles" permission
- Ensure Role ID is correct

### "Not authenticated" error
- Check if session cookie is being saved
- Make sure `SESSION_SECRET` is set
- Verify frontend is sending `credentials: 'include'`

### Environment variables not loading
- Copy `.env.example` to `.env`
- Check no syntax errors in `.env`
- Restart the server after changing `.env`

## Security Notes

🔒 **Important Security Practices**

1. **Never commit `.env`** - Use `.env.example` for template
2. **Use strong `SESSION_SECRET`** - Generate with crypto.randomBytes()
3. **Keep `CLIENT_SECRET` private** - Never expose to frontend
4. **Verify OAuth state** - CSRF protection enabled
5. **Use HTTPS in production** - Secure cookies require HTTPS
6. **Validate all inputs** - Input validation on server
7. **Rate limiting enabled** - Prevents brute force attacks
8. **CORS restricted** - Only allows specified origin
9. **No secrets in logs** - Bot token and secrets never logged
10. **HttpOnly cookies** - Session cookie not accessible via JavaScript

## Project Structure

```
src/
├── bot/
│   └── client.ts              # Discord bot client & commands
├── config/
│   └── env.ts                 # Environment configuration
├── oauth/
│   └── callback.ts            # OAuth2 flow handling
├── services/
│   ├── discordService.ts      # Discord API interactions
│   ├── roleService.ts         # Role checking/assignment logic
│   └── sessionService.ts      # Session management
├── api/
│   ├── auth.ts                # Auth API endpoints
│   └── server.ts              # Server/role API endpoints
├── routes/
│   └── auth.ts                # OAuth routes
├── utils/
│   └── security.ts            # Security utilities
└── index.ts                   # Main server file
```

## Dependencies

- **discord.js** - Discord API library
- **express** - HTTP server framework
- **dotenv** - Environment variables
- **express-session** - Session management
- **cors** - CORS middleware
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **axios** - HTTP client
- **typescript** - TypeScript compiler

## License

MIT

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0
