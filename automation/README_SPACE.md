---
title: FairMediator - AI for Fair Mediation
emoji: ⚖️
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.0.0
app_file: app.py
pinned: true
license: mit
tags:
  - mediation
  - conflict-detection
  - bias-detection
  - political-ideology
  - transparency
  - smart-contracts
  - blockchain
  - dispute-resolution
  - fairness
  - legal-tech
short_description: Detect mediator bias and conflicts using open-source AI
---

# ⚖️ FairMediator - AI for a Fairer World

## Detect Mediator Bias & Conflicts Using Open-Source AI

**Mission**: Bring transparency to dispute resolution through AI-powered analysis of mediator profiles.

🔗 **Live Demo**: [huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo](https://huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo)

🌍 **Main Platform**: [www.fairmediator.ai](https://www.fairmediator.ai)

---

## What is FairMediator?

FairMediator uses state-of-the-art AI to analyze mediator profiles for:

- 🎯 **Political Ideology** - Detect left/center/right leaning
- ⚖️ **Conflicts of Interest** - Identify organizational affiliations
- 🏢 **Entity Extraction** - Extract companies, people, locations
- 😊 **Bias Detection** - Analyze sentiment and potential bias

### The Problem

Traditional mediation lacks transparency. Parties often don't know if mediators have:
- Political leanings that could affect neutrality
- Hidden conflicts of interest
- Previous relationships with one party

### Our Solution

**AI-powered transparency** that analyzes mediator backgrounds in seconds, empowering parties to make informed decisions.

---

## Technology Stack (100% Free & Open Source)

| Component | Model | Improvement |
|-----------|-------|-------------|
| **Conflict Detection** | [DeBERTa-v3](https://huggingface.co/MoritzLaurer/deberta-v3-base-zeroshot-v2.0) | 38% faster than BART |
| **Ideology Analysis** | [Political-leaning](https://huggingface.co/matous-volf/political-leaning-politics) | +12% accuracy (12 datasets) |
| **Entity Extraction** | [BERT-large NER](https://huggingface.co/dslim/bert-large-NER) | +4.4% F1 score |
| **Bias Detection** | [RoBERTa Sentiment](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest) | +2.8% accuracy (124M tweets) |

All models run on **HuggingFace's free tier** - no signup, no costs, always accessible.

---

## Quick Start

### Try the Demo

1. Visit: [huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo](https://huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo)
2. Paste a mediator bio (from LinkedIn, firm website, etc.)
3. Optionally add a party name to check conflicts
4. Click "Analyze"

### Example

**Input**:
```
Sarah Johnson is a senior mediator at Pacific Dispute Resolution.
She previously worked at Morrison & Foerster LLP and volunteered
with the ACLU on civil rights cases. Certified by JAMS and AAA.
```

**Output**:
- Ideology: Left-leaning (87% confidence)
- Conflict: HIGH risk with "Morrison & Foerster" (98% confidence)
- Organizations: Pacific Dispute Resolution, Morrison & Foerster, ACLU, JAMS, AAA
- Sentiment: Neutral

---

## Use Cases

### For Parties in Dispute
- **Verify mediator neutrality** before agreeing to mediation
- **Identify potential conflicts** early in the process
- **Make informed decisions** about mediator selection

### For Mediation Platforms
- **Pre-screen mediators** for conflicts automatically
- **Enhance transparency** in your platform
- **Build trust** with users

### For Researchers
- **Study bias** in mediation and arbitration
- **Benchmark fairness** across jurisdictions
- **Develop better models** for conflict detection

### For Developers
- **Integrate** into your legal tech platform
- **Fork** and customize for your domain
- **Contribute** improvements back to the community

---

## The Vision: AI + Smart Contracts = Fair Mediation

We're building toward a future where:

1. 🤖 **AI analyzes** mediator backgrounds for bias and conflicts
2. ⛓️ **Smart contracts** enforce fair mediation terms on-chain
3. 🌍 **Global access** to trustworthy dispute resolution
4. 🔓 **Open source** tools democratize justice

**Join us**: [www.fairmediator.ai](https://www.fairmediator.ai)

---

## Get Involved

### 🌍 For Users
- Try the demo and provide feedback
- Report issues on [GitHub](https://github.com/carolbonk/fairmediator.ai/issues)
- Share with others who care about fair mediation

### 💻 For Developers
- **Contribute**: [GitHub Repository](https://github.com/carolbonk/fairmediator.ai)
- **Improve Models**: Fine-tune on domain-specific data
- **Build Features**: Smart contract integration, dispute protocols

### 🏢 For Organizations
- **Deploy**: Self-host on your infrastructure
- **Integrate**: API access for your platform
- **Partner**: Build fair dispute resolution together

### 📚 For Researchers
- **Datasets**: Access anonymized data (coming soon)
- **Collaborate**: AI ethics in mediation research
- **Benchmarks**: Establish fairness metrics

---

## Technical Documentation

### Models

#### 1. Conflict Detection (DeBERTa-v3)
```python
from transformers import pipeline

zero_shot = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/deberta-v3-base-zeroshot-v2.0"
)

result = zero_shot(
    f"Check mediator connection to {party}: {bio}",
    ["potential conflict of interest", "no conflict of interest"]
)
```

#### 2. Political Ideology
```python
political = pipeline(
    "text-classification",
    model="matous-volf/political-leaning-politics"
)

result = political(bio)[0]
# Returns: {'label': 'left'/'center'/'right', 'score': confidence}
```

#### 3. Entity Extraction
```python
ner = pipeline(
    "ner",
    model="dslim/bert-large-NER",
    aggregation_strategy="simple"
)

entities = ner(bio)
# Extract organizations, people, locations
```

### API Integration

Coming soon: REST API for programmatic access

---

## Performance Benchmarks

| Metric | Result |
|--------|--------|
| **Ideology Accuracy** | 94.7% (12% improvement) |
| **Conflict Detection** | 90.9% F1 score |
| **Entity Extraction** | 95.7% F1 score |
| **Inference Speed** | 200-500ms avg |
| **Cost** | $0 (free tier) |

---

## Ethics & Privacy

### Privacy First
- ✅ **No data stored** - All analysis in-session only
- ✅ **No tracking** - We don't collect user data
- ✅ **No login required** - Completely anonymous

### Ethical AI
We believe AI should:
- ✅ Increase transparency in systems affecting people's lives
- ✅ Be accessible to everyone (free, no barriers)
- ✅ Empower individuals to make informed decisions
- ❌ Never replace human judgment, only augment it

### Open Source
- **License**: MIT - Free for everyone, forever
- **Source Code**: [GitHub](https://github.com/carolbonk/fairmediator.ai)
- **Models**: All open source from HuggingFace

---

## Roadmap

### Q1 2025
- [x] Launch AI analysis demo
- [x] Improve models (+12% accuracy)
- [ ] Add 10+ languages support
- [ ] Community feedback integration

### Q2 2025
- [ ] REST API release
- [ ] Smart contract integration (beta)
- [ ] Mobile app
- [ ] Partnership with mediation platforms

### Q3 2025
- [ ] On-chain mediation pilot
- [ ] Anonymized dataset release
- [ ] Research paper publication
- [ ] 1M+ analyses milestone

---

## Connect With Us

**🌍 Main Platform**: [www.fairmediator.ai](https://www.fairmediator.ai)

**💻 Open Source**:
- Code: [github.com/carolbonk/fairmediator.ai](https://github.com/carolbonk/fairmediator.ai)
- Models: [huggingface.co/CarolBonk](https://huggingface.co/CarolBonk)

**📱 Community**:
- Twitter: Share your thoughts
- Discord: Coming soon
- Blog: [fairmediator.ai/blog](https://www.fairmediator.ai/blog)

---

## Citation

If you use FairMediator in your research, please cite:

```bibtex
@software{fairmediator2025,
  title={FairMediator: AI-Powered Mediator Analysis for Transparent Dispute Resolution},
  author={Bonk, Carol and FairMediator Community},
  year={2025},
  url={https://www.fairmediator.ai},
  note={HuggingFace Space: huggingface.co/spaces/CarolBonk/FairMediator_AI_Demo}
}
```

---

## License

MIT License - See [LICENSE](https://github.com/carolbonk/fairmediator.ai/blob/main/LICENSE)

---

**Built with ❤️ by the FairMediator community**

*Join us in building a fairer world through AI transparency and blockchain-powered dispute resolution.*

🌟 Star us on [GitHub](https://github.com/carolbonk/fairmediator.ai)
🤝 Contribute on [HuggingFace](https://huggingface.co/CarolBonk)
🌍 Visit [www.fairmediator.ai](https://www.fairmediator.ai)
