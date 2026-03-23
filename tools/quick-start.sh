#!/bin/bash

# FairMediator Quick Start Script
# This script helps you get started with FairMediator quickly

set -e  # Exit on error

echo "🎯 FairMediator Quick Start"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+ from https://python.org/"
    exit 1
fi
echo "✅ Python $(python3 --version)"

# Check MongoDB
if ! command -v mongod &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB not found. You can:"
    echo "   - Install MongoDB locally: https://www.mongodb.com/try/download/community"
    echo "   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Setup Python environment
echo "Setting up Python environment..."
cd automation
python3 -m venv venv

# Activate venv and install dependencies
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -r requirements.txt
deactivate
cd ..

echo ""
echo "⚙️  Setting up environment..."
echo ""

# Copy .env.example if .env doesn't exist
if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo "✅ Created backend/.env from .env.example"
    echo "⚠️  IMPORTANT: Edit backend/.env and add your:"
    echo "   - MongoDB URI (MONGODB_URI)"
    echo "   - Llama API key (LLAMA_API_KEY)"
    echo ""
else
    echo "ℹ️  backend/.env already exists"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Get a Llama API key from one of these providers:"
echo "   - Together AI: https://www.together.ai/ (Recommended, \$25 free credit)"
echo "   - Groq: https://console.groq.com/ (Free tier available)"
echo "   - Fireworks AI: https://fireworks.ai/"
echo ""
echo "2. Edit backend/.env and add your API key:"
echo "   nano backend/.env"
echo ""
echo "3. Start MongoDB (if using local MongoDB):"
echo "   mongod"
echo ""
echo "4. Seed sample data (optional):"
echo "   node backend/src/scripts/seed-data.js"
echo ""
echo "5. Start the application:"
echo "   npm run dev"
echo ""
echo "6. Open your browser:"
echo "   http://localhost:4010"
echo ""
echo "📚 For detailed instructions, see GETTING_STARTED.md"
echo ""
