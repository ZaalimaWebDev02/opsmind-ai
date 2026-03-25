require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find any ready document with chunks
  const doc = await Document.findOne({ status: 'ready' }).select('originalName totalChunks chunks');

  if (!doc) {
    console.log('NO READY DOCUMENTS FOUND');
    console.log('Upload a PDF first');
    process.exit(1);
  }

  console.log('Doc name    :', doc.originalName);
  console.log('Total chunks:', doc.totalChunks);
  console.log('Chunks array:', doc.chunks.length);

  if (doc.chunks.length === 0) {
    console.log('CHUNKS ARRAY IS EMPTY - pipeline failed during upload');
    process.exit(1);
  }

  const first = doc.chunks[0];
  console.log('Chunk 0 text:', first.text.slice(0, 80));
  console.log('Embedding exists:', Array.isArray(first.embedding));
  console.log('Embedding dims  :', first.embedding ? first.embedding.length : 'MISSING');
  console.log('First 3 values  :', first.embedding ? first.embedding.slice(0, 3) : 'MISSING');

  process.exit(0);
});