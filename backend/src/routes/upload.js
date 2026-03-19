const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const Document = require('../models/Document');

const { parsePDF } = require('../services/pdfParser');
const { chunkText } = require('../services/chunker');

// ✅ FIXED: Correct destructuring import
const { generateEmbeddingsBatch } = require('../services/embedder');

const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// POST /api/upload
router.post('/', auth, upload.single('pdf'), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No PDF uploaded" });
  }

  const doc = await Document.create({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    status: 'processing'
  });

  res.json({
    message: 'Upload received, processing...',
    docId: doc._id
  });

  // Async pipeline
  (async () => {
    try {

      const pages = await parsePDF(req.file.path);

      const rawChunks = chunkText(pages);

      const embeddedChunks = await generateEmbeddingsBatch(rawChunks);

      doc.chunks = embeddedChunks.map(c => ({
        ...c,
        metadata: {
          fileName: req.file.originalname
        }
      }));

      doc.totalChunks = embeddedChunks.length;
      doc.status = 'ready';

      await doc.save();

      console.log(`✅ Indexed ${embeddedChunks.length} chunks for ${req.file.originalname}`);

    } catch (err) {

      console.error("❌ Pipeline error:", err);

      doc.status = 'error';
      await doc.save();

    }
  })();

});

module.exports = router;