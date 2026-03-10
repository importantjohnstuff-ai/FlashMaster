# How to Update HostedFlasher

`HOSTEDFLASHER` is the static GitHub Pages version of `flasher`.

Because GitHub Pages cannot execute PHP:
1. All JSON data files must be manually copied from `flasher/`.
2. The file list in `app.js` is **hardcoded** and must be updated by hand when new files are added.
3. Operations like "Change Correct Answer" use `localStorage` instead of permanently modifying the JSON files via `update_answer.php`.

---

## 🚀 Future Agent Sync Instructions

If the USER asks you to update or sync `HostedFlasher` from the main `flasher` directory, you must do the following:

### Step 1: Copy over all the files
Run the following PowerShell command to overwrite the static frontend files and copy over all the JSON question sets:
```powershell
Copy-Item -Path "flasher\*.json" -Destination "HOSTEDFLASHER\" -Force
Copy-Item -Path "flasher\index.html" -Destination "HOSTEDFLASHER\index.html" -Force
Copy-Item -Path "flasher\style.css" -Destination "HOSTEDFLASHER\style.css" -Force
```

### Step 2: Inject the Static `fileNames` Array
You must copy over `flasher/app.js` to `HOSTEDFLASHER/app.js`, but you **MUST NOT** leave the `list_files.php` endpoint. 
1. Copy `flasher/app.js` to `HOSTEDFLASHER/app.js`.
2. Read the directory contents of `HOSTEDFLASHER` to see exactly which `.json` files were copied over.
3. Open `HOSTEDFLASHER/app.js`. Look for `async function loadFileList()`.
4. Replace the entire function or the `fetch('list_files.php')` block with a hardcoded `fileNames` array, like so:
   ```javascript
   const fileNames = ['PEC1.json', 'PEC2.json', 'PEC3.json', 'PEC4.json', 'PEC5.json', 'PEC6.json', 'ESAS1.json', 'ESAS2.json']; // Make sure to add any new files to this array!
   ```
   **Important**: Every `.json` file in `HOSTEDFLASHER/` must appear in this array, or it will not show up on the dashboard.

### Step 3: Inject the `localStorage` Override Logic
Because `update_answer.php` does not exist on GitHub pages, we rely on local overrides. 
You must inject `localStorage` logic into `app.js` to intercept and manage user edits. Look at previous commits of `HOSTEDFLASHER/app.js` to see how `saveCorrectAnswer()` was modified and how the overrides were injected cleanly into `loadData`, `loadMultipleFiles`, and `openSearchModal` right after the data was fetched via `response.json()`.

### Step 4: Clean up
Make sure you delete any stray PHP files in `HOSTEDFLASHER/`:
```powershell
Remove-Item -Path "HOSTEDFLASHER\*.php" -Force
```

### Step 5: Commit and Push
```powershell
cd HOSTEDFLASHER
git add .
git commit -m "Sync Flasher to HostedFlasher"
git push
```
