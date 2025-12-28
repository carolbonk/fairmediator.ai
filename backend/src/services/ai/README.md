# AI Services - RAG & Semantic Search

This directory contains advanced AI features for FairMediator:
- **RAG (Retrieval-Augmented Generation)** for semantic mediator search
- **Vector embeddings** for similarity matching
- **Active Learning integration** for continuous improvement

## Files

### `embeddingService.js`
Vector embedding service for mediator profiles.

**Features:**
- Generates embeddings using HuggingFace `sentence-transformers/all-MiniLM-L6-v2`
- Stores vectors in ChromaDB for fast similarity search
- Batch indexing support
- Update/delete operations

**Usage:**
```javascript
const embeddingService = require('./embeddingService');

// Initialize (required before first use)
await embeddingService.initialize();

// Index a mediator
await embeddingService.indexMediator(mediator);

// Batch index multiple mediators
const result = await embeddingService.indexMediators(mediators);
console.log(`Indexed ${result.indexed}, failed ${result.failed}`);

// Search for similar mediators
const results = await embeddingService.searchSimilar(
  'employment mediator in California',
  { topK: 10 }
);

// Update mediator embedding
await embeddingService.updateMediator(mediator);

// Delete mediator from index
await embeddingService.deleteMediator(mediatorId);

// Get stats
const stats = await embeddingService.getStats();
console.log(`Collection has ${stats.count} documents`);
```

### `ragEngine.js`
RAG implementation combining vector search with LLM generation.

**Features:**
- Semantic search using embeddings
- Grounded AI responses with citations
- Fallback to keyword search if needed
- Hybrid search combining both approaches
- Similarity threshold filtering

**Usage:**
```javascript
const ragEngine = require('./ragEngine');

// Process user query with RAG
const result = await ragEngine.processQuery(
  'Find a neutral mediator for tech IP dispute in SF',
  conversationHistory,
  {
    topK: 10,
    filters: { state: 'CA', minExperience: 5 },
    includeIdeology: true,
    includeConflicts: true
  }
);

console.log(result.message);        // AI response
console.log(result.mediators);      // Top matching mediators
console.log(result.sources);        // Citations with match scores
console.log(result.metadata);       // Search metadata

// Hybrid search (vector + keyword)
const hybrid = await ragEngine.hybridSearch(
  'employment dispute',
  { state: 'CA', city: 'San Francisco' }
);
```

**Response Format:**
```javascript
{
  message: "Based on your requirements, I recommend...",
  model: "meta-llama/Llama-3.2-3B-Instruct",
  timestamp: "2024-12-28T...",
  mediators: [...],  // Full mediator objects
  sources: [
    {
      mediatorId: "...",
      name: "John Smith",
      matchScore: "87.5",  // Semantic similarity score
      location: "San Francisco, CA",
      specializations: ["Employment Law", "IP"],
      yearsExperience: 15,
      verified: true
    }
  ],
  metadata: {
    searchMethod: "rag",
    similarityScores: [...],
    vectorSearchResults: 8,
    threshold: 0.5
  }
}
```

## Setup

### 1. Install ChromaDB

**Option A: Docker (Recommended)**
```bash
docker run -d -p 8000:8000 chromadb/chroma
```

**Option B: Python Package**
```bash
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

### 2. Environment Variables

Add to `.env`:
```bash
# ChromaDB connection
CHROMADB_URL=http://localhost:8000

# HuggingFace API (required)
HUGGINGFACE_API_KEY=hf_...

# Model version for tracking
CONFLICT_MODEL_VERSION=1.0.0
```

### 3. Initialize Vector Database

**First-time setup:**
```bash
npm run init-vectors
```

**Rebuild from scratch:**
```bash
npm run init-vectors:clear
```

**Manual:**
```bash
node src/scripts/initializeVectorDB.js
node src/scripts/initializeVectorDB.js --clear  # Clear existing
```

## Integration

### Using RAG in Chat Service

```javascript
const chatService = require('../huggingface/chatService');

// Option 1: RAG-enhanced query (recommended)
const result = await chatService.processQueryWithRAG(
  userMessage,
  conversationHistory,
  { topK: 10 }
);

// Option 2: Traditional query (fallback)
const result = await chatService.processQuery(
  userMessage,
  conversationHistory
);
```

### API Routes

The chat routes automatically use RAG when available:

```bash
# POST /api/chat
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Find mediator for employment discrimination case",
    "history": []
  }'
```

## How RAG Works

1. **User Query** → "employment discrimination mediator in California"

2. **Generate Embedding** → [0.123, -0.456, 0.789, ...] (384 dimensions)

3. **Vector Search** → Find top 10 similar mediator profiles in ChromaDB

4. **Retrieve Details** → Fetch full mediator data from MongoDB

5. **Build Context** → Create prompt with mediator details + match scores

6. **LLM Generation** → AI generates grounded response citing actual mediators

7. **Return Results** → Response + mediators + sources + metadata

## Performance Considerations

**Embedding Generation:**
- ~100-200ms per text (HuggingFace API call)
- Batch processing recommended for bulk indexing
- Embeddings cached in ChromaDB

**Vector Search:**
- ~10-50ms for similarity search (in-memory)
- Scales to 100k+ mediators efficiently
- Cosine similarity metric

**Total Query Time:**
- Embedding: ~150ms
- Vector search: ~30ms
- MongoDB lookup: ~50ms
- LLM generation: ~1-3s
- **Total: ~2-4 seconds**

## Monitoring

Check vector database health:
```javascript
const stats = await embeddingService.getStats();
console.log(stats);
// {
//   initialized: true,
//   collectionName: 'mediator_profiles',
//   count: 542,
//   model: 'sentence-transformers/all-MiniLM-L6-v2'
// }
```

## Troubleshooting

**ChromaDB not connecting:**
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Restart ChromaDB
docker restart <container_id>
```

**Poor search results:**
- Check similarity threshold (default 0.5)
- Verify embeddings are up to date
- Try hybrid search for better recall

**Slow performance:**
- Check HuggingFace API rate limits
- Consider caching query embeddings
- Use batch indexing for updates

## Active Learning Integration

The RAG system works with Active Learning for continuous improvement:

1. User gets mediator recommendations (via RAG)
2. User provides feedback on results
3. Feedback stored in ConflictFeedback model
4. High-value examples identified
5. Model retrained periodically
6. Improved embeddings/search over time

See `backend/src/models/ConflictFeedback.js` for details.

## Future Enhancements

- [ ] A/B testing RAG vs traditional search
- [ ] Query expansion for better recall
- [ ] Multi-language support
- [ ] Real-time embedding updates
- [ ] Custom fine-tuned embedding model
- [ ] Caching layer for common queries
- [ ] Personalized search (user preferences)

## References

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [RAG Paper](https://arxiv.org/abs/2005.11401)
