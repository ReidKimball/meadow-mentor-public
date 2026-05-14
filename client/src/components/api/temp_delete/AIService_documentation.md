# AIService.jsx — Documentation

- File: `client/src/components/api/AIService.jsx`
- Role: Reusable UI component for file-based AI interactions (upload -> submit -> render AI result)
- Relies on: `useAIService` hook for state, API calls, and usage limits

## File-Level JSDoc (for reference)
```jsx
/**
 * @file Defines the AIService React component.
 * @description Generic, reusable UI for AI services that take a file or value via FormData, submit to an endpoint, and render a Markdown response.
 * @requires module:react
 * @requires module:react-markdown
 * @requires module:remark-gfm
 * @requires module:@mui/material
 * @requires module:lucide-react
 * @requires module:../LoadingSpinner.jsx
 * @requires module:../Copy_Text
 * @requires module:../../../hooks/useAIService.js
 * @author Cascade
 * @version 1.0.0
 * @date 2025-08-16
 */
```

## Component API
- Name: `AIService`
- Returns: `JSX.Element`

### Props
- `title: string` — Heading text.
- `description: string` — Short paragraph explaining the tool.
- `apiService: string` — Service key for usage tracking (forwarded to hook).
- `apiEndpoint: string` — API path used by the hook (e.g., `/api/analyze_meal`).
- `fileInputName: string` — Form field name expected by backend.
- `uploadButtonText: string` — Helper text shown near the upload icon.
- `submitButtonText: string` — Submit button label.
- `submitButtonIcon: React.ReactNode` — Icon for submit button (e.g., from `lucide-react`).
- `tryQuestionButtons?: Array<{label: string, value: string}>` — Optional quick actions. Each button constructs a `FormData` and calls `disableUserForm`.
- `resultTitle?: string = "AI Response:"` — Heading for the result section.

## Internal State and Hooks
- Uses `useAIService(apiService, apiEndpoint, fileInputName)` to obtain:
  - `resultText: string` — AI Markdown response.
  - `formDisabled: boolean` — Disables form during requests.
  - `isAILoading: boolean` — Shows `LoadingSpinner` while true.
  - `uploadedImage: string|null` — Object URL preview for uploaded file.
  - `handleFileUpload(event)` — Sets preview image from file input.
  - `disableUserForm(formData)` — Triggers API call, manages loading/disabled state.
  - `error: string|null` — User-facing error.
  - `setResultText(fn|value)` — Allows clearing result.
  - `remainingUses: number|null` — Remaining usage quota for this service.
  - `resetTime: number|null` — Seconds until quota reset.

- `useRef` + `useEffect`: Scrolls to `resultSection` when `resultText` becomes non-empty.

## UI Flow
1. Render title/description and usage banner showing `remainingUses` and reset ETA.
2. File input and label area allow the user to select an image/PDF.
3. Submit (`<form action={disableUserForm}>`) posts `FormData` via hook.
4. Optional "Try these" buttons call `tryQuestion(value)` to construct `FormData` and submit.
5. When `resultText` arrives, the view scrolls to the result section and renders Markdown using `ReactMarkdown` + `remark-gfm`.
6. "Start New Chat" clears the current result.

## Error Handling and Accessibility
- Errors: Renders `error` text below the input area.
- Loading: Displays `<LoadingSpinner/>` overlay when `isAILoading` is true.
- Result section uses `aria-live='polite'` to announce updates.

## External Dependencies
- MUI `Button` for actions.
- `lucide-react` `Upload` icon for the prompt area.
- `react-markdown` + `remark-gfm` for rendering `resultText`.

## Example Usage
```jsx
<AIService
  title="Analyze Meal Image"
  description="Upload a meal photo to receive diet-safe analysis and suggestions."
  apiService="analyzeMeal"
  apiEndpoint="/api/analyze_meal"
  fileInputName="image"
  uploadButtonText="Upload an image or PDF"
  submitButtonText="Analyze"
  submitButtonIcon={<Upload />}
  tryQuestionButtons={[
    { label: 'Is this SCD-safe?', value: 'Is this SCD-safe?' },
  ]}
  resultTitle="Analysis"
/>
```

## Cross-References
- Hook: `client/hooks/useAIService.js`
- Service utilities (streaming endpoints): `client/src/ai.js`
