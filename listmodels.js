// listmodels.js
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  for await (const model of response) {
    console.log(model.name, '|', model.supportedActions);
  }
})();