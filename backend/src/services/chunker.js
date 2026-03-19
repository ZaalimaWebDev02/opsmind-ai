const chunkText = (pages, chunkSize = 1000, overlap = 100) => {
  const chunks = [];

  for (const page of pages) {

    const text = page.text || "";
    let start = 0;

    while (start < text.length) {

      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();

      // Skip tiny fragments
      if (chunk.length > 50) {
        chunks.push({
          text: chunk,
          pageNumber: page.pageNumber,
          chunkIndex: chunks.length
        });
      }

      start += chunkSize - overlap;
    }
  }

  return chunks;
};

module.exports = { chunkText };