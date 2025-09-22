# code-s# 🏄‍♂️ Code Surfer

**A friendly peer reviewer riding along your code, pointing out potential issues before they break things.**

Code Surfer is a VS Code extension that acts like a friendly peer reviewer, providing **advisory insights** about your JavaScript and TypeScript code. Unlike strict linters, it's **non-blocking** and focuses on giving helpful hints, warnings, and suggestions to improve your code quality.

## ✨ Features

### 🔍 Smart Code Analysis

- **Potential Issues**: Detects likely bugs and logic errors before runtime
- **Code Smells**: Identifies complexity and maintainability issues
- **Suggestions**: Provides best-practice hints and refactoring ideas

### 📊 Comprehensive Reporting

- **Sidebar Report**: Organized view of all findings by category
- **Inline Hints**: Subtle decorations directly in your code
- **Click-to-Navigate**: Jump directly to issues from the report

### ⚡ Real-time Analysis

- Analyzes files when opened or saved
- Non-intrusive background processing
- Configurable analysis behavior

## 🚀 Getting Started

1. **Install** the Code Surfer extension
2. **Open** a JavaScript or TypeScript file
3. **View** the "Code Surfer Report" in the Explorer sidebar
4. **Click** on any issue to jump to its location

## 📋 Currently Detected Issues

### 🚩 Potential Issues

- **Async Without Await**: Async functions that contain no await expressions
- _(More rules coming in future releases)_

### ⚠️ Code Smells

- **Long Functions**: Functions exceeding 50 lines (configurable)
- **Unused Variables**: Variables declared but never used

### 💡 Suggestions

- Best practice recommendations
- Refactoring opportunities
- _(Expanding with community feedback)_

## ⚙️ Configuration

Access settings through VS Code preferences (`Ctrl+,`) and search for "Code Surfer":

- `codeSurfer.enabled`: Enable/disable Code Surfer analysis (default: `true`)
- `codeSurfer.analyzeOnSave`: Automatically analyze files when saved (default: `true`)
- `codeSurfer.analyzeOnOpen`: Automatically analyze files when opened (default: `true`)
- `codeSurfer.showInlineHints`: Show inline hints and decorations (default: `true`)

## 🎯 Commands

- **Code Surfer: Analyze Current File** - Manually trigger analysis
- **Code Surfer: Show Code Surfer Report** - Focus the report panel
- **Code Surfer: Refresh Analysis** - Re-analyze the current file

## 🛠️ Supported Languages

- JavaScript (`.js`)
- TypeScript (`.ts`)
- React JSX (`.jsx`)
- React TSX (`.tsx`)

## 🔮 Roadmap

### Phase 1 (Current)

- ✅ Static analysis for JS/TS
- ✅ Sidebar report + inline hints
- ✅ Basic rule set

### Phase 2 (Coming Soon)

- 🔄 Python support
- 🔄 Configurable rule sets
- 🔄 Custom rule creation

### Phase 3 (Future)

- 🔮 AI-powered insights
- 🔮 Community rule sharing
- 🔮 Multi-language support

## 🐛 Known Issues

- Analysis is currently limited to individual files (no cross-file analysis)
- Some edge cases in TypeScript generic parsing may not be detected
- Large files (>1000 lines) may experience slight analysis delays

## 🤝 Contributing

Code Surfer is designed to be extensible! We welcome:

- Bug reports and feature requests
- New analysis rules
- Language support additions
- UI/UX improvements

## 📝 Release Notes

### 0.0.1 (Initial Release)

- Basic JavaScript/TypeScript analysis
- Sidebar report with issue categorization
- Inline decorations and hints
- Configurable analysis settings
- Core rule set: unused variables, async/await issues, long functions

---

**Happy coding! 🏄‍♂️**

*Code Surfer helps you catch waves... and bugs!*er README

This is the README for your extension "code-surfer". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
