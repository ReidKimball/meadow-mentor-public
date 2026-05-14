import { DynamicTool } from '@langchain/core/tools';
import TherapeuticDietFood from '../models/therapeuticDietFood.model.js';
import { z } from 'zod';

/**
 * Creates a dynamic tool for querying the therapeutic food database.
 * The tool allows the LangChain agent to check if a specific food is allowed
 * for a given therapeutic diet.
 */
const createFoodDatabaseTool = () => {
  return new DynamicTool({
    name: 'foodDatabaseSearch',
    description: 'Checks the food database to see if a food is allowed on a specific diet. Provide the food\'s name and the diet code (e.g., "SCD").',
    schema: z.object({
      foodName: z.string().describe("The name of the food to search for."),
      dietCode: z.string().describe("The code for the diet (e.g., 'SCD').")
    }),
    func: async ({ foodName, dietCode }) => {
      console.log(`(tools.js) - Received foodName: '${foodName}', dietCode: '${dietCode}'`);

      try {
        if (!foodName || !dietCode) {
          const error = '[tools.js] - Invalid input. Both foodName and dietCode are required.';
          console.error(error);
          return error;
        }

        const query = {
          diet_code: dietCode,
          $or: [
            { food_name: { $regex: foodName, $options: 'i' } },
            { normalized_food_name: { $regex: foodName.toLowerCase(), $options: 'i' } },
          ],
        };

        console.log('--- foodDatabaseSearch ---');
        console.log('MongoDB Query:', JSON.stringify(query, null, 2));

        const food = await TherapeuticDietFood.findOne(query);

        console.log('Query Result:', food ? food : 'No document found.');
        console.log('--------------------------');

        if (!food) {
          const notFoundMsg = `Food not found: ${foodName} for diet ${dietCode}.`;
          return notFoundMsg;
        }

        let result = `Food: ${food.food_name}, Diet: ${food.diet_code}, Status: ${food.allowed ? 'Allowed' : 'Illegal'}.`;
        if (food.note) {
          result += ` Note: ${food.note}`;
        }

        return result;

      } catch (error) {
        console.error('Error in foodDatabaseSearch tool:', error);
        return 'An error occurred while searching the food database.';
      }
    },
  });
};

export { createFoodDatabaseTool };
