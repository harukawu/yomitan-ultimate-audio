#!/bin/bash

# Yomitan Audio Server - Local Setup Script for macOS
# This script helps you set up the local server quickly

set -e

echo "🎵 Yomitan Audio Server - Local Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "   Please install npm (it usually comes with Node.js)"
    exit 1
fi

echo "✓ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env configuration file..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file to set your API keys and preferences!"
    echo "   You can use: nano .env"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
    echo "✓ Created data directory"
else
    echo "✓ Data directory exists"
fi

# Check for SQL file
if [ ! -f "data/entry_and_pitch_db.sql" ]; then
    echo ""
    echo "⚠️  WARNING: Audio database file not found!"
    echo "   Please download entry_and_pitch_db.sql and place it in the data/ folder"
    echo "   See README.md for download instructions"
    echo ""
    echo "   After downloading the data files, run:"
    echo "   npm run local:init"
    exit 0
fi

# Check if database already exists
if [ -f "data/yomitan-audio.db" ]; then
    echo ""
    read -p "Database already exists. Recreate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping database initialization"
        echo ""
        echo "✅ Setup complete! You can now run:"
        echo "   npm run local:dev"
        exit 0
    fi
fi

# Initialize database
echo ""
echo "🗄️  Initializing database..."
npm run local:init

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  npm run local:dev"
echo ""
echo "Then configure Yomitan with:"
echo "  http://localhost:3000/audio/list?term={term}&reading={reading}&apiKey=YOUR_API_KEY"
echo ""

