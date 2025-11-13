# Python Virtual Environment Guide

## ✅ Why Use Virtual Environments?

Virtual environments isolate your Python packages per project, preventing:
- Version conflicts between projects
- System Python pollution
- "Works on my machine" problems
- Permission/sudo issues

**Industry Standard**: Every professional Python project uses virtual environments.

---

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup (Easiest)
```bash
# Run the setup script
./setup-python-venv.sh
```

### Option 2: Manual Setup
```bash
# 1. Navigate to automation folder
cd automation

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📝 Daily Usage

### Activate Virtual Environment
```bash
# Always activate before running Python scripts!
cd automation
source venv/bin/activate

# You'll see (venv) in your terminal:
# (venv) user@computer:~/FairMediator/automation$
```

### Run Scripts
```bash
# After activating venv:
cd huggingface
python batch_analyze.py
python ideology_classifier.py
python affiliation_detector.py
```

### Deactivate When Done
```bash
deactivate
```

---

## 🔧 Managing Packages

### Install New Package
```bash
# Activate venv first!
source venv/bin/activate

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

### Update All Packages
```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Check Installed Packages
```bash
source venv/bin/activate
pip list
```

---

## 🗑️ Reset/Recreate Environment

If something breaks:
```bash
# Delete virtual environment
rm -rf automation/venv

# Recreate it
cd automation
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🎯 Best Practices

### DO:
✅ Always activate venv before running Python scripts
✅ Keep `requirements.txt` updated
✅ Use virtual environments for EVERY project
✅ Add `venv/` to `.gitignore` (already done)
✅ Document Python version used (3.10+)

### DON'T:
❌ Install packages globally with `pip install`
❌ Commit `venv/` folder to Git
❌ Mix global and venv packages
❌ Use `sudo pip install` (never needed with venv)

---

## 🐍 Python Version Management

### Check Python Version
```bash
python3 --version
# Should be 3.10 or higher
```

### Using Specific Python Version
```bash
# Create venv with specific Python
python3.11 -m venv venv

# Or use pyenv (advanced)
pyenv install 3.11.0
pyenv local 3.11.0
python -m venv venv
```

---

## 🔍 Troubleshooting

### "python3: command not found"
```bash
# Install Python 3
# macOS:
brew install python3

# Ubuntu/Debian:
sudo apt update && sudo apt install python3 python3-venv

# Verify:
python3 --version
```

### "pip: command not found"
```bash
# After activating venv:
python -m ensurepip --upgrade
```

### Package Installation Fails
```bash
# Upgrade pip first:
pip install --upgrade pip setuptools wheel

# Try again:
pip install -r requirements.txt
```

### Permission Denied
```bash
# DON'T use sudo!
# Instead, make sure you're in virtual environment:
source venv/bin/activate
pip install package-name
```

---

## 📊 VS Code Integration

VS Code can automatically detect and use your virtual environment!

### Select Python Interpreter
1. Open Command Palette (`Cmd+Shift+P`)
2. Type: "Python: Select Interpreter"
3. Choose: `./automation/venv/bin/python`

### Auto-Activate in Terminal
Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/automation/venv/bin/python",
  "python.terminal.activateEnvironment": true
}
```

---

## 🎯 FairMediator Specific

### Required Packages (All FREE)
```
python-dotenv      # Environment variables
requests           # HTTP requests
huggingface-hub    # FREE AI models
transformers       # FREE ML library
beautifulsoup4     # Web scraping
selenium           # Browser automation
pandas             # Data processing
pymongo            # MongoDB driver
schedule           # Task scheduling
```

### Environment Variables
Create `automation/.env`:
```bash
HUGGINGFACE_API_KEY=hf_your_free_key_here
MONGODB_URI=mongodb://localhost:27017/fairmediator
```

### Testing Installation
```bash
cd automation
source venv/bin/activate
cd huggingface

# Test Hugging Face
python ideology_classifier.py

# Test MongoDB
python batch_analyze.py test
```

---

## 🌟 Alternative: Poetry (Advanced)

If you want even better dependency management:

```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Initialize project
cd automation
poetry init

# Install dependencies
poetry install

# Run scripts
poetry run python huggingface/batch_analyze.py
```

---

## 📚 Resources

- **Official Docs**: https://docs.python.org/3/library/venv.html
- **Real Python**: https://realpython.com/python-virtual-environments-a-primer/
- **Poetry**: https://python-poetry.org/docs/
- **pyenv**: https://github.com/pyenv/pyenv

---

## 🎉 Summary

**For FairMediator:**
1. Run `./setup-python-venv.sh` once
2. Always use `source automation/venv/bin/activate` before running Python
3. Install packages with `pip install` (inside venv)
4. Deactivate with `deactivate` when done

**Your virtual environment keeps everything isolated and FREE!** 🚀
