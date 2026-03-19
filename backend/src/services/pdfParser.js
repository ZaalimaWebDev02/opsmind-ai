const pdfParse = require('pdf-parse');
const fs = require('fs');

const parsePDF = async (filePath) => {

  try {

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const rawText = data.text || "";
    const totalPages = data.numpages || 1;

    const lines = rawText.split('\n');
    const linesPerPage = Math.ceil(lines.length / totalPages);

    const pages = [];

    for (let p = 0; p < totalPages; p++) {

      const pageLines = lines.slice(
        p * linesPerPage,
        (p + 1) * linesPerPage
      );

      pages.push({
        pageNumber: p + 1,
        text: pageLines.join('\n').trim()
      });
    }

    return pages;

  } catch (err) {

    console.error("PDF parsing failed:", err);
    throw err;

  }
};

module.exports = { parsePDF };