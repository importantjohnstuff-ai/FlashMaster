# Guide: Adding New Card Sets for Static Hosting (GitHub Pages)

Because GitHub Pages environment is static, it cannot perform server-side directory scanning (like PHP's `glob` or `scandir`). To make new study sets (JSON files) available on the dashboard when hosted on GitHub, you must manually register them in the application logic.

## Prerequisites
- Ensure your JSON file follows the required schema:
  ```json
  [
    {
      "id": 1,
      "question": "Your question here?",
      "options": {
        "a": "Option A",
        "b": "Option B",
        "c": "Option C",
        "d": "Option D"
      },
      "answer": "a",
      "correct_answer_text": "Option A"
    }
  ]
  ```
- Make sure the JSON file is placed in the root directory of the project (alongside `index.html`).

## Steps to Register a New Set

### 1. Open `app.js`
Locate the `app.js` file in your repository.

### 2. Find the Hardcoded File List
Search for the `loadFileList` function. Inside that function, you will see a constant named `fileNames`. It looks like this:

```javascript
// Located around line 131
const fileNames = ['PEC1.json', 'PEC2.json', 'PEC3.json', 'PEC4.json', 'PEC5.json'];
```

### 3. Add Your New File
Add your new filename (including the `.json` extension) to the array. Ensure it is wrapped in single quotes and separated by a comma.

**Example (adding PEC6.json):**
```javascript
const fileNames = ['PEC1.json', 'PEC2.json', 'PEC3.json', 'PEC4.json', 'PEC5.json', 'PEC6.json'];
```

### 4. Save and Deploy
1. **Save** the `app.js` file.
2. **Commit** the changes to your local Git repository.
3. **Push** the changes to GitHub.

Once pushed, GitHub Pages will automatically rebuild, and your new set will appear in the "Select Sets" section of the dashboard.

## New Feature: Start from ID
To make studying easier, you can now select a starting ID when a single set is selected.
- This works automatically on GitHub Pages.
- It relies on the `id` field within your JSON files.
- If you enter an ID that doesn't exist (e.g., higher than any ID in the set), no cards will load for that session.

## Troubleshooting
- **File not appearing:** Double-check the spelling of the filename in `app.js` and ensure it matches the actual file on disk (it is case-sensitive on most servers).
- **Dashboard stuck on "Loading...":** This usually happens if the JSON file has a syntax error (like a missing comma). Open the browser console (F12) to see specific error messages.
- **Start from ID skip incorrect:** Ensure your JSON cards have sequential `id` numbers. The app skips cards by finding the first card where `id >= your input`.
