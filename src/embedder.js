/**
 * embedder.js
 * Generates 768-dimensional embeddings via Google's text-embedding-001 model.
 * Processes chunks in batches to stay within rate limits.
 */

const { GoogleGenAI } = require('@google/genai');

const EMBEDDING_MODEL = 'gemini-embedding-001';
const BATCH_SIZE = 20; 

let _ai = null;
function getClient() {
    if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return _ai;
}

async function embedText(text) {
    const ai = getClient();
    const result = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
    });
    return result.embeddings[0].values;
}

async function embedBatch(texts) {
    const ai = getClient();
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i++) {
        process.stdout.write(`  ↻ Embedding chunk ${i + 1} of ${texts.length}...\r`);
        const result = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: texts[i],
        });
        allEmbeddings.push(result.embeddings[0].values);
    }

    process.stdout.write('\n');
    return allEmbeddings;
}

module.exports = { embedText, embedBatch };