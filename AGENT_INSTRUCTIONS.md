# Agent Instructions: Adding New Flashcard Sets

Hello future agent! This guide summarizes the standard procedure for adding a new flashcard set to the FlashMaster application and pushing those updates.

## 1. Create the JSON File
Create a new file in the root directory named `<SET_NAME>.json` (for example, `PROF1.json` or `ESAS7.json`).
The file must contain a JSON array of flashcard objects following this exact structure:

```json
[
  {
    "id": 1,
    "question": "Sample Question?",
    "options": {
      "a": "Option 1",
      "b": "Option 2",
      "c": "Option 3",
      "d": "Option 4"
    },
    "answer": "a",
    "correct_answer_text": "Option 1"
  }
]
```
*Note: Depending on user instructions, you may just create an empty array `[]` initially.*

## 2. Register the File in `app.js`
Open `app.js` and locate the `loadFileList` function (around line ~142).
Find the `fileNames` array variable and append the name of the newly created JSON file to it.

```javascript
// Example modification in app.js
const fileNames = ['PEC1.json', 'PEC2.json', ..., 'MATH1.json', 'PROF1.json'];
```

## 3. Version Control and Pushing
After successfully creating the JSON file and linking it in `app.js`:

1. Stage both files:
   `git add <new_file>.json app.js`
2. Commit with a descriptive message:
   `git commit -m "Add <SET_NAME> flashcard set and integrate into app"`

**Pushing Note for Agents:** 
An automated `git push` command executed directly from the background agent environment might fail if CLI Git authentication is missing. Execute the push, but if it fails with an authentication error (e.g., `could not read Username for 'https://github.com'`), inform the user so they can manually run `git push` from their own interactive terminal.
