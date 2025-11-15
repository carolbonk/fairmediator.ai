#!/bin/bash

# FairMediator Test Runner
# Checks prerequisites and runs tests

echo "🧪 FairMediator Test Runner"
echo "============================"
echo ""

# Check if MongoDB is running
echo "Checking MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is NOT running"
    echo "   Start with: brew services start mongodb-community"
    echo "   Or: mongod --dbpath=/path/to/data"
    exit 1
fi

# Check for HuggingFace API key
if [ -z "$HUGGINGFACE_API_KEY" ]; then
    echo "⚠️  HUGGINGFACE_API_KEY not set (AI tests will be skipped)"
    echo "   Get FREE at: https://huggingface.co/settings/tokens"
else
    echo "✅ HUGGINGFACE_API_KEY is set"
fi

echo ""
echo "Running tests..."
echo ""

npm test

