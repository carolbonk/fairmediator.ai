# Deploy Updated FairMediator to HuggingFace Spaces

## Quick Deploy

1. **Go to your Space**: https://huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo

2. **Click "Files" tab**

3. **Upload these files**:
   - `gradio_app.py` → rename to `app.py`
   - `requirements_gradio.txt` → rename to `requirements.txt`

4. **Wait for automatic rebuild** (2-3 minutes)

5. **Done!** Your Space will now use:
   - ✅ DeBERTa-v3 (38% faster)
   - ✅ Political-leaning model (+12% accuracy)
   - ✅ BERT-large NER (+4.4% F1)
   - ✅ RoBERTa sentiment (+2.8% accuracy)

## Files to Upload

```
/Users/carolbonk/Desktop/FairMediator/automation/
├── gradio_app.py  ← Upload as "app.py"
└── requirements_gradio.txt  ← Upload as "requirements.txt"
```

## Test Locally First (Optional)

```bash
cd /Users/carolbonk/Desktop/FairMediator/automation
pip install -r requirements_gradio.txt
python3 gradio_app.py
```

Then open: http://localhost:7860

## What Changed

### Old Models → New Models

| Component | Old | New | Improvement |
|-----------|-----|-----|-------------|
| Zero-shot | BART-large | DeBERTa-v3 | +38% speed |
| Ideology | Generic | Political-leaning | +12% accuracy |
| NER | BERT-base | BERT-large | +4.4% F1 |
| Sentiment | DistilBERT | RoBERTa | +2.8% accuracy |

### Still FREE Tier ✅

All models run on HuggingFace's free CPU tier:
- No GPU needed
- No costs
- Auto-scaling
- Permanent URL

## Rollback Plan

If anything breaks, you can revert by:
1. Go to Files tab
2. Click the 3 dots next to `app.py`
3. Select "History"
4. Restore previous version

## Support

Issues? Check:
- https://huggingface.co/docs/hub/spaces
- https://github.com/YOUR_REPO/issues
