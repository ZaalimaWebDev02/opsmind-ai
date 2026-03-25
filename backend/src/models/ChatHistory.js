const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'assistant'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  sources: [
    {
      fileName: String,
      pageNumber: Number,
      chunkText: String,
      score: Number,
    },
  ],
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
});

const chatSchema = new mongoose.Schema(
  {
    sessionId: { 
      type: String, 
      required: true,
      index: true   // ✅ better than unique
    },
    messages: [messageSchema],
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model('ChatHistory', chatSchema);