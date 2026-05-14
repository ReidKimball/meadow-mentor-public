
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.config') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GOOGLE_API_KEY;

// Try initializing with v1alpha
const ai = new GoogleGenAI(apiKey);
// Hacky attempt to override version if constructor doesn't take it, 
// but most likely the constructor takes (apiKey, options) or just options including apiKey.
// Checking constructor signature is hard without docs, but let's try creating a new client with options.

const aiAlpha = new GoogleGenAI(apiKey, { apiVersion: 'v1alpha' }); 


async function testGen() {
  console.log("Testing generation with gemini-2.5-flash-image via generateContent...");
  try {
    // Client is already 'ai' from line 14
    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Generate an image of a delicious bowl of pasta' }
          ]
        }
      ]
    });
    console.log("Success with generateContent!");
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Failed with generateContent:", error);
    if (error.response) {
       // console.error("Error response:", JSON.stringify(error.response, null, 2));
    }
  }
}

testGen();
