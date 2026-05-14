import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import { McpServer, McpToolDefinition, StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk';
import {
  GET_FOOD_INGREDIENT_INFO_TOOL_NAME,
  getFoodIngredientInfoInputSchema,
  executeGetFoodIngredientInfo
} from './tools.js';

dotenv.config();

const app = express();
const port = process.env.MCP_SERVER_PORT || 8081;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Create and configure the McpServer instance ONCE globally ---

// Define the tool structure for declarative registration
const getFoodIngredientInfoToolDefinition: McpToolDefinition = {
  inputSchema: getFoodIngredientInfoInputSchema, // Use the full Zod schema object
  callback: executeGetFoodIngredientInfo,
  // description: "Gets ingredient information for a given diet.", // Optional
  enabled: true,
};

const mcpServerInstance = (() => {
  const serverInstance = new McpServer({
    name: 'FoodIngredientInfoMCP',
    version: '1.0.0',
    description: 'MCP Server for Food Ingredient Information for Therapeutic Diets',
    capabilities: {
      resources: {}, // Keep empty if no resources
      tools: {
        [GET_FOOD_INGREDIENT_INFO_TOOL_NAME]: getFoodIngredientInfoToolDefinition,
      }
    }
  });
  console.log('Global McpServer instance created with tool defined in capabilities.');
  
  console.log('Global inspection of mcpServerInstance._tools or .handlers:', serverInstance._tools || serverInstance.handlers || 'neither _tools nor handlers found');
  return serverInstance;
})();
// --- End of single McpServer instance creation ---

// MCP Endpoint - Uses the single, global mcpServerInstance and creates StreamableHTTPServerTransport per request
app.post('/mcp', async (req: Request, res: Response) => {
  console.log('Received POST /mcp request. Body:', JSON.stringify(req.body, null, 2));

  let transport: StreamableHTTPServerTransport | null = null;

  try {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Explicitly set as per StreamableHTTPServerTransportOptions
    });
    console.log('Per-request StreamableHTTPServerTransport created.');

    res.on('close', () => {
      console.log('Request to /mcp closed by client. Cleaning up per-request transport.');
      if (transport) {
        transport.close();
      }
      // DO NOT close the global mcpServerInstance here
    });

    // Crucial step: connect the global server instance with the per-request transport instance
    if (mcpServerInstance && transport) { // Null check for transport, mcpServerInstance should be defined
      await mcpServerInstance.connect(transport);
      console.log('Global McpServerInstance connected to per-request transport.');

      // Handle the actual request using the transport
      await transport.handleRequest(req, res, req.body);
      console.log('MCP request potentially handled by transport with req.body.');
    } else {
      console.error('Global mcpServerInstance or per-request Transport was not initialized before connect/handleRequest.');
      throw new Error('Global mcpServerInstance or per-request Transport not initialized.');
    }


  } catch (error) {
    console.error('Error in /mcp POST handler:', error);
    if (!res.headersSent) {
      // Attempt to get request ID from body, default to null
      const requestId = (typeof req.body === 'object' && req.body !== null && 'id' in req.body) ? req.body.id : null;
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error during MCP request handling',
        },
        id: requestId,
      });
    }
    // Ensure transport is closed even on error, if it was initialized and response not ended
    if (transport && !res.writableEnded) { 
        transport.close();
    }
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('MCP Server is healthy');
});

// For GET and DELETE on /mcp, respond with Method Not Allowed as per example
app.get('/mcp', (req: Request, res: Response) => {
  console.log('Received GET /mcp request - Method Not Allowed');
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method Not Allowed. Use POST for MCP requests.' },
    id: null,
  });
});

app.delete('/mcp', (req: Request, res: Response) => {
  console.log('Received DELETE /mcp request - Method Not Allowed');
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method Not Allowed.' },
    id: null,
  });
});

app.listen(port, () => {
  console.log(`MCP Server running at http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`MCP endpoint available at POST http://localhost:${port}/mcp`);
});
