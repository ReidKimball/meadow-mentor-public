// Unit tests for MCP Food Search functionality

import { searchFoodItems } from '../../services/mcpService.js';
import { searchFoodsController } from '../../controllers/mcp.controller.js';
import { validateSearchFoods } from '../../middleware/mcp.validator.js';
import mcpConfig from '../../config/mcp.config.js';
import TherapeuticDietFood from '../../models/therapeuticDietFood.model.js'; // Import for mocking

// Mock the mcpService for controller tests (remains the same)
jest.mock('../../services/mcpService.js');

// Mock the TherapeuticDietFood model for service tests
jest.mock('../../models/therapeuticDietFood.model.js');

const mockDbFoodItem = {
  _id: 'mockDbId123',
  food_name: 'Database Chicken Breast',
  normalized_food_name: 'database chicken breast',
  diet_code: 'SCD',
  allowed: true,
  note: 'From DB test',
  source_file: 'test_source.csv'
};

const mappedFoodItem = {
  id: 'mockDbId123',
  food_name: 'Database Chicken Breast',
  normalized_food_name: 'database chicken breast',
  diet_code: 'SCD',
  allowed: true,
  note: 'From DB test',
  source_file: 'test_source.csv'
};

describe('MCP Service - Food Search (Database Driven)', () => {
  let mockFind;
  let mockCountDocuments;

  beforeEach(() => {
    // Reset mocks for each test
    mockFind = jest.fn().mockReturnThis(); // for chaining .skip.limit.select.lean
    const mockSkip = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockResolvedValue([mockDbFoodItem]); // Default mock for .lean()

    mockFind.skip = mockSkip;
    mockFind.limit = mockLimit;
    mockFind.select = mockSelect;
    mockFind.lean = mockLean;

    TherapeuticDietFood.find = mockFind;

    mockCountDocuments = jest.fn().mockResolvedValue(1); // Default mock for countDocuments
    TherapeuticDietFood.countDocuments = mockCountDocuments;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call TherapeuticDietFood.find and .countDocuments with correct query for q and diet', async () => {
    const params = { q: 'chicken', diet: 'SCD', limit: 5, offset: 0 };
    await searchFoodItems(params);

    const expectedQuery = {
      normalized_food_name: { $regex: 'chicken', $options: 'i' },
      diet_code: 'SCD'
    };

    expect(TherapeuticDietFood.find).toHaveBeenCalledWith(expectedQuery);
    expect(mockFind.skip).toHaveBeenCalledWith(params.offset);
    expect(mockFind.limit).toHaveBeenCalledWith(params.limit);
    expect(mockFind.select).toHaveBeenCalledWith('food_name normalized_food_name diet_code allowed note source_file');
    expect(mockFind.lean).toHaveBeenCalled();
    expect(TherapeuticDietFood.countDocuments).toHaveBeenCalledWith(expectedQuery);
  });

  it('should build query only with q if diet is not provided', async () => {
    const params = { q: 'beef', limit: 10, offset: 0 };
    await searchFoodItems(params);
    const expectedQuery = { normalized_food_name: { $regex: 'beef', $options: 'i' } };
    expect(TherapeuticDietFood.find).toHaveBeenCalledWith(expectedQuery);
    expect(TherapeuticDietFood.countDocuments).toHaveBeenCalledWith(expectedQuery);
  });

  it('should build query only with diet if q is not provided', async () => {
    const params = { diet: 'KETO', limit: 10, offset: 0 };
    await searchFoodItems(params);
    const expectedQuery = { diet_code: 'KETO' };
    expect(TherapeuticDietFood.find).toHaveBeenCalledWith(expectedQuery);
    expect(TherapeuticDietFood.countDocuments).toHaveBeenCalledWith(expectedQuery);
  });

  it('should build an empty query if neither q nor diet is provided', async () => {
    const params = { limit: 10, offset: 0 };
    await searchFoodItems(params);
    expect(TherapeuticDietFood.find).toHaveBeenCalledWith({});
    expect(TherapeuticDietFood.countDocuments).toHaveBeenCalledWith({});
  });

  it('should correctly map _id to id and return paginated results', async () => {
    const params = { limit: 1, offset: 0 };
    // mockLean is already set to resolve with [mockDbFoodItem]
    // mockCountDocuments is already set to resolve with 1

    const result = await searchFoodItems(params);

    expect(result.data).toEqual([mappedFoodItem]);
    expect(result.pagination).toEqual({
      total: 1,
      limit: params.limit,
      offset: params.offset,
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });

  it('should handle pagination correctly when there are multiple pages', async () => {
    TherapeuticDietFood.find.lean.mockResolvedValue([mockDbFoodItem, mockDbFoodItem]); // 2 items for this page
    TherapeuticDietFood.countDocuments.mockResolvedValue(10); // 10 total items
    const params = { limit: 2, offset: 2 }; // Page 2 (0-indexed offset)

    const result = await searchFoodItems(params);

    expect(result.data.length).toBe(2);
    expect(result.pagination).toEqual({
      total: 10,
      limit: 2,
      offset: 2,
      currentPage: 2, // offset 2 / limit 2 = 1; 1 + 1 = 2
      totalPages: 5,  // 10 / 2 = 5
      hasNextPage: true,
      hasPrevPage: true,
    });
  });
  
  it('should handle hasNextPage and hasPrevPage correctly at boundaries', async () => {
    TherapeuticDietFood.countDocuments.mockResolvedValue(5);
    // First page
    let params = { limit: 2, offset: 0 };
    TherapeuticDietFood.find.lean.mockResolvedValue([mockDbFoodItem, mockDbFoodItem]);
    let result = await searchFoodItems(params);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(false);

    // Middle page
    params = { limit: 2, offset: 2 };
    TherapeuticDietFood.find.lean.mockResolvedValue([mockDbFoodItem, mockDbFoodItem]);
    result = await searchFoodItems(params);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(true);

    // Last page
    params = { limit: 2, offset: 4 };
    TherapeuticDietFood.find.lean.mockResolvedValue([mockDbFoodItem]); // Only one item on last page
    result = await searchFoodItems(params);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPrevPage).toBe(true);
  });

  it('should return empty data and correct pagination if offset is beyond total items', async () => {
    TherapeuticDietFood.find.lean.mockResolvedValue([]);
    TherapeuticDietFood.countDocuments.mockResolvedValue(5);
    const params = { limit: 2, offset: 6 }; // Offset beyond 5 items

    const result = await searchFoodItems(params);
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.currentPage).toBe(4); // offset 6 / limit 2 = 3; 3+1 = 4
    expect(result.pagination.totalPages).toBe(3); // ceil(5/2) = 3
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPrevPage).toBe(true);
  });

  it('should throw a service error if database query fails', async () => {
    const dbError = new Error('Database connection lost');
    TherapeuticDietFood.find.lean.mockRejectedValue(dbError);
    // or TherapeuticDietFood.countDocuments.mockRejectedValue(dbError);

    const params = { limit: 5, offset: 0 };
    await expect(searchFoodItems(params)).rejects.toThrow('Failed to search for food items due to a server error.');
  });
});

