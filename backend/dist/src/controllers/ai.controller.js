"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIContent = void 0;
const groq_client_1 = __importDefault(require("../services/groq.client"));
const generateAIContent = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        let responseText = '';
        let retries = 3;
        while (retries > 0) {
            try {
                const chatCompletion = await groq_client_1.default.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' }
                });
                responseText = chatCompletion.choices[0]?.message?.content || '{}';
                break; // Success
            }
            catch (err) {
                const status = err?.status;
                const isTransient = status === 429 || status === 503 || status === 500 || !status;
                if (isTransient && retries > 1) {
                    retries--;
                    console.warn(`Groq API error (status: ${status || 'unknown'}). Retrying... (${retries} left)`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                else {
                    throw err;
                }
            }
        }
        res.json({ text: responseText });
    }
    catch (err) {
        console.error('Groq AI generation error:', err.message || err);
        res.status(500).json({ error: err.message || 'AI generation failed' });
    }
};
exports.generateAIContent = generateAIContent;
