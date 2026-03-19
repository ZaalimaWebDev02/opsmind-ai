let extractor = null;

// ✅ Load model using dynamic import
const loadModel = async () => {
  if (!extractor) {
    const { pipeline } = await import('@xenova/transformers');

    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );

    console.log("✅ Embedding model loaded");
  }
};

// Generate embedding
const generateEmbedding = async (text) => {
  await loadModel();

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
};

// Batch embeddings
const generateEmbeddingsBatch = async (chunks) => {
  const embedded = [];

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.text);

      embedded.push({
        ...chunk,
        embedding,
      });

    } catch (err) {
      console.error(
        `Embedding failed for chunk ${chunk.chunkIndex}:`,
        err.message
      );
    }
  }

  return embedded;
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
};