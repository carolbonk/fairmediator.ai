# FairMediator — Automation

Python tooling for the data/ML pipeline that feeds the conflict-detection and
ideology-scoring features: scrapers, affiliation/ideology classifiers, and
batch analysis jobs.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Scripts

| Script | Purpose |
|---|---|
| `affiliation_detector` | NER + zero-shot affiliation/conflict detection (HuggingFace + Llama variants) |
| `ideology_classifier` | Maps public-record signals to the -10..+10 ideology axis |
| `batch_analyze` | Runs the classifiers over a batch of mediator profiles |

## Data sources

Public records only — FEC contributions, Senate LDA lobbying filings, PACER
court records, and state-bar directories. No private or purchased data (see
`../context.md`).

## Related

- ML settlement predictor: `../backend/src/ml_models/settlement_predictor/`
- Scheduled scraping/eval cron jobs live in the backend.
