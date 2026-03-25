require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');
const { generateEmbedding } = require('./src/services/embedder');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Step 1: Generating query embedding...');
  const vec = await generateEmbedding('How do I process a refund?');
  console.log('Query vector dims:', vec.length);

  console.log('\nStep 2: Running $vectorSearch...');
  try {
    const results = await Document.aggregate([
      {
        $vectorSearch: {
          index:         'vector_index',
          queryVector:   vec,
          path:          'chunks.embedding',
          numCandidates: 50,
          limit:         5,
        },
      },
      {
        $project: {
          originalName: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    console.log('Results:', results.length);
    results.forEach(r => console.log(' -', r.originalName, '| score:', r.score));

    if (results.length === 0) {
      console.log('\nZERO RESULTS. Running diagnostics...');
      const total   = await Document.countDocuments();
      const ready   = await Document.countDocuments({ status: 'ready' });
      const sample  = await Document.findOne({ status: 'ready' });
      console.log('Total docs    :', total);
      console.log('Ready docs    :', ready);
      console.log('Sample dims   :', sample?.chunks?.[0]?.embedding?.length);
      console.log('\nFIX: Delete all docs and re-upload AFTER index is READY in Atlas');
    }
  } catch (err) {
    console.log('$vectorSearch failed:', err.message);
    console.log('\nTrying $search fallback...');
    try {
      const results2 = await Document.aggregate([
        {
          $search: {
            index: 'vector_index',
            knnBeta: {
              vector: vec,
              path:   'chunks.embedding',
              k:      5,
            },
          },
        },
        { $limit: 5 },
        {
          $project: {
            originalName: 1,
            score: { $meta: 'searchScore' },
          },
        },
      ]);
      console.log('$search results:', results2.length);
      results2.forEach(r => console.log(' -', r.originalName, '| score:', r.score));
    } catch (err2) {
      console.log('$search also failed:', err2.message);
      console.log('\nBOTH search methods failed.');
      console.log('Check Atlas Search index exists and is READY');
    }
  }

  process.exit(0);
});