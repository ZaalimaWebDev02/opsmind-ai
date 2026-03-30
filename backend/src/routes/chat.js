const express      = require('express');
const { v4: uuidv4 } = require('uuid');
const ChatHistory  = require('../models/ChatHistory');
const { retrieveRelevantChunks, buildContextWindow } = require('../services/vectorSearch');
const { streamAnswer } = require('../services/llmService');

const router = express.Router();

// POST /api/chat — SSE streaming response
router.post('/', async (req, res) => {
  const { query, sessionId = uuidv4() } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'query field is required' });
  }

  res.setHeader('Content-Type',                'text/event-stream');
  res.setHeader('Cache-Control',               'no-cache');
  res.setHeader('Connection',                  'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const t0 = Date.now();

  try {
    console.log(`\n💬 "${query.slice(0, 60)}"`);

    // Step 1: Retrieve relevant chunks
    const chunks = await retrieveRelevantChunks(query);
    const t1     = Date.now();
    console.log(`   Retrieval: ${t1 - t0}ms | chunks: ${chunks.length}`);

    // Step 2: Send sources immediately
    sendEvent('sources', {
      sources: chunks.map(c => ({
        fileName:   c.fileName,
        pageNumber: c.pageNumber,
        preview:    c.text.slice(0, 200),
        score:      c.score,
      })),
    });

    // Step 3: Build context + stream answer
    const contextPrompt = buildContextWindow(query, chunks);
    let   fullAnswer    = '';

    await streamAnswer(
      contextPrompt,
      (token) => {
        fullAnswer += token;
        sendEvent('token', { token });
      },
      () => {
        console.log(`   LLM stream: ${Date.now() - t1}ms`);
      }
    );

    // Step 4: Persist to chat history
    await ChatHistory.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user',      content: query },
              {
                role:    'assistant',
                content: fullAnswer,
                sources: chunks.map(c => ({
                  fileName:   c.fileName,
                  pageNumber: c.pageNumber,
                  chunkText:  c.text.slice(0, 200),
                  score:      c.score,
                })),
              },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );

    const totalMs = Date.now() - t0;
    console.log(`   ✅ Done: ${totalMs}ms total`);

    sendEvent('done', { sessionId, totalMs });
    res.end();

  } catch (err) {
    console.error('Chat error:', err.message);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ sessionId: req.params.sessionId });
    res.json(history || { sessionId: req.params.sessionId, messages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions — list all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatHistory.find({}, 'sessionId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:sessionId — clear a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    await ChatHistory.deleteOne({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;