require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

// The client automatically looks for GEMINI_API_KEY in your env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
    try {
        const response = await ai.models.generateContent({
            // Use the 3.1 Flash model for the best speed/intelligence balance
            model: "gemini-3-flash-preview", 
            contents: "What is the capital of Canada?",
            config: {
                // You can add your "friendly assistant" persona here
                systemInstruction: "I am a friendly and helpful assistant. Ask me anything!"
            }
        });

        console.log(response.text);
    } catch (error) {
        console.error("Error generating content:", error);
    }
})();