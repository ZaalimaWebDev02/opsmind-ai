const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Correct model names for your API key
// models/gemini-embedding-001 = 3072 dims
// models/gemini-embedding-2-preview = latest preview
const EMBEDDING_MODEL = 'models/gemini-embedding-001';

/**
 * Generates a single embedding vector for a text string.
 * Uses gemini-embedding-001 which outputs 3072-dimensional vectors.
 *
 * @param {string} text
 * @returns {Promise<number[]>} Array of 3072 floats
 */
const generateEmbedding = async (text) => {
  const model  = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;  // array of 3072 floats
};

/**
 * Generates embeddings for an array of chunks in sequence.
 * Rate limited to 1 request/sec for free tier (60 req/min limit).
 *
 * @param {Array<{text, pageNumber, chunkIndex}>} chunks
 * @returns {Promise<Array<{...chunk, embedding}>>}
 */
const generateEmbeddingsBatch = async (chunks) => {
  const embedded = [];
  const total    = chunks.length;

  console.log(`\n🔢 Embedding ${total} chunks using ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      const embedding = await generateEmbedding(chunk.text);
      embedded.push({ ...chunk, embedding });

      if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
        console.log(`   ↳ ${i + 1}/${total} chunks embedded`);
      }

      // Rate limit: 60 req/min on free tier — wait 1100ms between requests
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 1100));
      }

    } catch (err) {
      console.error(`❌ Embedding failed for chunk ${chunk.chunkIndex}:`, err.message);

      // If quota exceeded, wait 60s and retry once
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.log('   ⏳ Rate limit hit — waiting 60 seconds...');
        await new Promise(r => setTimeout(r, 60000));
        try {
          const embedding = await generateEmbedding(chunk.text);
          embedded.push({ ...chunk, embedding });
          console.log(`   ✅ Retry succeeded for chunk ${chunk.chunkIndex}`);
        } catch (retryErr) {
          console.error(`   Retry also failed: ${retryErr.message}`);
        }
      }
    }
  }

  console.log(`✅ Successfully embedded ${embedded.length}/${total} chunks\n`);
  return embedded;
};

module.exports = { generateEmbedding, generateEmbeddingsBatch };