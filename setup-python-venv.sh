#!/bin/bash

# FairMediator - Python Virtual Environment Setup
# Creates isolated environment for Python dependencies

echo "🐍 Setting up Python Virtual Environment..."

cd automation

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate it
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing FREE dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Virtual environment setup complete!"
echo ""
echo "📝 To activate in the future, run:"
echo "   cd automation && source venv/bin/activate"
echo ""
echo "📝 To deactivate, run:"
echo "   deactivate"
echo ""
echo "📝 To run scripts:"
echo "   cd automation/huggingface"
echo "   python batch_analyze.py"
echo ""
