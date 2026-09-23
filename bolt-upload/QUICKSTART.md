# 🚀 Quick Start Guide - Discord Role Bot

## ✅ System Status: FULLY BUILT AND READY

All code is compiled, all dependencies installed, all tests passed.

---

## 📋 What's Been Built

A complete Discord Bot + Backend API system that allows users to claim Discord roles through OAuth2:

1. **Discord Bot** (`discord.js`)
   - `/setup` command sends a button
   - Button opens Discord OAuth2
   - Automatic role assignment

2. **Backend API** (Express)
   - OAuth2 redirect handler
   - Status checking endpoints
   - Role claim endpoint
   - Secure session management

3. **Security**
   - CSRF protection
   - Rate limiting
   - Input validation
   - Secure cookies

---

## ⚙️ Configuration Required

### Step 1: Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it → Create
3. **Copy these values:**

**From "General Information" tab:**
- 📋 Application ID (Client ID)

**From "Bot" tab:**
- Click "Add Bot"
- 📋 Copy TOKEN (Bot Token)

**From "OAuth2" tab:**
- 📋 Copy CLIENT SECRET

4. Go to "OAuth2" → "Redirects"
   - Add: `http://localhost:3000/auth/discord/callback`

---

### Step 2: Discord Server Setup

1. Open your Discord server
2. Go to **Server Settings** → **Roles**
3. Create a new role or select existing one
   - 📋 Right-click role → Copy Role ID

4. Go to **Server Settings** → **Members**
   - Invite your bot (search its name)

5. Check Bot Permissions:
   - ✅ Manage Roles
   - ✅ View Channels
   - ✅ Read Messages

6. Verify bot role is **higher** than target role in hierarchy

7. Create invite link (if needed):
   - **Server Settings** → **Invites** → Copy link

---

### Step 3: Get Server & Role IDs

**Enable Developer Mode in Discord:**
- User Settings → Advanced → Toggle "Developer Mode"

**Get Guild ID:**
- Right-click server name at top
- "Copy Server ID"
- 📋 Save this

**Get Role ID:**
- Right-click role in Server Settings
- "Copy Role ID"
- 📋 Save this

---

### Step 4: Environment Setup

```bash
# Copy template
cp .env.example .env

# Edit .env and fill in values:
nano .env
# or open in your editor
```

**Fill these values:**

```env
DISCORD_BOT_TOKEN=<your-bot-token-here>
DISCORD_CLIENT_ID=<your-client-id-here>
DISCORD_CLIENT_SECRET=<your-client-secret-here>
DISCORD_GUILD_ID=<your-guild-id-here>
DISCORD_ROLE_ID=<your-role-id-here>
DISCORD_INVITE_URL=https://discord.gg/your-invite-code
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
WEB_URL=http://localhost:3001
SESSION_SECRET=<generate-random-string>
PORT=3000
NODE_ENV=development
```

**Generate SESSION_SECRET:**
```bash
# Run in terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and paste in .env as SESSION_SECRET value
```

---

## 🚀 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode (compiled)
```bash
npm start
```

Server will be running at: **http://localhost:3000**

---

## ✅ Test the System

### 1. Verify Bot is Online
- Open Discord
- Check if your bot is online in server members

### 2. Run Setup Command
- Type `/setup` in Discord server
- Bot should send a message with button

### 3. Click Button
- Click "🎖️ Claim Role" button
- Opens Discord OAuth2 authorization
- Click "Authorize"
- Redirected back to website

### 4. Check Role
- Look at your roles in server
- You should now have the target role

### 5. Check API Status
- Open browser
- Visit: `http://localhost:3000/api/auth/status`
- Should show your authenticated status

---

## 📱 Frontend Integration

Your frontend website should call these endpoints:

```javascript
// Check if user is logged in
fetch('http://localhost:3000/api/auth/status', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  if (data.authenticated) {
    console.log('User:', data.user);
  }
});

// Get server/role status
fetch('http://localhost:3000/api/server/status', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Member?', data.isMember);
  console.log('Has Role?', data.hasRole);
});

// Start OAuth flow
fetch('http://localhost:3000/auth/discord', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  window.location.href = data.authUrl;
});

// Logout
fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

---

## 🗂️ Project Structure

```
src/
├── bot/              # Discord bot code
├── config/           # Configuration loading
├── oauth/            # OAuth2 handling
├── services/         # Business logic
├── api/              # API endpoints
├── routes/           # Express routes
├── utils/            # Utilities
└── index.ts          # Server entry point
```

---

## 📊 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | No | Health check |
| `/auth/discord` | GET | No | Start OAuth flow |
| `/auth/discord/callback` | GET | No | OAuth callback (auto) |
| `/api/auth/status` | GET | Yes | Get auth status |
| `/api/auth/logout` | POST | Yes | Logout user |
| `/api/server/status` | GET | Yes | Get role status |
| `/api/server/claim-role` | POST | Yes | Claim role |
| `/api/server/info` | GET | No | Get server info |

---

## 🔧 Troubleshooting

### Bot doesn't respond to commands
- Ensure bot is invited to server
- Check bot has proper permissions
- Verify `DISCORD_BOT_TOKEN` is correct

### OAuth shows "Invalid redirect URI"
- Check `DISCORD_REDIRECT_URI` matches exactly in `.env` and Discord Portal
- Must be: `http://localhost:3000/auth/discord/callback`

### Can't assign role
- Verify bot role is **higher** than target role in hierarchy
- Check bot has "Manage Roles" permission
- Ensure `DISCORD_ROLE_ID` is correct

### "Not authenticated" on API
- Ensure cookies are being sent: add `credentials: 'include'` to fetch
- Check `.env` has `SESSION_SECRET` set
- Clear browser cookies and try again

---

## 📚 Full Documentation

See `README.md` for complete documentation including:
- Detailed setup guide
- All API endpoints
- Deployment to production
- Security information
- Troubleshooting guide

See `IMPLEMENTATION_SUMMARY.md` for technical details:
- System architecture
- Technologies used
- Build verification
- File structure
- Feature checklist

---

## 🎯 Common Tasks

### Invite Bot to Server
1. Go to Discord Developer Portal
2. Select your app
3. Go to OAuth2 → URL Generator
4. Select scopes: `bot`
5. Select permissions: `Manage Roles`, `Read Messages/View Channels`
6. Copy URL and open in browser
7. Select server and authorize

### Regenerate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Update `SESSION_SECRET` in `.env`

### View Bot Logs
Simply run the server - logs appear in console:
```bash
npm run dev
```

### Rebuild Project
```bash
npm run build
npm start
```

---

## 🚨 Important

⚠️ **NEVER:**
- Share your `DISCORD_BOT_TOKEN`
- Share your `DISCORD_CLIENT_SECRET`
- Commit `.env` file to git
- Send secrets to frontend

✅ **ALWAYS:**
- Keep `.env` file locally only
- Generate new `SESSION_SECRET` for production
- Use HTTPS in production
- Update Discord Portal OAuth2 URIs for production domain

---

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Verify all values in `.env` are correct
4. Check Discord server permissions
5. Check bot role hierarchy

---

## ✨ You're All Set!

The system is built, compiled, and ready. Just add your Discord credentials to `.env` and run:

```bash
npm start
```

Happy botting! 🎉
