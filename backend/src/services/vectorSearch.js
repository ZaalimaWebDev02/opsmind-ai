const Document = require('../models/Document');
const { generateEmbedding } = require('./embedder');

// Simple in-memory cache for repeated queries
// Key = query string, Value = { chunks, timestamp }
const queryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCached = (query) => {
  const entry = queryCache.get(query.toLowerCase().trim());
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    queryCache.delete(query.toLowerCase().trim());
    return null;
  }
  return entry.chunks;
};

const setCache = (query, chunks) => {
  // Limit cache size to 100 entries
  if (queryCache.size >= 100) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
  queryCache.set(query.toLowerCase().trim(), {
    chunks,
    timestamp: Date.now(),
  });
};

/**
 * Retrieves the most semantically relevant SOP chunks from MongoDB
 * using Atlas Vector Search. Results are cached for 5 minutes.
 *
 * @param {string} query  - User's natural language question
 * @param {number} topK   - Max chunks to return (default 5)
 * @returns {Promise<Array<{text, pageNumber, fileName, score}>>}
 */
const retrieveRelevantChunks = async (query, topK = 5) => {
  const t0 = Date.now();

  // Check cache first
  const cached = getCached(query);
  if (cached) {
    console.log(`   Cache hit for: "${query.slice(0, 40)}" (${Date.now() - t0}ms)`);
    return cached;
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  console.log(`   Embedding: ${Date.now() - t0}ms`);

  let results = [];

  // Try $vectorSearch first (Atlas Vector Search index)
  try {
    results = await Document.aggregate([
      {
        $vectorSearch: {
          index:         'vector_index',
          queryVector:   queryEmbedding,
          path:          'chunks.embedding',
          numCandidates: topK * 15,
          limit:         topK * 5,
        },
      },
      {
        $project: {
          originalName: 1,
          chunks:       1,
          score:        { $meta: 'vectorSearchScore' },
        },
      },
    ]);
    console.log(`   $vectorSearch: ${Date.now() - t0}ms | docs: ${results.length}`);
  } catch (err) {
    console.log(`   $vectorSearch failed (${err.message.slice(0, 50)}), trying $search...`);
    try {
      results = await Document.aggregate([
        {
          $search: {
            index: 'vector_index',
            knnBeta: {
              vector: queryEmbedding,
              path:   'chunks.embedding',
              k:      topK * 5,
            },
          },
        },
        { $limit: topK * 5 },
        {
          $project: {
            originalName: 1,
            chunks:       1,
            score:        { $meta: 'searchScore' },
          },
        },
      ]);
      console.log(`   $search fallback: ${Date.now() - t0}ms | docs: ${results.length}`);
    } catch (err2) {
      console.error(`   Both search methods failed: ${err2.message}`);
      return [];
    }
  }

  // Flatten all chunks from matched documents
  const chunks = [];
  for (const doc of results) {
    for (const chunk of doc.chunks) {
      chunks.push({
        text:       chunk.text,
        pageNumber: chunk.pageNumber,
        fileName:   doc.originalName,
        score:      doc.score || 0,
      });
    }
  }

  // Sort by score and take top K (no hard threshold — let LLM decide)
  chunks.sort((a, b) => b.score - a.score);
  const topChunks = chunks.slice(0, topK);

  console.log(`   Retrieved ${topChunks.length} chunks | top score: ${topChunks[0]?.score?.toFixed(4) || 'n/a'} | total: ${Date.now() - t0}ms`);

  // Cache result
  setCache(query, topChunks);

  return topChunks;
};

/**
 * Builds the complete prompt sent to Gemini.
 *
 * @param {string} query   - User's original question
 * @param {Array}  chunks  - Retrieved chunks from retrieveRelevantChunks()
 * @returns {string}         Complete prompt string
 */
const buildContextWindow = (query, chunks) => {
  if (!chunks || chunks.length === 0) {
    return `You are OpsMind AI, a corporate SOP knowledge assistant.
You searched the knowledge base but found NO relevant SOP documents for this question.
Respond with exactly: "I don't have information about that in the current SOPs."

QUESTION: ${query}`;
  }

  const contextBlocks = chunks.map((c, i) =>
    `[Source ${i + 1}: ${c.fileName}, Page ${c.pageNumber}]\n${c.text}`
  );

  return `You are OpsMind AI, a corporate SOP knowledge assistant.

STRICT RULES:
1. Answer ONLY using the CONTEXT below. No outside knowledge.
2. Always cite your source: "According to [filename] (Page X)..."
3. If not in CONTEXT, say exactly: "I don't have information about that in the current SOPs."
4. Never guess. Never make up facts, steps, numbers, or names.
5. Use numbered steps when the answer is a process.
6. Be concise and professional.

CONTEXT:
${contextBlocks.join('\n\n---\n\n')}

QUESTION: ${query}

ANSWER:`;
};

/**
 * Clears the query cache (useful after new documents are uploaded)
 */
const clearCache = () => {
  queryCache.clear();
  console.log('Query cache cleared');
};

module.exports = { retrieveRelevantChunks, buildContextWindow, clearCache };