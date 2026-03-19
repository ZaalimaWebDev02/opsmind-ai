const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  chunkIndex: {
    type: Number,
    required: true
  },

  text: {
    type: String,
    required: true
  },

  pageNumber: {
    type: Number,
    default: 1
  },

  // Vector embedding (Gemini ~768 dimensions)
  embedding: {
    type: [Number],
    default: []
  },

  metadata: {
    fileName: String,
    section: String
  }

}, { _id: false }); // avoid extra id for each chunk


const documentSchema = new mongoose.Schema({

  fileName: {
    type: String,
    required: true
  },

  originalName: {
    type: String,
    required: true
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  },

  totalChunks: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  },

  chunks: [chunkSchema]

}, {
  timestamps: true
});


// Helpful indexes
documentSchema.index({ status: 1 });
documentSchema.index({ "chunks.pageNumber": 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;