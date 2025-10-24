# Quick Start Guide - Local Server

## 1️⃣ Prerequisites

- macOS
- Node.js 18+ ([download](https://nodejs.org/))
- Audio data files (from Discord - see README.md)
- npm (comes with Node.js)

## 2️⃣ Installation

```bash
# Clone or navigate to the project
cd yomitan-ultimate-audio

# Install dependencies (this may take a few minutes)
npm install
```

**Note**: The installation will include all necessary dependencies including Express, SQLite, TypeScript, and more.

## 3️⃣ Configuration

```bash
# Create environment file
cp .env.example .env

# Edit configuration (optional but recommended)
nano .env
```

**Minimal `.env` configuration:**
```env
API_KEYS="my_secret_key_123"
AUTHENTICATION_ENABLED=true
AWS_POLLY_ENABLED=false
PORT=3000
```

## 4️⃣ Initialize Database

```bash
# Make sure entry_and_pitch_db.sql is in data/ folder
# Then run:
npm run local:init
```

## 5️⃣ Start Server

```bash
npm run local:dev
```

You should see:
```
🎵 Yomitan Audio Server Running Locally
   → Server: http://localhost:3000
```

## 6️⃣ Configure Yomitan

In Yomitan settings → Audio → Custom Audio Source:

```
http://localhost:3000/audio/list?term={term}&reading={reading}&apiKey=my_secret_key_123
```

**Without authentication:**
```
http://localhost:3000/audio/list?term={term}&reading={reading}
```

## 🎉 Done!

Test it by looking up a Japanese word in Yomitan!

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run local:init` | Initialize database (first time only) |
| `npm run local:dev` | Start development server |
| `npm run local:start` | Start production server |
| `./setup-local.sh` | Automated setup script |

## Common Issues

**Database not found?**
```bash
npm run local:init
```

**Port 3000 in use?**
```bash
PORT=3001 npm run local:dev
```

**Can't find audio files?**
- Ensure files are in `data/*_files/` directories
- Check folder names: `nhk16_files`, `jpod_files`, etc.

---

## Next Steps

- Read [README.LOCAL.md](README.LOCAL.md) for detailed documentation
- See [CHANGES.md](CHANGES.md) for technical details
- Check [README.md](README.md) for Cloudflare deployment

## Need Help?

1. Check server logs for errors
2. Verify all files are in correct locations
3. See troubleshooting in README.LOCAL.md
4. Create an issue on GitHub

