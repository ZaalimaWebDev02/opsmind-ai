const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

const Document   = require('../models/Document');
const { parsePDF }               = require('../services/pdfParser');
const { chunkText }              = require('../services/chunker');
const { generateEmbeddingsBatch } = require('../services/embedder');
const { clearCache }             = require('../services/vectorSearch');
const auth       = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${uuidv4()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /api/upload
router.post('/', auth, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name: pdf' });
  }

  try {
    const doc = await Document.create({
      fileName:     req.file.filename,
      originalName: req.file.originalname,
      fileSize:     req.file.size,
      status:       'processing',
    });

    res.json({
      success:  true,
      message:  'Upload received. Embedding pipeline started.',
      docId:    doc._id,
      fileName: req.file.originalname,
    });

    // Background pipeline
    (async () => {
      try {
        console.log(`\n🚀 Pipeline: ${req.file.originalname}`);
        const pages          = await parsePDF(req.file.path);
        const rawChunks      = chunkText(pages);
        const embeddedChunks = await generateEmbeddingsBatch(rawChunks);

        doc.chunks = embeddedChunks.map(c => ({
          chunkIndex:  c.chunkIndex,
          text:        c.text,
          pageNumber:  c.pageNumber,
          embedding:   c.embedding,
          metadata:    { fileName: req.file.originalname },
        }));
        doc.totalChunks = embeddedChunks.length;
        doc.totalPages  = pages.length;
        doc.status      = 'ready';
        await doc.save();

        // Clear query cache so new content is immediately searchable
        clearCache();

        console.log(`✅ Indexed ${embeddedChunks.length} chunks for ${req.file.originalname}`);
      } catch (err) {
        console.error(`❌ Pipeline failed: ${err.message}`);
        doc.status       = 'error';
        doc.errorMessage = err.message;
        await doc.save();
      }
    })();

  } catch (err) {
    res.status(500).json({ error: 'Upload failed', message: err.message });
  }
});

// GET /api/upload/status/:docId
router.get('/status/:docId', auth, async (req, res) => {
  try {
    const doc = await Document.findById(
      req.params.docId,
      'originalName status totalChunks totalPages errorMessage uploadedAt'
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;