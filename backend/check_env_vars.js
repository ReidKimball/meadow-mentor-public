import dotenv from 'dotenv';
import fs from 'fs';

console.log('--- File System Check ---');
const files = ['.env', '.env.config'];
files.forEach(f => {
  try {
    if (fs.existsSync(f)) {
      console.log(`[FOUND] ${f}`);
      const content = fs.readFileSync(f, 'utf8');
      const parsed = dotenv.parse(content);
      console.log(`   Keys: ${Object.keys(parsed).join(', ')}`);
      // check specific keys
      if (parsed.LANGSMITH_TRACING) console.log(`   LANGSMITH_TRACING in file: ${parsed.LANGSMITH_TRACING}`);
      if (parsed.LANGCHAIN_TRACING_V2) console.log(`   LANGCHAIN_TRACING_V2 in file: ${parsed.LANGCHAIN_TRACING_V2}`);
    } else {
      console.log(`[MISSING] ${f}`);
    }
  } catch (err) {
    console.log(`[ERROR] Accessing ${f}: ${err.message}`);
  }
});

console.log('\n--- Effective Process Env ---');
console.log('LANGSMITH_TRACING:', process.env.LANGSMITH_TRACING);
console.log('LANGCHAIN_TRACING_V2:', process.env.LANGCHAIN_TRACING_V2);
console.log('LANGCHAIN_API_KEY:', process.env.LANGCHAIN_API_KEY ? 'Set' : 'Not Set');
