const express = require('express');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();
//console.log('✅ Admin routes loaded');
// ✅ NEW: Admin Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'admin',
    message: 'Admin routes working',
    time: new Date().toISOString(),
  });
});
// GET /api/admin/documents
router.get('/documents', auth, async (req, res) => {
  //console.log('🔥 HIT /api/admin/documents');
  const docs = await Document.find({}, 'originalName uploadedAt totalChunks status');
  res.json(docs);
});

// DELETE /api/admin/documents/:id
router.delete('/documents/:id', auth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  // Remove file from disk
  const filePath = path.join('./uploads', doc.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await doc.deleteOne();
  res.json({ message: 'Document deleted and index updated' });
});

module.exports = router;