// Controller tests remain largely the same as they mock the service outcome
describe('MCP Controller - Food Search', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      query: { q: 'test', diet: 'SCD', limit: 10, offset: 0 }, // query comes from validator, already sanitized
      requestId: 'test-req-id-food-search',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    // Ensure mcpService.searchFoodItems is the mock from the top of the file
    // (jest.mock automatically hoists mocks)
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears mocks for mcpService.searchFoodItems too
  });

  describe('searchFoodsController', () => {
    it('should call mcpService.searchFoodItems with query params and return 200 success', async () => {
      const serviceResult = { data: [mappedFoodItem], pagination: { total: 1, limit: 10, offset: 0, currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
      // Configure the mock for mcpService.searchFoodItems
      searchFoodItems.mockResolvedValue(serviceResult);

      await searchFoodsController(mockRequest, mockResponse, mockNext);

      expect(searchFoodItems).toHaveBeenCalledWith(mockRequest.query);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        mcpConfig.createSuccessResponse(serviceResult, mockRequest.requestId)
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with an error if service call fails', async () => {
      const serviceError = new Error('Service search failed');
      searchFoodItems.mockRejectedValue(serviceError);

      await searchFoodsController(mockRequest, mockResponse, mockNext);

      expect(searchFoodItems).toHaveBeenCalledWith(mockRequest.query);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});

// Validator tests remain the same as validator logic has not changed
describe('MCP Validator - Food Search', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  const runValidation = async (req) => {
    // Validator is an array of middleware, last one calls next() or res.status().json()
    for (const validationMiddleware of validateSearchFoods) {
      // Create a new promise for each middleware to wait for it to complete
      await new Promise((resolve) => {
        validationMiddleware(req, mockResponse, (err) => {
          if (err) {
            // If an error is passed to next(), it's a real error, not just validation failure handled by res.status()
            mockNext(err); 
          }
          resolve(); // Resolve the promise to proceed to the next middleware or finish
        });
      });
      // If a response has been sent (validation failed and json response generated) or mockNext was called with an error, stop processing further middlewares
      if (mockResponse.status.mock.calls.length > 0 || mockNext.mock.calls.length > 0) {
        break;
      }
    }
  };

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should pass with valid optional parameters (q and diet)', async () => {
    mockRequest = { query: { q: 'apple', diet: 'SCD', limit: '5', offset: '0' }, requestId: 'val-req-1' };
    await runValidation(mockRequest);
    // The last middleware in validateSearchFoods calls next() if validation passes
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error)); // Ensure next() wasn't called with an error object
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockRequest.query.limit).toBe(5); 
    expect(mockRequest.query.offset).toBe(0);
    expect(mockRequest.query.diet).toBe('SCD');
  });

  it('should pass if only defaultable parameters are provided', async () => {
    mockRequest = { query: {}, requestId: 'val-req-2' };
    await runValidation(mockRequest);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockRequest.query.limit).toBe(mcpConfig.defaultSearchLimit);
    expect(mockRequest.query.offset).toBe(0);
  });

  it('should fail and send 400 if q is not a string', async () => {
    mockRequest = { query: { q: 123 }, requestId: 'val-req-3' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    }));
    expect(mockNext).not.toHaveBeenCalled(); // Error handled by sending response
  });

  it('should fail and send 400 if diet is not a valid diet code', async () => {
    mockRequest = { query: { diet: 'INVALID_DIET' }, requestId: 'val-req-4' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass with case-insensitive valid diet code, sanitizing to uppercase', async () => {
    mockRequest = { query: { diet: 'scd' }, requestId: 'val-req-5' };
    await runValidation(mockRequest);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockRequest.query.diet).toBe('SCD');
  });

  it('should fail and send 400 if limit is not an integer', async () => {
    mockRequest = { query: { limit: 'abc' }, requestId: 'val-req-6' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should fail and send 400 if limit is less than 1', async () => {
    mockRequest = { query: { limit: '0' }, requestId: 'val-req-7' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  it('should fail and send 400 if limit is greater than 100', async () => {
    mockRequest = { query: { limit: '101' }, requestId: 'val-req-8' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should fail and send 400 if offset is not an integer', async () => {
    mockRequest = { query: { offset: 'abc' }, requestId: 'val-req-9' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should fail and send 400 if offset is less than 0', async () => {
    mockRequest = { query: { offset: '-1' }, requestId: 'val-req-10' };
    await runValidation(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should use default limit if limit is not provided', async () => {
    mockRequest = { query: {}, requestId: 'val-req-11' };
    await runValidation(mockRequest);
    expect(mockRequest.query.limit).toBe(mcpConfig.defaultSearchLimit);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should use default offset if offset is not provided', async () => {
    mockRequest = { query: {}, requestId: 'val-req-12' };
    await runValidation(mockRequest);
    expect(mockRequest.query.offset).toBe(0);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
