// Unit tests for MCP Diet Listing functionality

import { getAvailableDiets } from '../../services/mcpService.js';
import { listDietsController } from '../../controllers/mcp.controller.js';
import mcpConfig from '../../config/mcp.config.js';

// Mock the mcpService to isolate the controller tests
jest.mock('../../services/mcpService.js');

// Expected hardcoded diets (mirroring the service implementation for verification)
const expectedDiets = [
  { code: "SCD", name: "Specific Carbohydrate Diet" },
  { code: "GAPS", name: "Gut and Psychology Syndrome Diet" },
  { code: "Paleo AIP", name: "Paleo Autoimmune Protocol" },
  { code: "Mediterranean", name: "Mediterranean Diet" },
];

describe('MCP Service - Diet Listing', () => {
  describe('getAvailableDiets', () => {
    // Un-mock for this specific test suite if it was mocked globally or in a parent describe
    // However, since we are testing the actual implementation of getAvailableDiets here,
    // we need its original implementation.
    // For this file structure, direct import of the original is fine.
    const originalMcpService = jest.requireActual('../../services/mcpService.js');

    it('should return a promise', () => {
      expect(originalMcpService.getAvailableDiets()).toBeInstanceOf(Promise);
    });

    it('should resolve with the correct list of available diets', async () => {
      const diets = await originalMcpService.getAvailableDiets();
      expect(diets).toEqual(expectedDiets);
    });

    // Example of how to test if the service threw an error (if it could)
    // it('should throw an error if the underlying data source fails', async () => {
    //   // Mock the data source to throw an error
    //   await expect(originalMcpService.getAvailableDiets()).rejects.toThrow('Failed to retrieve available diets.');
    // });
  });
});

describe('MCP Controller - Diet Listing', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      requestId: 'test-request-id-123',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listDietsController', () => {
    it('should fetch diets from the service and return a 200 success response', async () => {
      getAvailableDiets.mockResolvedValue(expectedDiets); // Mock the service call

      await listDietsController(mockRequest, mockResponse, mockNext);

      expect(getAvailableDiets).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        mcpConfig.createSuccessResponse(expectedDiets, mockRequest.requestId)
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with an error if the service call fails', async () => {
      const errorMessage = 'Service failed';
      const serviceError = new Error(errorMessage);
      getAvailableDiets.mockRejectedValue(serviceError); // Mock service to throw an error

      await listDietsController(mockRequest, mockResponse, mockNext);

      expect(getAvailableDiets).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
