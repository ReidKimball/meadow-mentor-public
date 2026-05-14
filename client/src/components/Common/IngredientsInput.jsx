// client/src/components/Common/IngredientsInput.jsx
/**
 * @file IngredientsInput.jsx
 * @description A reusable component for inputting a list of ingredients, 
 * utilizing Material UI's Autocomplete for a rich user experience with chips and suggestions.
 * It handles ingredients as a newline-separated string for external consistency 
 * while managing them as an array internally for the Autocomplete component.
 */
import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete, Chip, Box, Typography, CircularProgress } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions();

/**
 * @component IngredientsInput
 * @description A controlled input component for entering multiple ingredients.
 * It displays ingredients as chips and supports autocomplete suggestions.
 * The component expects and returns ingredients as a single string, with each ingredient on a new line.
 *
 * @param {object} props - The properties for the component.
 * @param {string} props.ingredients - A string containing all ingredients, each separated by a newline character. 
 *                                     This is the controlled value for the input.
 * @param {function(string): void} props.onIngredientsChange - Callback function invoked when the list of ingredients changes.
 *                                                            It receives the updated newline-separated string of ingredients.
 * @param {string} [props.label="Ingredients"] - The label for the input field.
 * @param {string} [props.placeholder="Enter each ingredient on a new line..."] - The placeholder text for the input field when empty.
 * @param {boolean} [props.disabled=false] - If true, the input field is disabled.
 * @param {string[]} [props.availableIngredients=[]] - An array of strings representing available ingredients for autocomplete suggestions.
 * @param {boolean} [props.isLoadingAvailableIngredients=false] - If true, a loading indicator is shown, typically while fetching available ingredients.
 * @param {string|null} [props.availableIngredientsError=null] - An error message string to display if fetching available ingredients fails.
 * @returns {JSX.Element} The IngredientsInput component.
 */
const IngredientsInput = ({
  ingredients, // Expects a string, ingredients separated by newlines
  onIngredientsChange, // Callback to update the parent with the string of ingredients
  label = "Ingredients",
  placeholder = "Enter each ingredient on a new line...",
  disabled = false,
  // Props for Autocomplete suggestions (optional, can be enhanced later)
  availableIngredients = [], // Array of strings for suggestions
  isLoadingAvailableIngredients = false,
  availableIngredientsError = null,
}) => {
  const [inputValue, setInputValue] = useState(''); // For the Autocomplete input field itself

  // Current ingredients from the TextField, split into an array for Autocomplete 'value'
  const currentIngredientArray = ingredients
    .split('\n')
    .map(ing => ing.trim())
    .filter(ing => ing);

  /**
   * @function handleTextFieldChange
   * @description Handles changes to the TextField, updating the parent component with the new string of ingredients.
   * @param {object} event - The event source of the callback.
   */
  const handleTextFieldChange = (event) => {
    onIngredientsChange(event.target.value);
  };

  /**
   * @function handleAutocompleteChange
   * @description Handles changes from the Autocomplete component (selection or new entry).
   * Converts the array of selected/entered items back into a newline-separated string
   * and calls `onIngredientsChange`.
   * @param {object} event - The event source of the callback.
   * @param {Array<string|object>} newValueArray - The new array of values from Autocomplete. 
   *                                               Items can be strings (existing/typed) or objects 
   *                                               (for newly created options via "Add...").
   */
  const handleAutocompleteChange = (event, newValueArray) => {
    // newValueArray can contain strings (existing options) or objects { inputValue, title } (new options)
    const newIngredientsString = newValueArray
      .map(option => {
        if (typeof option === 'string') {
          return option.trim();
        }
        if (option && option.inputValue) {
          // This is for "Add ..." option
          return option.inputValue.trim();
        }
        return ''; // Should not happen with proper setup
      })
      .filter(ing => ing) // Filter out empty strings
      .join('\n');

    onIngredientsChange(newIngredientsString);
  };

  return (
    <Box>
      <Autocomplete
        multiple
        freeSolo // Allows custom input not in 'options'
        options={availableIngredients}
        value={currentIngredientArray} // Controlled component: value derived from 'ingredients' prop
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handleAutocompleteChange}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          const { inputValue: currentInput } = params;
          // Suggest the creation of a new value
          const isExisting = options.some((option) => currentInput === option);
          if (currentInput !== '' && !isExisting) {
            // filtered.push(currentInput); // Allow adding the current input directly if not in suggestions
            // Updated to match MUI examples for adding new items:
            // https://mui.com/material-ui/react-autocomplete/#creatable
            filtered.push({
              inputValue: currentInput,
              title: `Add "${currentInput}"`,
            });
          }
          return filtered;
        }}
        getOptionLabel={(option) => {
          // Value selected with enter, right from the input
          if (typeof option === 'string') {
            return option;
          }
          // Add "xxx" option created dynamically by filterOptions
          if (option.inputValue) {
            return option.inputValue;
          }
          // Regular option from availableIngredients (assuming it's an array of strings)
          return option; 
        }}
        renderOption={(props, option) => {
            const optionLabel = typeof option === 'string' ? option : option.title || option.inputValue;
            return (
                <li {...props}>
                    {optionLabel}
                </li>
            );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...chipProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                variant="outlined"
                label={option}
                size="small"
                {...chipProps}
                disabled={disabled}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            placeholder={currentIngredientArray.length > 0 ? '' : placeholder} // Hide placeholder if there are chips
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingAvailableIngredients ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ mb: 1 }} // Margin below Autocomplete if TextField is separate
      />
       <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, ml:1 }}>
        Tip: Type an ingredient and press Enter to add it. You can also paste a list.
      </Typography>

      {/* The main TextField for multiline input is effectively managed by Autocomplete's renderInput */}
      {/* However, if you prefer a separate multiline TextField for bulk entry that SYNCs with autocomplete,
          that's a more complex setup. The current setup uses Autocomplete's input for adding items.
          To support pasting a list directly that then populates the chips, the onIngredientsChange
          from the parent needs to correctly feed the 'ingredients' prop which then updates 'currentIngredientArray'.
          Let's ensure the `EditPresetModal` correctly handles the `ingredientsInput` state and passes it down.
      */}

      {availableIngredientsError && (
        <Typography color="error" variant="caption">
          Error loading suggestions: {availableIngredientsError}
        </Typography>
      )}
    </Box>
  );
};

export default IngredientsInput;
