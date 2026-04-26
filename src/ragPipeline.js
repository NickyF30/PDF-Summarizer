
const path = require('path');
const { parsePDF } = require('./pdfParser');
const { embedText, embedBatch } = require('./embedder');
const { isAlreadyIndexed, storeChunks, similaritySearch } = require('./vectorStore');
const { GoogleGenAI } = require('@google/genai');

const GENERATION_MODEL = 'gemini-3-flash-preview';
const TOP_K_CHUNKS = 6;   

/**
 *  1. Hash file -> check Supabase 
 *  2. Parse + chunk text
 *  3. Batch embed all chunks
 *  4. Store in Supabase pgvector
 */
async function ingestPDF(filePath, pdfName) {
  console.log(`\n📄 Ingesting: ${pdfName}`);

  const { hash, chunks } = await parsePDF(filePath);

  if (await isAlreadyIndexed(hash)) {
    console.log(`  ⏭  Already indexed (hash match) — skipping embedding step`);
    return { skipped: true, chunkCount: chunks.length };
  }

  console.log(`  🔢 Generating embeddings…`);
  const embeddings = await embedBatch(chunks);

  const rows = chunks.map((content, i) => ({
    pdfName,
    pdfHash: hash,
    chunkIndex: i,
    content,
    embedding: embeddings[i],
  }));

  await storeChunks(rows);
  return { skipped: false, chunkCount: chunks.length };
}

async function queryPDF(question, pdfName = null) {
  console.log(`\n🔍 Retrieving relevant context…`);

  const queryEmbedding = await embedText(question);
  const chunks = await similaritySearch(queryEmbedding, { topK: TOP_K_CHUNKS, pdfName });

  if (chunks.length === 0) {
    return 'No relevant content found. Make sure the PDF has been ingested first.';
  }

  const contextBlock = chunks
    .map((c, i) => `[Chunk ${i + 1} | similarity: ${c.similarity.toFixed(3)}]\n${c.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are a precise document analyst. Answer the user's question using ONLY the provided context.
If the answer isn't in the context, say so — do not hallucinate.

## Context (from: ${pdfName ?? 'all indexed PDFs'})
${contextBlock}

## Question
${question}

## Answer`;

  console.log(`  ✔ Found ${chunks.length} relevant chunks (top similarity: ${chunks[0].similarity.toFixed(3)})`);
  console.log(`  🤖 Generating answer…\n`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{ text: prompt }],
  });

  return result.text;
}

module.exports = { ingestPDF, queryPDF };