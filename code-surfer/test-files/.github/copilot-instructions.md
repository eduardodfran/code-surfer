# Code Surfer Test Files - AI Coding Agent Instructions

## Project Overview
This workspace contains test files for the **Code Surfer** static analysis tool, which detects code quality issues and anti-patterns in JavaScript and Python codebases.

## Critical Understanding
These test files are **intentionally problematic** - they contain deliberate code smells, unused variables, overly complex functions, and anti-patterns that the Code Surfer tool is designed to detect. **Do not "fix" these issues** unless explicitly asked to create new test cases.

## File Structure & Purpose
- `sample.js` - Comprehensive JavaScript test cases with numbered issues (unused vars, async without await, long functions)
- `test_javascript.js` - Additional JavaScript patterns for analysis testing 
- `test_python.py` - Python-specific anti-patterns (mutable defaults, bare except, old string formatting)
- `try.js` - Minimal test cases for quick validation

## Code Patterns to Preserve

### JavaScript Test Patterns
- **Unused variables**: `const unusedVar = 'never used'` - Essential for testing unused variable detection
- **Async without await**: Functions marked `async` but containing no `await` statements
- **Long functions**: Functions with 50+ lines of repetitive code to test complexity detection
- **Good examples**: Well-structured async functions and proper variable usage for baseline comparison

### Python Test Patterns  
- **Mutable default arguments**: `def problematic_function(name, items=[]):`
- **Bare except clauses**: `except:` without specific exception types
- **Equality with None**: `if items == None:` instead of `is None`
- **Old string formatting**: `%` formatting instead of f-strings
- **Missing docstrings**: Methods without documentation

## When Making Changes
1. **Preserve intentional issues** - These are test cases, not bugs to fix
2. **Maintain comment annotations** - Comments like "should be detected" guide the analysis tool
3. **Keep good/bad pairs** - Each file contains both problematic and well-written examples for comparison
4. **Follow naming conventions** - Functions prefixed with "problematic", "bad", "good" indicate their purpose

## Development Workflow
- Files are designed for static analysis testing, not runtime execution
- Focus on code structure and patterns rather than functional logic
- When adding new test cases, include both the anti-pattern and a corrected example
- Comment new patterns clearly to explain what should be detected

## Key Insight
This is a **testing framework for code analysis tools** - treat the "bad" code as valuable test data, not code that needs improvement.