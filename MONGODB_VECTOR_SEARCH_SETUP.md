# MongoDB Atlas Vector Search Setup

## Step 1: Create Vector Search Index in MongoDB Atlas UI

### Instructions:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Navigate to your cluster**:
   - Click on your cluster name
   - Click "Browse Collections"
   - Select database: `fairmediator`
   - Select collection: `mediators`

3. **Create Search Index**:
   - Click on the "Atlas Search" tab (or "Search" tab)
   - Click "Create Search Index"
   - Choose "JSON Editor"

4. **Paste this index definition**:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 384,
         "similarity": "cosine"
       }
     ]
   }
   ```

5. **Name the index**: `mediator_vector_search`

6. **Click "Create Search Index"** and wait for it to build (usually takes 1-2 minutes)

---

## Step 2: Verify Index Creation

Once created, you should see the index status as "Active" in the Atlas UI.

---

## Step 3: Generate Embeddings for Mediators

After the index is created, run this command to generate embeddings:

```bash
cd backend
node src/scripts/initializeVectorDB.js
```

This will:
- ✅ Connect to MongoDB
- ✅ Show current stats (how many mediators need indexing)
- ✅ Generate embeddings for each mediator using HuggingFace
- ✅ Store 384-dimensional vectors in MongoDB
- ✅ Test the vector search

### Optional flags:

```bash
# Show index setup instructions
node src/scripts/initializeVectorDB.js --show-index

# Clear all existing embeddings and re-index
node src/scripts/initializeVectorDB.js --clear

# Re-index all mediators (even if they have embeddings)
node src/scripts/initializeVectorDB.js --reindex
```

---

## Step 4: Test Vector Search

After indexing, the script will automatically test semantic search with a query like:
"employment dispute mediator in California"

If it works, you'll see results with similarity scores!

---

## Troubleshooting

**Error: "Vector search index not found"**
- Make sure you created the index in Atlas UI with the exact name: `mediator_vector_search`
- Wait 1-2 minutes for the index to build
- Refresh the Atlas UI to verify it's "Active"

**Error: "No mediators need indexing"**
- You might not have any mediators in the database yet
- Use `--reindex` flag to re-index all existing mediators

**Error: "HuggingFace API rate limit"**
- The free tier has limits
- The script processes in batches of 10 to stay within limits
- You can run it multiple times to continue indexing

---

## Architecture

**Model**: `sentence-transformers/all-MiniLM-L6-v2`
- Fast and efficient
- 384-dimensional embeddings
- Optimized for semantic similarity

**Index Type**: Vector Search with Cosine Similarity
- Best for finding semantically similar mediators
- Supports RAG (Retrieval-Augmented Generation)
- Free tier compatible (M0 cluster supports up to 10M vectors)

**Usage**: Once indexed, the RAG engine will use vector search to:
1. Find relevant mediators based on user queries
2. Provide context to the AI for better recommendations
3. Enable semantic search (e.g., "mediator who understands tech disputes" finds IP specialists)
