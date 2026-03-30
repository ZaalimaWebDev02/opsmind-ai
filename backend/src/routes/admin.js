const express  = require('express');
const Document = require('../models/Document');
const auth     = require('../middleware/auth');
const fs       = require('fs');
const path     = require('path');
const { clearCache } = require('../services/vectorSearch');

const router = express.Router();

// GET /api/admin/documents
router.get('/documents', auth, async (req, res) => {
  try {
    const docs = await Document.find(
      {},
      'originalName fileName uploadedAt totalChunks totalPages fileSize status errorMessage'
    ).sort({ uploadedAt: -1 });
    res.json({ count: docs.length, documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/documents/:id
router.delete('/documents/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(__dirname, '../../uploads', doc.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.deleteOne();
    clearCache();

    res.json({
      success: true,
      message: `Deleted "${doc.originalName}" and cleared ${doc.totalChunks} vectors`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/health
router.get('/health', auth, async (req, res) => {
  try {
    const totalDocs   = await Document.countDocuments({ status: 'ready' });
    const processing  = await Document.countDocuments({ status: 'processing' });
    const errored     = await Document.countDocuments({ status: 'error' });
    const aggResult   = await Document.aggregate([
      { $match: { status: 'ready' } },
      { $group: { _id: null, total: { $sum: '$totalChunks' } } },
    ]);

    res.json({
      status:       'ok',
      readyDocs:    totalDocs,
      processing:   processing,
      errored:      errored,
      totalVectors: aggResult[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/cache/clear
router.post('/cache/clear', auth, (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Query cache cleared' });
});

module.exports = router;