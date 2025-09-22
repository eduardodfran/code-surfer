# Code Surfer Development Guide

## Testing the Extension

### 1. Development Setup

```bash
cd code-surfer
npm install
npm run compile
```

### 2. Launch Extension Development Host

- Press `F5` in VS Code to launch a new Extension Development Host window
- Or use `Ctrl+Shift+P` → "Developer: Reload Window"

### 3. Test with Sample Files

Open the `test-files/sample.js` file in the development host to see:

- 🚩 Unused variable detection
- ⚠️ Async function without await
- 💡 Long function warning

### 4. View Results

- Check the "Code Surfer Report" in the Explorer sidebar
- Look for inline decorations in the editor
- Hover over highlighted code for detailed messages

### 5. Available Commands

- `Ctrl+Shift+P` → "Code Surfer: Analyze Current File"
- `Ctrl+Shift+P` → "Code Surfer: Show Code Surfer Report"
- `Ctrl+Shift+P` → "Code Surfer: Refresh Analysis"

## Adding New Rules

1. Create a new rule class in `src/rules/`
2. Extend `BaseRule` class
3. Implement the `getVisitor()` method
4. Register the rule in `src/rules/ruleRegistry.ts`

Example:

```typescript
export class MyCustomRule extends BaseRule {
  id = 'my-custom-rule'
  name = 'My Custom Rule'
  description = 'Detects custom patterns'
  category = IssueCategory.SUGGESTION
  severity = IssueSeverity.INFO

  protected getVisitor(results: AnalysisResult[], lines: string[]) {
    return {
      // AST visitor methods here
    }
  }
}
```

## Debugging

- Use `console.log()` in your code - output appears in the Extension Development Host console
- Set breakpoints in VS Code and use `F5` to debug
- Check the Developer Tools: `Help` → `Toggle Developer Tools`

## Building for Production

```bash
npm run package
```

This creates a `.vsix` file that can be installed via:

```bash
code --install-extension code-surfer-0.0.1.vsix
```
