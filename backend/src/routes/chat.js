const express      = require('express');
const { v4: uuidv4 } = require('uuid');
const ChatHistory  = require('../models/ChatHistory');
const { retrieveRelevantChunks, buildContextWindow } = require('../services/vectorSearch');
const { streamAnswer } = require('../services/llmService');

const router = express.Router();


// ── POST /api/chat ───────────────────────────────────────────────────────────
/**
 * Main chat endpoint. Uses Server-Sent Events (SSE) to stream
 * the LLM response token by token to the client.
 *
 * Flow:
 * 1. Embed the user query
 * 2. Retrieve top-K relevant SOP chunks from Atlas Vector Search
 * 3. Send source citations to client immediately (event: sources)
 * 4. Build context prompt and stream Gemini answer (event: token)
 * 5. Save full conversation to MongoDB
 * 6. Send done signal (event: done)
 */
router.post('/', async (req, res) => {
  const { query, sessionId = uuidv4() } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'query field is required' });
  }

  // Set SSE headers — keeps connection open for streaming
  res.setHeader('Content-Type',                'text/event-stream');
  res.setHeader('Cache-Control',               'no-cache');
  res.setHeader('Connection',                  'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Helper to send a named SSE event
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const t0 = Date.now();

    // ── Step 1: Vector retrieval ─────────────────────────────────────────────
    console.log(`\n💬 Query: "${query}"`);
    const chunks = await retrieveRelevantChunks(query);
    console.log(`   Retrieval total: ${Date.now() - t0}ms`);

    // ── Step 2: Send sources to client immediately ───────────────────────────
    sendEvent('sources', {
      sources: chunks.map(c => ({
        fileName:   c.fileName,
        pageNumber: c.pageNumber,
        preview:    c.text.slice(0, 150),
        score:      c.score,
      })),
    });

    // ── Step 3: Build context window ─────────────────────────────────────────
    const contextPrompt = buildContextWindow(query, chunks);

    // ── Step 4: Stream LLM answer ────────────────────────────────────────────
    let fullAnswer = '';
    const t1 = Date.now();

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

    // ── Step 5: Persist to chat history ──────────────────────────────────────
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
                  fileName:  c.fileName,
                  pageNumber: c.pageNumber,
                  chunkText: c.text.slice(0, 200),
                  score:     c.score,
                })),
              },
            ],
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // ── Step 6: Signal completion ─────────────────────────────────────────────
    sendEvent('done', { sessionId, totalTime: Date.now() - t0 });
    res.end();

    console.log(`   ✅ Done. Total: ${Date.now() - t0}ms\n`);

  } catch (err) {
    console.error('Chat route error:', err.message);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// ── GET /api/chat/history/:sessionId ────────────────────────────────────────
router.get('/history/:sessionId', async (req, res) => {
  try {
    const history = await ChatHistory.findOne(
      { sessionId: req.params.sessionId },
      'sessionId messages createdAt updatedAt'
    );
    res.json(history || { sessionId: req.params.sessionId, messages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/chat/sessions ───────────────────────────────────────────────────
// List all chat sessions (admin use)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatHistory.find(
      {},
      'sessionId createdAt updatedAt'
    ).sort({ updatedAt: -1 }).limit(50);
    res.json({ count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;