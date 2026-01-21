# Python Virtual Environment - Quick Reference

## One-Time Setup
```bash
./setup-python-venv.sh
```

## Daily Usage

### Activate (do this first!)
```bash
cd automation
source venv/bin/activate
```

### Run Scripts
```bash
cd huggingface
python batch_analyze.py        # Run full analysis
python batch_analyze.py test   # Test conflict detection
python batch_analyze.py report # Generate report
```

### Deactivate (when done)
```bash
deactivate
```

## Troubleshooting

### Install failed?
```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Need to reset?
```bash
rm -rf automation/venv
./setup-python-venv.sh
```

## VS Code Integration
1. Open Command Palette (`Cmd+Shift+P`)
2. "Python: Select Interpreter"
3. Choose `./automation/venv/bin/python`

---

**Always activate venv before running Python!**
Look for `(venv)` in your terminal prompt.
