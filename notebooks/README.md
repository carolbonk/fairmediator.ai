# FairMediator AI Pipeline - Jupyter Notebooks

Interactive development environment for prototyping and testing the FairMediator AI pipeline.

## 📓 Notebooks

### `FairMediator_AI_Pipeline_Consolidated.ipynb` ⭐ **Main Notebook**

**Comprehensive AI pipeline** combining the best features from previous iterations:

#### Features
- ✅ **Improved Models** (State-of-the-art performance)
  - RoBERTa for sentiment analysis
  - BERT-large for named entity recognition
  - DeBERTa-v3 for zero-shot classification (38% faster)
  - Specialized political leaning model (+12% accuracy)
  - Optional Mistral-7B for advanced reasoning

- ✅ **Complete Pipeline**
  - Affiliation detection (conflict of interest identification)
  - Ideology classification (liberal/conservative spectrum)
  - Entity extraction (organizations, people, locations)
  - Web scraping integration
  - Sentiment analysis

- ✅ **Interactive Tools**
  - Real-time testing widgets
  - Visualization charts
  - Custom input forms

- ✅ **Production Ready**
  - Backend API integration guide
  - Secure API key handling (no hardcoded secrets)
  - Full documentation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install all requirements
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory (one level up):

```env
# backend/.env
HUGGINGFACE_API_KEY=your_key_here
```

**Get your free HuggingFace API key**: https://huggingface.co/settings/tokens

### 3. Launch Jupyter

```bash
jupyter notebook
```

Open `FairMediator_AI_Pipeline_Consolidated.ipynb` and run the cells!

## 📦 What's Inside?

The consolidated notebook includes:

### Step 1: Environment Setup
- Package installation
- Import statements
- Secure API key loading from `.env`

### Step 2: Load AI Models
- Sentiment classifier (RoBERTa)
- Named Entity Recognition (BERT-large)
- Zero-shot classifier (DeBERTa-v3)
- Political ideology classifier (specialized model)
- Optional: Mistral-7B (advanced reasoning)

### Step 3: Test Individual Models
- Sentiment analysis on mediator reviews
- NER on mediator biographies
- Zero-shot ideology classification
- Political leaning detection

### Step 4: Affiliation Detection
- Function to detect conflicts of interest
- Risk level classification (LOW/MEDIUM/HIGH)
- Party-specific conflict checking

### Step 5: Ideology Classification
- Keyword-based analysis
- ML-based classification
- Combined scoring system (-10 liberal to +10 conservative)

### Step 6: Web Scraping
- Async scraping with aiohttp + BeautifulSoup
- Entity extraction from scraped profiles
- Contact information parsing

### Step 7: Interactive Testing Tools
- Text input widgets
- Real-time analysis
- Custom party conflict checking

### Step 8: Visualization
- Ideology distribution charts
- Experience vs rate analysis
- Statistical visualizations

### Step 9: Full Pipeline Demo
- End-to-end mediator analysis
- Complete profile evaluation
- Automated recommendations

### Step 10: Backend Integration
- API connection guide
- Production deployment instructions
- Frontend integration patterns

## 🎯 Use Cases

### 1. Prototyping New Features
Test new AI models or analysis approaches before integrating into production.

### 2. Model Evaluation
Compare different models and configurations to find the best performance.

### 3. Data Exploration
Explore mediator profiles, test scraping strategies, and analyze patterns.

### 4. Client Demos
Showcase AI capabilities with interactive widgets and visualizations.

### 5. Educational Reference
Learn how the AI pipeline works with detailed explanations and examples.

## 🔧 Advanced Configuration

### Using GPU Acceleration

If you have an NVIDIA GPU with CUDA:

```bash
# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

### Using Apple Silicon (M1/M2/M3)

PyTorch automatically uses Metal Performance Shaders (MPS):

```bash
pip install -r requirements.txt
# MPS acceleration is enabled by default
```

### Loading Mistral-7B

The notebook includes optional Mistral-7B support for advanced reasoning:

```python
# In the notebook, set this flag:
results = full_mediator_analysis(bio, parties, use_mistral=True)
```

**Requirements**:
- 4-6 GB RAM (with 4-bit quantization)
- OR 14+ GB RAM (full precision)
- OR use HuggingFace Inference API (free tier)

## 📊 Model Performance

| Model | Task | Speed | Accuracy |
|-------|------|-------|----------|
| RoBERTa | Sentiment | Fast | 95%+ |
| BERT-large | NER | Medium | 92%+ (F1) |
| DeBERTa-v3 | Zero-shot | Fast | 88%+ |
| Political Model | Ideology | Fast | 85%+ |
| Mistral-7B | Reasoning | Slow | 90%+ |

## 🔒 Security Best Practices

### ✅ DO:
- Store API keys in `.env` files (never commit to git)
- Use `python-dotenv` to load environment variables
- Add `.env` to `.gitignore`

### ❌ DON'T:
- Hardcode API keys in notebooks
- Commit notebooks with sensitive data
- Share notebooks with API keys included

## 🐛 Troubleshooting

### "No module named 'transformers'"
```bash
pip install transformers
```

### "CUDA out of memory"
Use CPU-only models or enable 4-bit quantization:
```python
model_kwargs={"load_in_4bit": True}
```

### "API key not found"
Make sure `.env` file exists in `backend/` directory:
```bash
# Check if file exists
ls ../backend/.env

# If not, create it:
echo "HUGGINGFACE_API_KEY=your_key" > ../backend/.env
```

### Models downloading slowly
First run downloads ~2-5GB of models. Subsequent runs use cached models.

## 🔗 Integration with FairMediator

This notebook integrates with the FairMediator platform:

### Backend Services
- **Python Scraper Service**: `backend/src/services/scraper/python/scraper_service.py`
- **Node.js API**: `backend/src/routes/chat.js`
- **Llama Client**: `backend/src/services/llama/llamaClient.js`

### API Endpoints
- `POST /api/chat/enrich-mediator` - Enrich mediator profiles
- `POST /api/chat/check-conflicts` - Check for conflicts
- `POST /api/chat/analyze-ideology` - Analyze political leanings
- `POST /api/chat/bulk-scrape` - Batch processing

### Frontend Components
- Chat interface: `frontend/src/components/Chat.jsx`
- Mediator cards: `frontend/src/components/MediatorCard.jsx`

## 📚 Additional Resources

### HuggingFace
- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [Model Hub](https://huggingface.co/models)
- [Free API](https://huggingface.co/inference-api)

### Models Used
- [RoBERTa Sentiment](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest)
- [BERT-large NER](https://huggingface.co/dslim/bert-large-NER)
- [DeBERTa-v3 Zero-shot](https://huggingface.co/MoritzLaurer/deberta-v3-base-zeroshot-v2.0)
- [Political Leaning](https://huggingface.co/matous-volf/political-leaning-politics)
- [Mistral-7B](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3)

### Python Libraries
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [aiohttp](https://docs.aiohttp.org/)
- [Pandas](https://pandas.pydata.org/)
- [Matplotlib](https://matplotlib.org/)

## 🤝 Contributing

Contributions welcome! To improve the notebooks:

1. Test your changes thoroughly
2. Update documentation
3. Remove any sensitive data
4. Submit a pull request

## 📝 License

MIT License - See main project LICENSE file for details.

---

**Happy Prototyping! 🚀**

For questions or issues, please open a GitHub issue or contact the maintainers.
