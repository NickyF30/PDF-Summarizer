# pdf-rag-summarizer

A Retrieval-Augmented Generation (RAG) pipeline for querying PDF documents using natural language. Ask questions about your PDFs and get answers grounded in the actual document content - no hallucinations, no guessing, just precise retrieval.

Built with Google Gemini embeddings, Supabase pgvector, and Node.js.

---

## How it works

1. **Ingest** - PDFs are parsed, split into overlapping text chunks, and embedded using Google Gemini. Embeddings are stored in a Supabase pgvector table. Files are SHA-256 hashed so already-indexed PDFs are never re-embedded.
2. **Query** - Your question is embedded using the same model. The most semantically similar chunks are retrieved via cosine similarity search and injected into a prompt. Gemini generates an answer grounded only in that context.

```
PDF → parse → chunk → embed → Supabase pgvector
                                      ↓
Question → embed → similarity search → context → Gemini → answer
```

---

## Stack

| Layer          | Technology                             |
|----------------|----------------------------------------|
| Embeddings     | Google Gemini (`gemini-embedding-001`) |
| Generation     | Google Gemini (`gemini-3-flash-preview`) |
| Vector store   | Supabase pgvector                      |
| PDF parsing    | pdf-parse                              |
| Runtime        | Node.js                                |

---

## Project structure

```
pdf-rag-summarizer/
├── src/
│   ├── pdfParser.js      # PDF text extraction and overlapping chunk splitting
│   ├── embedder.js       # Gemini embedding calls (sequential to respect rate limits)
│   ├── vectorStore.js    # Supabase CRUD and cosine similarity search
│   └── ragPipeline.js    # Ingest and query orchestration
├── files/                # Drop PDFs here before ingesting
├── index.js              # CLI entry point
├── .env.example
└── package.json
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/NickyF30/PDF-rag-summarizer.git
cd rag-project
npm install
npm install pdf-parse@1.1.1
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

- **Gemini API key** - [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase keys** - Project Settings → API. Use the `service_role` secret key, not the anon key.

### 3. Set up the database

Run `supabase/setup.sql` in your Supabase project's SQL editor. This enables the pgvector extension, creates the `pdf_chunks` table, and registers the `match_chunks` RPC function used for similarity search.

### 4. Add PDFs

Drop any text-based PDF files into the `files/` directory.

### 5. Run

```bash
node index.js
```

---

## Usage

The CLI presents two options:

###  Ingest

Select one or more PDFs to parse and embed. Each PDF is split into overlapping 500-word chunks with a 50-word overlap to preserve context across boundaries. Already-indexed files are detected by SHA-256 hash and skipped automatically.

###  Query

Ask a question, scoped to a specific PDF or across all indexed documents. The pipeline embeds your question, retrieves the top 6 most semantically relevant chunks, and generates a grounded answer using Gemini.

---

## Notes

- PDFs must contain extractable text. Scanned or image-based PDFs are not supported.
- The `SUPABASE_SERVICE_KEY` bypasses Row Level Security and should only be used server-side - never expose it in a frontend.
- The free Gemini API tier has per-minute rate limits. The embedder processes chunks sequentially to avoid connection errors.
- The pgvector index is omitted for >2000 dimensions - queries use a sequential scan which is fine for small document collections.
