require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");
const prompts = require('prompts');
prompts.override(require('yargs').argv);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {

        const examplePrompt = await prompts({
                type: 'text',
                name: 'value',
                message: 'What is your name?'
        });

        console.log(examplePrompt.value);

})();