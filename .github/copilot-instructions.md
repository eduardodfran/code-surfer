# copilot-instructions.md

## 📛 Project Name
**Code Surfer**  
*A VS Code extension that acts like a friendly peer reviewer riding along your code, pointing out potential issues before they break things.*  

---

## 🎯 Purpose
Code Surfer helps programmers by **predicting what might be wrong in a file**.  
It combines **static analysis** (like linting) with **advisory insights** (like a human reviewer).  
Unlike strict linters, it’s **non-blocking**: it gives *hints, warnings, and suggestions* without interrupting the workflow.  

---

## 🧠 Core Behaviors
- Analyze the **entire file** instead of just isolated lines.  
- Detect **potential issues** (likely bugs, logic errors, smells).  
- Generate a **sidebar report** with categories:  
  - 🚩 **Potential Issues** – things that could cause runtime/logic errors.  
  - ⚠️ **Code Smells** – complexity, bad practices, maintainability risks.  
  - 💡 **Suggestions** – best-practice hints or possible refactors.  
- Provide **inline hints** using subtle decorations.  
- Stay **advisory** → never block commits or builds.  

---

## 📊 Example Output (Sidebar Report)

**File: `userService.js`**

```text
🚩 Potential Issues
- Function `getUser` is async but contains no `await`. Did you mean to make it synchronous?  
- Variable `data` declared but never used.  

⚠️ Code Smells
- `processUserData()` is 120 lines long (consider breaking into smaller functions).  

💡 Suggestions
- Use environment variables for API URL instead of hardcoding.

---

### **Part 2 – Implementation Notes**

```markdown
## 🔧 Implementation Notes

### Core Tech
- **Language:** TypeScript  
- **Framework:** [VS Code Extension API](https://code.visualstudio.com/api)  
- **Scaffolding:** `yo code` (Yeoman generator for VS Code)  
- **Packaging:** `vsce` (VS Code Extension Manager)  

### Static Analysis & Parsing
- **JavaScript/TypeScript:**  
  - [ESLint](https://eslint.org/) for common rules.  
  - [Babel Parser](https://babel.dev/docs/babel-parser) for AST parsing.  
  - TypeScript Compiler API for deep inspection.  
- **Python (Phase 2):**  
  - [Astroid](https://pypi.org/project/astroid/) / [Pyright](https://github.com/microsoft/pyright).  
- **Multi-language option:** [Tree-sitter](https://tree-sitter.github.io/tree-sitter/).  

### UI/UX Inside VS Code
- **Decorations API** → inline squiggles and highlights.  
- **Webviews** → sidebar “Code Surfer Report.”  
- **Status Bar API** → quick summary of findings.  

### Optional AI (Phase 3)
- OpenAI API or local LLMs (Ollama, LLaMA.cpp).  
- Natural language explanations like:  
  - “This regex may fail with Unicode characters.”  
  - “Consider validating parameters — this function accepts raw input.”

## 🧑‍💻 Target Users
- Solo developers who want **early debugging help**.  
- Teams maintaining **legacy codebases**.  
- Learners who need **best-practice reminders** without strict enforcement.  

---

## 🚦 Roadmap

### Phase 1 (MVP)
- Static rules for JS/TS.  
- Sidebar + inline hints.  

### Phase 2
- Add Python support.  
- Configurable rule sets.  

### Phase 3
- AI-powered hints.  
- Community-driven rule contributions.  

---

## ✅ Success Criteria
- Detects real-world issues **before runtime/compilation**.  
- Provides **useful, non-intrusive insights**.  
- Easy to adopt for **beginners and pros**.  
- Extensible to **multiple languages**.  
