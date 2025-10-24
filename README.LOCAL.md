# Yomitan Audio Server - Local Setup Guide

This guide explains how to run the Yomitan Audio Server locally on macOS instead of deploying it to Cloudflare Workers.

## Why Run Locally?

- No Cloudflare account required
- No AWS account required (unless you want TTS)
- Free and unlimited usage
- Full control over your data
- Easy debugging and development

## Prerequisites

1. **Node.js** (version 18 or higher)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Audio Data Files** - Download from Discord (see main README.md)

## Quick Start

### 1. Install Dependencies

```bash
cd yomitan-ultimate-audio
npm install
```

### 2. Set Up Configuration

Create a `.env` file in the project root:

```bash
cp env.template .env
```

Edit `.env` with your preferred settings:

```env
# API Keys (comma-separated list for authentication)
API_KEYS="your_secret_key_here"

# AWS Credentials (only needed if you want TTS feature)
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"

# Feature Flags
AUTHENTICATION_ENABLED=true
AWS_POLLY_ENABLED=false

# Server Configuration
PORT=3000
```

**Important Configuration Options:**

- `AUTHENTICATION_ENABLED`: Set to `false` if you don't want API key authentication (only recommended for local use)
- `AWS_POLLY_ENABLED`: Set to `false` to disable TTS if you don't have AWS credentials
- `PORT`: Change to your preferred port (default: 3000)

### 3. Prepare Audio Data

Download the audio data files from Discord (see main README.md) and place them in the `data` folder. You should have:

```
data/
├── nhk16_files/
├── daijisen_files/
├── shinmeikai8_files/
├── jpod_files/
├── forvo_files/
├── forvo_ext_files/
├── forvo_ext2_files/
├── taas_files/
├── ozk5_files/
└── entry_and_pitch_db.sql
```

### 4. Initialize Database

Run the database initialization script:

```bash
npm run local:init
```

This will:
- Create a SQLite database at `data/yomitan-audio.db`
- Import all audio entries and pitch accent data
- Create a `data/tts_files/` directory for TTS cache

### 5. Start the Server

```bash
npm run local:dev
```

You should see:

```
🎵 Yomitan Audio Server Running Locally
   → Server: http://localhost:3000
   → Data directory: /path/to/data
   → Database: /path/to/data/yomitan-audio.db
   → Authentication: Enabled
   → AWS Polly TTS: Disabled

   Configure Yomitan with:
   http://localhost:3000/audio/list?term={term}&reading={reading}&apiKey=YOUR_API_KEY
```

### 6. Configure Yomitan

In Yomitan settings, add a custom audio source:

**With Authentication:**
```
http://localhost:3000/audio/list?term={term}&reading={reading}&apiKey=your_secret_key_here
```

**Without Authentication:**
```
http://localhost:3000/audio/list?term={term}&reading={reading}
```

## Configuration Files

### `.env` - Environment Variables

