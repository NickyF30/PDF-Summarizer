/**
 * index.js — CLI entry point
 * Thin orchestration layer; all logic lives in src/
 */

require('dotenv').config();
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
});
const prompts = require('prompts');
const path = require('path');
const fs = require('fs/promises');
const { ingestPDF, queryPDF } = require('./src/ragPipeline');
const { listIndexedPDFs } = require('./src/vectorStore');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPDFChoices() {
    const files = await fs.readdir('./files');
    return files
        .filter(f => path.extname(f).toLowerCase() === '.pdf')
        .map(f => ({ title: f, value: f }));
}

// ─── Flows ───────────────────────────────────────────────────────────────────

async function runIngest() {
    const choices = await getPDFChoices();
    if (choices.length === 0) {
        console.log('No PDFs found in ./files — add some and try again.');
        return;
    }

    const { files } = await prompts({
        type: 'multiselect',
        name: 'files',
        message: 'Select PDFs to ingest (space to toggle, enter to confirm):',
        choices,
        hint: '- Space to select. Return to submit',
    });

    if (!files?.length) { console.log('Nothing selected.'); return; }

    for (const file of files) {
        await ingestPDF(path.join('./files', file), file);
    }
    console.log('\n✅ Ingestion complete.');
}

async function runQuery() {
    // Let the user scope their question to one PDF or search across all
    const indexed = await listIndexedPDFs();
    if (indexed.length === 0) {
        console.log('No PDFs indexed yet — run "Ingest PDFs" first.');
        return;
    }

    const scopeChoices = [
        { title: '🔎  All indexed PDFs', value: null },
        ...indexed.map(n => ({ title: n, value: n })),
    ];

    const { pdfName } = await prompts({
        type: 'select',
        name: 'pdfName',
        message: 'Scope your question to:',
        choices: scopeChoices,
    });

    const { question } = await prompts({
        type: 'text',
        name: 'question',
        message: 'Your question:',
    });

    if (!question?.trim()) { console.log('No question entered.'); return; }

    const answer = await queryPDF(question, pdfName);
    console.log('\n─── Answer ──────────────────────────────────────────────');
    console.log(answer);
    console.log('─────────────────────────────────────────────────────────\n');
}

// ─── Main menu ───────────────────────────────────────────────────────────────

(async () => {
    console.log('\n📚 PDF RAG — powered by Supabase pgvector + Gemini\n');

    const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            { title: '📥  Ingest PDF(s) into the vector store', value: 'ingest' },
            { title: '💬  Ask a question about your PDFs', value: 'query' },
        ],
    });

    if (action === 'ingest') await runIngest();
    if (action === 'query') await runQuery();
})();