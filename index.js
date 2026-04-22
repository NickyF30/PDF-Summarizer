require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const prompts = require('prompts');
prompts.override(require('yargs').argv);
const fs = require('fs/promises');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {

    const files = await fs.readdir('./files');
    // Filter for PDF files, case-insensitive, and ensure we only get pdf files
    let pdfs = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

    let choices = pdfs.map(file => ({ title: file, value: file }));

    //user selects a pdf file to analyze
    const pdfPrompt = await prompts({
        type: 'select',
        name: 'selectedPDF',
        message: 'Select a PDF file to analyze:',
        choices: choices
    });

    // user types their questoon about the pdf
    const pdfSelected = await prompts({
        type: 'text',
        name: 'userQuestion',
        message: 'What do you want to know about the PDF?',
    })

    const filePath = path.join('./files', pdfPrompt.selectedPDF);
    
    const uploadResult = await ai.files.upload({
        file: filePath,
        config: {
            mimeType: "application/pdf",
            displayName: pdfPrompt.selectedPDF,
        }
    });

    const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                fileData: {
                    mimeType: uploadResult.mimeType,
                    fileUri: uploadResult.uri,
                },
            },
            { text: pdfSelected.userQuestion }, 
        ],
    });

    // Print the result
    console.log("\n--- ANSWER ---");
    console.log(result.text);

})();