This file contains sensitive configuration and credentials. **Never commit this file to version control** (it's already in `.gitignore`).

```env
API_KEYS="key1,key2,key3"  # Comma-separated list of valid API keys
AWS_ACCESS_KEY_ID="..."     # AWS credentials for Polly TTS
AWS_SECRET_ACCESS_KEY="..." # AWS credentials for Polly TTS
AUTHENTICATION_ENABLED=true # Enable/disable API key authentication
AWS_POLLY_ENABLED=false     # Enable/disable AWS Polly TTS
PORT=3000                   # Server port
```

### `local.config.json` - Server Configuration

This file contains non-sensitive server settings:

```json
{
  "port": 3000,
  "dataDir": "./data",
  "databasePath": "./data/yomitan-audio.db"
}
```

You can customize:
- `port`: Server port (can be overridden by `PORT` in `.env`)
- `dataDir`: Location of audio files and database
- `databasePath`: Path to SQLite database file

## Advanced Configuration

### Changing the Port

You can change the server port in three ways (in order of precedence):

1. **Environment variable** (highest priority):
   ```bash
   PORT=8080 npm run local:dev
   ```

2. **In `.env` file**:
   ```env
   PORT=8080
   ```

3. **In `local.config.json`**:
   ```json
   {
     "port": 8080
   }
   ```

### Disabling Authentication

For personal local use, you can disable authentication:

In `.env`:
```env
AUTHENTICATION_ENABLED=false
```

Then use Yomitan URL without the `apiKey` parameter:
```
http://localhost:3000/audio/list?term={term}&reading={reading}
```

### Enabling TTS (AWS Polly)

To enable pitch-accent aware TTS:

1. Create an AWS account
2. Set up an IAM user with Polly permissions
3. Get AWS credentials (Access Key ID and Secret Access Key)
4. Update `.env`:
   ```env
   AWS_POLLY_ENABLED=true
   AWS_ACCESS_KEY_ID="your_access_key_id"
   AWS_SECRET_ACCESS_KEY="your_secret_access_key"
   ```

5. Restart the server

## Running in Production

For production use, you might want to:

1. **Use PM2 or similar process manager:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "yomitan-audio" -- run local:start
   pm2 save
   pm2 startup
   ```

2. **Build the TypeScript code:**
   ```bash
   npm run local:build
   node dist/server.js
   ```

3. **Set up HTTPS** using a reverse proxy like nginx or Caddy

4. **Keep authentication enabled** for security

## Troubleshooting

### TypeScript compilation errors

If you encounter TypeScript errors when running the server, ensure:
1. All dependencies are installed: `npm install`
2. Node.js version is 18 or higher: `node --version`
3. All files in `src/types/` directory exist

The implementation uses custom type definitions in `src/types/env.d.ts` to provide Cloudflare Worker types in the local environment.

### Database not found error

```
Database not found at /path/to/data/yomitan-audio.db
Please run: npm run local:init
```

**Solution:** Run `npm run local:init` to initialize the database.

### Port already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Either stop the process using port 3000 or change the port in your configuration.

Find and kill the process:
```bash
lsof -ti:3000 | xargs kill -9
```

Or change the port:
```bash
PORT=3001 npm run local:dev
```

### Audio files not found

If you get 404 errors for audio files, ensure:
1. Audio data is in the `data/` directory
2. Folders are named correctly (e.g., `nhk16_files`, `jpod_files`)
3. The `dataDir` in `local.config.json` points to the correct location

### TTS not working

If TTS is not generating audio:
1. Check that `AWS_POLLY_ENABLED=true` in `.env`
2. Verify AWS credentials are correct
3. Ensure your AWS IAM user has Polly permissions
4. Check the server logs for AWS error messages

### Permission denied when creating TTS files

Ensure the `data/tts_files/` directory exists and is writable:
```bash
mkdir -p data/tts_files
chmod 755 data/tts_files
```

## Project Structure

```
yomitan-ultimate-audio/
├── data/
│   ├── *_files/              # Audio source folders
│   ├── tts_files/            # Generated TTS cache
│   ├── yomitan-audio.db      # SQLite database
│   └── entry_and_pitch_db.sql # SQL import file
├── src/
│   ├── server.ts             # Express server (local mode)
│   ├── index.ts              # Router (works for both modes)
│   ├── types/
│   │   └── env.d.ts          # Global type definitions for Cloudflare types
│   ├── lib/
│   │   ├── localStorage.ts   # Local filesystem adapter
│   │   ├── localDatabase.ts  # SQLite database adapter
│   │   └── ...               # Other libraries (with type references)
│   └── routes/
│       └── audio.ts          # Audio routes
├── scripts/
│   ├── init-local-db.js      # Database initialization
│   └── upload-to-r2.sh       # For Cloudflare deployment
├── .env                      # Environment variables (create this)
├── .env.example              # Environment template
├── local.config.json         # Local server config
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript config (Cloudflare)
└── tsconfig.server.json      # TypeScript config (local server)
```

## Technical Notes

### Type System Implementation

The local server uses a custom type definition system to maintain compatibility with Cloudflare Worker types:

- **`src/types/env.d.ts`**: Defines global types (`Env`, `ExecutionContext`, `D1Result`, `D1Database`, `R2Bucket`)
- **Triple-slash directives**: Each TypeScript file includes `/// <reference path="..." />` to access these types
- **Dual compatibility**: The same route handlers work in both Cloudflare and local environments

### Adapter Pattern

The implementation uses adapters to translate between Cloudflare APIs and local equivalents:

- **D1 Database** → **SQLite** (via better-sqlite3)
- **R2 Bucket** → **Local Filesystem** (via Node.js fs module)
- **ExecutionContext.waitUntil()** → **Background promise handling**

### Request/Response Flow

```
Express Request → Web API Request → itty-router → Express Response
                  (conversion)                      (conversion)
```

The server converts Express requests to Web API Request objects (which itty-router expects), processes them through the router, and converts the responses back to Express format.

## npm Scripts

- `npm run local:init` - Initialize the local database
- `npm run local:dev` - Run development server with hot reload
- `npm run local:start` - Run production server
- `npm run local:build` - Build TypeScript to JavaScript
- `npm run deploy` - Deploy to Cloudflare (original functionality)
- `npm run dev` - Run Cloudflare Worker locally (original functionality)

## Differences from Cloudflare Deployment

| Feature | Cloudflare Worker | Local Server |
|---------|------------------|--------------|
| Database | D1 (Cloud SQL) | SQLite (Local file) |
| Storage | R2 (Cloud Object Storage) | Filesystem (Local files) |
| Deployment | Cloud (Global CDN) | Local machine |
| Cost | Free tier limits | Free (unlimited) |
| Setup | Requires Cloudflare account | No cloud accounts needed |
| Performance | Global CDN | Local network speed |
| Scaling | Automatic | Single machine |

## Security Notes

### For Local Personal Use

If you're running the server only on your local machine for personal use:
- You can disable authentication (`AUTHENTICATION_ENABLED=false`)
- The server only listens on localhost by default
- No external access unless you configure port forwarding

### For Network/Remote Access

If you plan to access the server from other devices or over the internet:
- **Keep authentication enabled** (`AUTHENTICATION_ENABLED=true`)
- Use strong API keys
- Consider setting up HTTPS
- Use a firewall to restrict access
- Don't expose AWS credentials in URLs

## Getting Help

If you encounter issues:
1. Check the server logs for error messages
2. Verify all configuration files are correct
3. Ensure all dependencies are installed (`npm install`)
4. Check that audio data files are in the correct location
5. Create an issue on GitHub with details about your problem

## License

Same as the main project.

