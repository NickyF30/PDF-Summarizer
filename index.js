require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const prompts = require('prompts');
prompts.override(require('yargs').argv);
const pdf = require('pdf-parse');

//promise to await responses
const fs = require('fs/promises');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {

        const examplePrompt = await prompts({
                type: 'text',
                name: 'value',
                message: 'What is your name?'
        });

        const Files = await fs.readdir('./files');
        // Filter for PDF files, case-insensitive, and ensure we only get pdf files
        let pdfs = allFiles.filter(file => path.extname(file).toLowerCase() === '.pdf');

        let choices = pdfs.map(file => ({ title: file, value: file }));

        const pdfPrompt = await prompts({
                type: 'select',
                name: 'value',
                message: 'Select a PDF file to analyze:',
                choices: choices
        });

        

})();