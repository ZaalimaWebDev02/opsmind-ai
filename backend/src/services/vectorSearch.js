const Document = require('../models/Document');
const { generateEmbedding } = require('./embedder');

/**
 * Retrieves the most semantically relevant SOP chunks from MongoDB
 * using Atlas Vector Search ($vectorSearch operator).
 *
 * @param {string} query  - User's natural language question
 * @param {number} topK   - Max chunks to return (default 5)
 * @returns {Promise<Array<{text, pageNumber, fileName, score}>>}
 */
const retrieveRelevantChunks = async (query, topK = 5) => {
  const t0 = Date.now();

  // Step 1: Convert query into 3072-dim vector
  const queryEmbedding = await generateEmbedding(query);
  console.log(`   Embedding query: ${Date.now() - t0}ms`);

  // Step 2: Run Atlas Vector Search aggregation
  const results = await Document.aggregate([
    {
      $vectorSearch: {
        index:         'vector_index',
        queryVector:   queryEmbedding,
        path:          'chunks.embedding',
        numCandidates: topK * 10,
        limit:         topK * 3,
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

  console.log(`   Atlas search: ${Date.now() - t0}ms | Docs: ${results.length}`);

  // Step 3: Flatten chunks from all matched documents
  const chunks = [];
  for (const doc of results) {
    for (const chunk of doc.chunks) {
      chunks.push({
        text:       chunk.text,
        pageNumber: chunk.pageNumber,
        fileName:   doc.originalName,
        score:      doc.score,
      });
    }
  }

  // Step 4: Filter by minimum confidence score
  const MIN_SCORE = 0.5;
  const filtered  = chunks.filter(c => c.score >= MIN_SCORE);

  if (filtered.length === 0) {
    console.log(`   No chunks passed score threshold (${MIN_SCORE})`);
    return [];
  }

  const topChunks = filtered.slice(0, topK);
  console.log(`   Returning ${topChunks.length} chunks (top score: ${topChunks[0]?.score?.toFixed(4)})`);
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
You have searched the knowledge base but found NO relevant SOP documents.
You MUST respond with exactly:
"I don't have information about that in the current SOPs."

QUESTION: ${query}`;
  }

  const contextBlocks = chunks.map((c, i) =>
    `[Source ${i + 1}: ${c.fileName}, Page ${c.pageNumber}]\n${c.text}`
  );

  return `You are OpsMind AI, a corporate SOP knowledge assistant.

STRICT RULES:
1. Answer ONLY using the CONTEXT below.
2. Always cite your source: "According to [filename] (Page X)..."
3. If answer is not in CONTEXT say exactly: "I don't have information about that in the current SOPs."
4. Never guess. Never make up facts.
5. Use numbered steps when the answer is a process.

CONTEXT:
${contextBlocks.join('\n\n---\n\n')}

QUESTION: ${query}

ANSWER:`;
};

module.exports = { retrieveRelevantChunks, buildContextWindow };