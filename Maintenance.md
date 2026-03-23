# HOSTEDFLASHER — Maintenance & Update Guide

`HOSTEDFLASHER/` is the static GitHub Pages version of `flasher/`. Because GitHub Pages cannot run PHP, all JSON data files must be manually copied and the file list in `app.js` must be kept updated by hand.

---

## Architecture

| | `flasher/` (Source of Truth) | `HOSTEDFLASHER/` (GitHub Pages) |
|---|---|---|
| **File discovery** | `list_files.php` scans directory dynamically | Hardcoded array in `app.js` |
| **Answer saving** | `update_answer.php` writes to JSON files | Not supported (read-only) |
| **JSON files** | Edited/added here first | Manually copied from `flasher/` |

---

## Full Update Procedure

Run these steps whenever a new JSON set is added or an existing one is updated in `flasher/`.

### Step 1: Copy JSON files from `flasher/`

Copy all JSON card sets from `flasher/` into `HOSTEDFLASHER/`:

```powershell
Copy-Item -Path "flasher\*.json" -Destination "HOSTEDFLASHER\" -Force
```

**Verify counts match:**
```powershell
(Get-ChildItem "flasher\*.json").Count
(Get-ChildItem "HOSTEDFLASHER\*.json").Count
```

### Step 1.5: Verify JSON Syntax

Before updating the file list or pushing to GitHub, ensure the copied JSON files have no syntax errors. GitHub Pages will fail to load the app if any JSON is malformed.

Run this command for each new/updated file (e.g., `ESAS3.json`):
```powershell
node -e "require('./ESAS3.json')"
```
If there is an error, it will print the line number and position (e.g., `Unexpected token [ in JSON at position 1202`). If there is no output, the file is valid.

### Step 2: Update the hardcoded file list in `app.js`

Open `HOSTEDFLASHER\app.js` and find the `loadFileList` function (around line 131). Update the `fileNames` array to match every `.json` file now in the folder.

**Current file list (as of 2026-03-23):**
```javascript
const fileNames = ['PEC1.json', 'PEC2.json', 'PEC3.json', 'PEC4.json', 'PEC5.json', 'PEC6.json', 'ESAS1.json', 'ESAS2.json', 'ESAS3.json', 'MATH1.json'];
```

> **Rule:** Every `.json` file in `HOSTEDFLASHER/` must appear in this array, or it will not show up on the dashboard. Conversely, any name in the array that has no matching file will cause a loading error.

### Step 3: Commit and push to GitHub

```bash
cd HOSTEDFLASHER
git add .
git commit -m "Sync JSON sets from flasher"
git push
```

GitHub Pages will rebuild automatically within ~30 seconds.

---

## Adding a Brand-New Card Set

1. **Create the JSON file in `flasher/`** (the source of truth — never create it directly in `HOSTEDFLASHER/`).
2. Ensure the JSON follows the required schema:
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
3. Follow the **Full Update Procedure** above (copy file → update `fileNames` array → push).

---

## New Feature: Start from ID

When a single set is selected, you can enter a starting card ID to skip ahead.
- Relies on the `id` field in each JSON card.
- If the entered ID exceeds all IDs in the set, no cards will load.
- Works automatically on GitHub Pages (no server needed).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **File not appearing on dashboard** | Check spelling in `fileNames` array in `app.js`; filenames are case-sensitive |
| **"Loading..." forever** | JSON syntax error — run **Step 1.5** or open browser console (F12) |
| **Start from ID skips wrong card** | Ensure `id` fields are sequential integers in your JSON |
| **File count mismatch** | Re-run the copy command from Step 1 and recount |
