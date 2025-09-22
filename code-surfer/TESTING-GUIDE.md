# 🏄‍♂️ Code Surfer - Testing Instructions

## Quick Test Steps

### 1. Launch the Extension

1. **Open VS Code** with this project folder
2. **Press F5** to launch Extension Development Host
   - This opens a new VS Code window with your extension loaded
   - Watch the **Developer Console** (`Help` → `Toggle Developer Tools`) for logs

### 2. Look for the Sidebar

1. In the Extension Development Host window, look at the **Explorer panel** (left sidebar)
2. You should see **"Code Surfer Report"** as a section
3. If it's not visible, try:
   - `Ctrl+Shift+P` → Type **"Code Surfer: Show Code Surfer Report"**
   - Check `View` → `Explorer` to make sure Explorer is visible

### 3. Test with a JavaScript File

1. **Create a new file** with `.js` extension, for example: `test.js`
2. **Add some test code** with intentional issues:

   ```javascript
   // This should trigger unused variable warning
   const unusedVar = 'never used'

   // This should trigger async without await warning
   async function badAsync() {
     console.log('no await here')
     return 42
   }

   // Good code (no issues)
   function goodFunction() {
     const used = 'this is used'
     console.log(used)
   }
   ```

3. **Save the file** (`Ctrl+S`)

### 4. Expected Results

- **Sidebar**: Should show "Code Surfer Report" with issues found
- **Editor**: Should have subtle highlighting on problematic lines
- **Console**: Should show debug messages like:
  ```
  🏄‍♂️ Code Surfer extension is now active!
  ✅ Rules registered: unused-variable,async-without-await,long-function
  🌐 Code Surfer webview being resolved...
  ✅ Code Surfer webview HTML set
  ```

### 5. Manual Commands

If automatic analysis doesn't work, try these commands:

- `Ctrl+Shift+P` → **"Code Surfer: Analyze Current File"**
- `Ctrl+Shift+P` → **"Code Surfer: Refresh Analysis"**

### 6. Debugging Tips

If the sidebar still doesn't appear:

1. **Check Extension Load**: Look for "🏄‍♂️ Code Surfer extension is now active!" in console
2. **Check View Registration**: Look for "🔧 Registering webview provider" and "✅ Webview provider registered"
3. **Check File Support**: Make sure your test file has `.js`, `.ts`, `.jsx`, or `.tsx` extension
4. **Force Context**: In the Extension Development Host, run:
   ```
   Ctrl+Shift+P → "Developer: Set Context Key" → Key: "codeSurferEnabled" → Value: true
   ```

### 7. Alternative View Location

If the sidebar doesn't show in Explorer, the view might appear in:

- **Activity Bar** → Look for Code Surfer icon
- **View** menu → **Open View** → Search for "Code Surfer"

---

## Next Steps

If you see the sidebar but no analysis results:

1. Check console for error messages
2. Try the manual "Analyze Current File" command
3. Verify your test file has the expected issues

Let me know what you see and I can help debug further! 🔧
