# AIService.jsx — Suggested Fixes

- File: `client/src/components/api/AIService.jsx`
- Scope: Non-breaking UI/UX and accessibility improvements. No logic changes to backend calls.

## 1) Label/input association
- Issue: `<label htmlFor={fileInputName}>` but the `<input>` lacks a matching `id`.
- Fix: Add `id={fileInputName}` to the `<input>` element or remove `htmlFor` since the input is nested inside the label.

```jsx
<label htmlFor={fileInputName} ...>
  <input id={fileInputName} name={fileInputName} ... />
</label>
```

## 2) File preview for non-images
- Issue: `uploadedImage` is rendered in an `<img>`, but `accept` allows PDFs as well.
- Fix: Conditionally render preview only for image MIME types; otherwise show a file chip/name.

```jsx
{uploadedImage && isImage && <img src={uploadedImage} alt="Uploaded" ... />}
{uploadedFile && !isImage && <div>{uploadedFile.name}</div>}
```

## 3) Accessibility improvements
- Add `aria-busy={isAILoading}` on the form or fieldset.
- Ensure buttons have discernible text for screen readers (they do, but maintain as a guideline).
- Keep `aria-live="polite"` on the result container (already present).

## 4) Usage banner semantics
- Consider using MUI `<Alert severity="warning"/>` or `<Alert severity="info"/>` with dynamic severity when `remainingUses < 2` for better semantics and color contrast.

## 5) React Markdown usage
- Prefer the children form for better readability:

```jsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>{resultText}</ReactMarkdown>
```

## 6) Try-question UX guardrails
- If a service strictly requires a file, disable try-question buttons until a file is selected, or show a tooltip explaining a file is required.

## 7) Minor styling polish
- `variant="outlined"` combined with `bg-blue-800` yields unusual contrast. Consider moving to `contained` or removing background utility on outlined buttons.

## 8) Error message region
- Wrap error text with a role for screen readers:

```jsx
{error && <div role="alert" className="error-message">{error}</div>}
```
