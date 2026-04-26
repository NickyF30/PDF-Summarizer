/**
 * vectorStore.js
 * All Supabase interactions: inserting chunks, checking for duplicates,
 * and running cosine-similarity search via the match_chunks RPC.
 */

const { createClient } = require('@supabase/supabase-js');

let _client = null;
function getClient() {
    if (!_client) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
        }
        _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
    return _client;
}

async function isAlreadyIndexed(pdfHash) {
    const { count, error } = await getClient()
        .from('pdf_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('pdf_hash', pdfHash);

    if (error) throw error;
    return count > 0;
}

async function storeChunks(rows) {
    const { error } = await getClient()
        .from('pdf_chunks')
        .insert(
            rows.map(r => ({
                pdf_name: r.pdfName,
                pdf_hash: r.pdfHash,
                chunk_index: r.chunkIndex,
                content: r.content,
                embedding: JSON.stringify(r.embedding),
            }))
        );

    if (error) throw error;
    console.log(`  ✔ Stored ${rows.length} chunks in Supabase`);
}

async function similaritySearch(queryEmbedding, { topK = 5, pdfName = null } = {}) {
    const { data, error } = await getClient().rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_count: topK,
        filter_pdf_name: pdfName,
    });

    if (error) throw error;
    return data.map(row => ({
        content: row.content,
        pdfName: row.pdf_name,
        similarity: row.similarity,
    }));
}

async function listIndexedPDFs() {
    const { data, error } = await getClient()
        .from('pdf_chunks')
        .select('pdf_name')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return [...new Set(data.map(r => r.pdf_name))];
}

module.exports = { isAlreadyIndexed, storeChunks, similaritySearch, listIndexedPDFs };