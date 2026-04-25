/**
 * pdfParser.js
 * Extracts raw text from PDF and splits it into overlapping chunks.
 * Overlap ensures context isnt lost at chunk boundaries.
 */

const pdfParse = require('pdf-parse');
const fs = require('fs/promises');
const crypto = require('crypto');

const CHUNK_SIZE = 500;   
const CHUNK_OVERLAP = 50;   

/**
 * Returns the SHA-256 hex digest of a file — used as a cache key so we never
 * embed a PDF we've already processed.
 */
async function hashFile(filePath) {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
 
function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    // Normalise whitespace; split into words
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const chunks = [];
    const step = chunkSize - overlap;

    for (let start = 0; start < words.length; start += step) {
        const chunk = words.slice(start, start + chunkSize).join(' ');
        if (chunk.trim().length > 0) chunks.push(chunk);
        if (start + chunkSize >= words.length) break;
    }

    return chunks;
}

async function parsePDF(filePath) {
    const [buffer, hash] = await Promise.all([
        fs.readFile(filePath),
        hashFile(filePath),
    ]);

    const { text } = await pdfParse(buffer);

    if (!text || text.trim().length === 0) {
        throw new Error(`No extractable text found in ${filePath}. Is it a scanned PDF?`);
    }

    const chunks = splitIntoChunks(text);
    console.log(`  ✔ Parsed ${chunks.length} chunks from PDF`);

    return { hash, chunks };
}

module.exports = { parsePDF, hashFile };