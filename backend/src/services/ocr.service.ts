import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
// @ts-ignore
const pdfParse = require('pdf-parse');
import { query } from '../db/pool';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const extractText = async (filePath: string, mimeType: string): Promise<{ rawText: string; confidence: number; pageCount: number }> => {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(fullPath);
    const data = await pdfParse(dataBuffer);
    
    // If pdf-parse failed to extract meaningful text, we just return empty string instead of crashing Tesseract
    if (!data.text || data.text.trim().length < 20) {
      console.log('PDF text extraction yielded empty text. Passing empty text to Gemini.');
      return { rawText: data.text || '', confidence: 0, pageCount: data.numpages || 1 };
    }
    return { rawText: data.text, confidence: 100, pageCount: data.numpages || 1 };
  } else if (mimeType.startsWith('image/')) {
    const result = await Tesseract.recognize(fullPath, 'eng');
    return { rawText: result.data.text, confidence: result.data.confidence || 0, pageCount: 1 };
  } else {
    throw new Error(`Unsupported MIME type for OCR: ${mimeType}`);
  }
};

export const verifyDocument = async (rawText: string, declaredDocType: string) => {
  const prompt = `You are a document verification assistant for a government tender system.
A vendor has uploaded a document to satisfy the requirement: "${declaredDocType}"

Raw OCR text extracted:
---
${rawText}
---

Analyze if the text satisfies the requirement for a "${declaredDocType}".
BE LENIENT: The exact title of the document does not need to match perfectly. For example, if the requirement is "Warranty terms and conditions", a document titled "Standard Terms and Conditions of Sale" that contains warranty information IS perfectly valid and should be verified as true.

Respond ONLY in this JSON format, no text outside it:
{
  "verified": true/false,
  "confidence": 0-100,
  "documentType": "what document this actually appears to be",
  "keyFieldsFound": ["field1", "field2"],
  "reason": "one sentence explanation",
  "flags": ["suspicious patterns or empty array"]
}`;

  try {
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' }
        });
        response = chatCompletion.choices[0]?.message?.content || "{}";
        break; // success
      } catch (e: any) {
        if ((e?.status === 503 || e?.status === 429) && retries > 1) {
          retries--;
          console.warn(`Groq API ${e.status} error. Retrying... (${retries} left)`);
          await new Promise(r => setTimeout(r, 4000)); // wait 4 seconds
        } else {
          throw e;
        }
      }
    }

    const text = response || "{}";
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Groq API Error after retries:', err.message || err);
    
    // Fallback locally if any API error occurs for the demo
    console.log('Falling back to local keyword verification due to API limits or errors...');
    const docTypeLower = declaredDocType.toLowerCase();
    const rawTextLower = rawText.toLowerCase();
       
    // Super simple keyword matching for the demo
    const keywords = docTypeLower.split(' ').filter(w => w.length > 3);
    const matchCount = keywords.filter(k => rawTextLower.includes(k)).length;
    const isMatch = matchCount > 0 || rawTextLower.includes('warranty') || rawTextLower.includes('terms');

    return {
      verified: isMatch,
      confidence: isMatch ? 85 : 0,
      documentType: isMatch ? declaredDocType : "Unknown",
      reason: isMatch ? "Locally verified (API Rate Limit fallback)" : "Failed local keyword check",
      flags: ["Local Fallback used"],
      keyFieldsFound: isMatch ? keywords : []
    };
  }
};

export const processDocumentOcr = async (documentId: string, filePath: string, mimeType: string, declaredDocType: string) => {
  try {
    // 1. Extract Text
    const { rawText, confidence } = await extractText(filePath, mimeType);

    // 2. Verify Document
    const verification = await verifyDocument(rawText, declaredDocType);

    // 3. Save to DB
    await query(
      `INSERT INTO ocr_results (document_id, raw_text, confidence, verified, verification_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [documentId, rawText.trim(), confidence, verification.verified, JSON.stringify(verification)]
    );

    return { rawText, confidence, verification };
  } catch (error) {
    console.error(`OCR pipeline failed for document ${documentId}:`, error);
    throw error;
  }
};
