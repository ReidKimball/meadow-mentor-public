
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const path = await import('path');
const { fileURLToPath } = await import('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from backend/.env.config and backend/.env
dotenv.config({ path: path.join(__dirname, '../.env.config') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GOOGLE_API_KEY;
console.log("GOOGLE_API_KEY found?", !!apiKey); // Do not log actual key

if (!apiKey) {
    console.error("API Key not found in env vars.");
    process.exit(1);
}

const ai = new GoogleGenAI(apiKey);

async function listModels() {
  try {
    const response = await ai.models.list();
    console.log("Available Models:");
    for await (const model of response) {
      console.log(`- ${model.name} (displayName: ${model.displayName})`);
      if (model.supportedGenerationMethods) {
        console.log(`  Supported Methods: ${JSON.stringify(model.supportedGenerationMethods)}`);
      } else {
        console.log(`  Supported Methods: (none listed)`); 
      }
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
