import request from 'supertest';
import app from '../../app'; // Adjust if your app export is elsewhere
import TherapeuticDietFood from '../../models/therapeuticDietFood.model.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await TherapeuticDietFood.deleteMany({});
});

describe('GET /mcp/v1/foods/search - MCP Food Search API', () => {
  const sampleFoods = [
    { diet_code: 'SCD', food_name: 'Apple', normalized_food_name: 'apple', allowed: true, note: 'Fresh apples are SCD legal' },
    { diet_code: 'SCD', food_name: 'Banana', normalized_food_name: 'banana', allowed: true, note: 'Ripe bananas are SCD legal' },
    { diet_code: 'SCD', food_name: 'Raw Honey', normalized_food_name: 'raw honey', allowed: true, note: 'Must be raw and unpasteurized' },
    { diet_code: 'SCD', food_name: 'Bread (Wheat)', normalized_food_name: 'bread (wheat)', allowed: false, note: 'Wheat bread is not SCD legal' },
    { diet_code: 'GAPS', food_name: 'Apple', normalized_food_name: 'apple', allowed: true, note: 'Cooked apples preferred on GAPS intro' },
    { diet_code: 'GAPS', food_name: 'Yogurt (24hr)', normalized_food_name: 'yogurt (24hr)', allowed: true, note: 'Homemade 24-hour fermented yogurt' },
  ];

  describe('Successful Searches', () => {
    beforeEach(async () => {
      await TherapeuticDietFood.insertMany(sampleFoods);
    });

    test('TC1: Single `q` parameter - should return matching food items', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=apple&diet=SCD');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].food_name).toBe('Apple');
      expect(response.body.data.data[0].diet_code).toBe('SCD');
    });

    test('TC2: Multiple `q` parameters - should return items matching ANY of the queries for the specified diet', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=apple&q=banana&diet=SCD');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(2);
      const foodNames = response.body.data.data.map(f => f.food_name).sort();
      expect(foodNames).toEqual(['Apple', 'Banana']);
    });

    test('TC3: `q` parameter with spaces (e.g., "raw honey") - should match normalized name', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=raw%20honey&diet=SCD'); // URL encoded space
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].food_name).toBe('Raw Honey');
    });

    test('TC4: Case-insensitive `q` parameter - should match (e.g., "APPLE" for "apple")', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=APPLE&diet=SCD');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].food_name).toBe('Apple');
    });

    test('TC5: No `q` parameter - should return all items for the specified diet (respecting pagination)', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?diet=SCD&limit=2');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(4); // Apple, Banana, Raw Honey, Bread (Wheat)
    });
    
    test('TC6: No `diet` parameter - should return items matching `q` across all diets', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=apple');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(2); 
      const dietCodes = response.body.data.data.map(f => f.diet_code).sort();
      expect(dietCodes).toEqual(['GAPS', 'SCD']);
    });

    test('TC7: Pagination - `limit` and `offset` should work correctly', async () => {
      // sampleFoods has 4 SCD items. Add 2 more for a total of 6.
      await TherapeuticDietFood.insertMany([
        { diet_code: 'SCD', food_name: 'Orange', normalized_food_name: 'orange', allowed: true },
        { diet_code: 'SCD', food_name: 'Grape', normalized_food_name: 'grape', allowed: true },
      ]);
      // Total 6 SCD foods: Apple, Banana, Bread (Wheat), Grape, Orange, Raw Honey (alphabetical for predictability if no sort)
      // Default sort is by _id (insertion order) if not specified.

      // Page 1: limit 2, offset 0
      const page1Response = await request(app).get('/mcp/v1/foods/search?diet=SCD&limit=2&offset=0');
      expect(page1Response.body.data.data.length).toBe(2);
      expect(page1Response.body.data.pagination.currentPage).toBe(1);
      expect(page1Response.body.data.pagination.total).toBe(6);

      // Page 2: limit 2, offset 2
      const page2Response = await request(app).get('/mcp/v1/foods/search?diet=SCD&limit=2&offset=2');
      expect(page2Response.body.data.data.length).toBe(2);
      expect(page2Response.body.data.pagination.currentPage).toBe(2);
      expect(page2Response.body.data.pagination.hasNextPage).toBe(true);
      expect(page2Response.body.data.pagination.hasPrevPage).toBe(true);

      // Page 3: limit 2, offset 4
      const page3Response = await request(app).get('/mcp/v1/foods/search?diet=SCD&limit=2&offset=4');
      expect(page3Response.body.data.data.length).toBe(2);
      expect(page3Response.body.data.pagination.currentPage).toBe(3);
      expect(page3Response.body.data.pagination.hasNextPage).toBe(false);
      expect(page3Response.body.data.pagination.hasPrevPage).toBe(true);
    });

    test('TC8: No results found - should return empty data array and correct pagination', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=nonexistentfood&diet=SCD');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    test('TC9: Invalid `diet` code - should return 400 validation error', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=apple&diet=INVALIDDIET');
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].param).toBe('diet');
    });

    test('TC10: `q` parameter too long (exceeds 100 chars) - should return 400', async () => {
      const longQuery = 'a'.repeat(101);
      const response = await request(app).get(`/mcp/v1/foods/search?q=${longQuery}&diet=SCD`);
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      // The validator for array items usually puts the index in the path, e.g., 'q[0]'
      expect(response.body.errors[0].param).toBe('q[0]'); 
    });

    test('TC11: Too many `q` parameters (exceeds 20) - should return 400', async () => {
      let queryParams = '';
      for (let i = 0; i < 21; i++) {
        queryParams += `q=item${i}&`;
      }
      queryParams += 'diet=SCD';
      const response = await request(app).get(`/mcp/v1/foods/search?${queryParams}`);
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].param).toBe('q'); // Validator for array length itself
      expect(response.body.errors[0].msg).toContain('Maximum 20 query parameters allowed.');
    });
    
    test('TC12: Invalid `limit` or `offset` (e.g., not a number, negative) - should return 400', async () => {
      const responseLimit = await request(app).get('/mcp/v1/foods/search?diet=SCD&limit=abc');
      expect(responseLimit.statusCode).toBe(400);
      expect(responseLimit.body.errors[0].param).toBe('limit');

      const responseOffset = await request(app).get('/mcp/v1/foods/search?diet=SCD&offset=-5');
      expect(responseOffset.statusCode).toBe(400);
      expect(responseOffset.body.errors[0].param).toBe('offset');
    });

    test('TC13: `q` parameter empty string - should return 400', async () => {
      const response = await request(app).get('/mcp/v1/foods/search?q=&diet=SCD');
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].param).toBe('q[0]');
      expect(response.body.errors[0].msg).toContain('Query term must be between 1 and 100 characters');
    });
  });
});
