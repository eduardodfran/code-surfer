#!/usr/bin/env python3
"""
Python AST Parser for Code Surfer
Analyzes Python files and returns structured AST information for rule processing.
"""

import ast
import json
import sys
import traceback
from typing import Dict, List, Any, Optional


class PythonASTAnalyzer:
    """Analyzes Python files using the AST module."""
    
    def __init__(self):
        self.issues: List[Dict[str, Any]] = []
        self.symbols: Dict[str, List[Dict[str, Any]]] = {
            'functions': [],
            'classes': [],
            'variables': [],
            'imports': []
        }
    
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """Parse a Python file and return analysis results."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            tree = ast.parse(content, filename=file_path)
            
            # Visit the AST and collect information
            self._analyze_node(tree, content.splitlines())
            
            return {
                'success': True,
                'symbols': self.symbols,
                'issues': self.issues,
                'file_path': file_path
            }
            
        except SyntaxError as e:
            return {
                'success': False,
                'error': 'syntax_error',
                'message': str(e),
                'line': getattr(e, 'lineno', 0),
                'column': getattr(e, 'offset', 0)
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'parse_error',
                'message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _analyze_node(self, node: ast.AST, lines: List[str]) -> None:
        """Recursively analyze AST nodes."""
        # Collect all names that are used (read)
        used_names = set()
        # Collect all names that are defined (stored)
        defined_names = set()
        
        for child in ast.walk(node):
            if isinstance(child, ast.FunctionDef):
                self._analyze_function(child, lines)
                defined_names.add(child.name)
            elif isinstance(child, ast.ClassDef):
                self._analyze_class(child, lines)
                defined_names.add(child.name) 
            elif isinstance(child, ast.Name):
                if isinstance(child.ctx, ast.Store):
                    self._analyze_variable(child, lines)
                    defined_names.add(child.id)
                elif isinstance(child.ctx, ast.Load):
                    used_names.add(child.id)
            elif isinstance(child, (ast.Import, ast.ImportFrom)):
                self._analyze_import(child, lines)
        
        # Check for unused variables (defined but not used)
        self._check_unused_variables(defined_names, used_names, lines)
        
        # Check for additional Python-specific issues
        self._check_python_specific_issues(node, lines)
    
    def _analyze_function(self, node: ast.FunctionDef, lines: List[str]) -> None:
        """Analyze function definitions."""
        func_info = {
            'name': node.name,
            'line': node.lineno,
            'end_line': getattr(node, 'end_lineno', node.lineno),
            'args': [arg.arg for arg in node.args.args],
            'decorators': [self._get_decorator_name(dec) for dec in node.decorator_list],
            'is_async': isinstance(node, ast.AsyncFunctionDef),
            'has_docstring': self._has_docstring(node),
            'complexity': self._calculate_complexity(node)
        }
        
        self.symbols['functions'].append(func_info)
        
        # Check for common issues
        self._check_function_issues(node, func_info, lines)
    
    def _analyze_class(self, node: ast.ClassDef, lines: List[str]) -> None:
        """Analyze class definitions."""
        class_info = {
            'name': node.name,
            'line': node.lineno,
            'end_line': getattr(node, 'end_lineno', node.lineno),
            'bases': [self._get_node_name(base) for base in node.bases],
            'decorators': [self._get_decorator_name(dec) for dec in node.decorator_list],
            'has_docstring': self._has_docstring(node),
            'methods': []
        }
        
        # Find methods
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                class_info['methods'].append(item.name)
        
        self.symbols['classes'].append(class_info)
    
    def _analyze_variable(self, node: ast.Name, lines: List[str]) -> None:
        """Analyze variable assignments."""
        var_info = {
            'name': node.id,
            'line': node.lineno,
            'context': 'store'
        }
        
        self.symbols['variables'].append(var_info)
    
    def _analyze_import(self, node, lines: List[str]) -> None:
        """Analyze import statements."""
        if isinstance(node, ast.Import):
            for alias in node.names:
                import_info = {
                    'type': 'import',
                    'module': alias.name,
                    'alias': alias.asname,
                    'line': node.lineno
                }
                self.symbols['imports'].append(import_info)
        
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                import_info = {
                    'type': 'from_import',
                    'module': node.module,
                    'name': alias.name,
                    'alias': alias.asname,
                    'line': node.lineno
                }
                self.symbols['imports'].append(import_info)
    
    def _check_function_issues(self, node: ast.FunctionDef, func_info: Dict[str, Any], lines: List[str]) -> None:
        """Check for common function-related issues."""
        # Long function check
        line_count = func_info['end_line'] - func_info['line'] + 1
        if line_count > 50:  # Configurable threshold
            self.issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f"Function '{func_info['name']}' is {line_count} lines long (consider breaking into smaller functions)",
                'line': func_info['line'],
                'rule': 'long-function'
            })
        
        # Missing docstring check
        if not func_info['has_docstring'] and not func_info['name'].startswith('_'):
            self.issues.append({
                'type': 'code_smell',
                'severity': 'info',
                'message': f"Public function '{func_info['name']}' is missing a docstring",
                'line': func_info['line'],
                'rule': 'missing-docstring'
            })
        
        # High complexity check
        if func_info['complexity'] > 10:  # Configurable threshold
            self.issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f"Function '{func_info['name']}' has high cyclomatic complexity ({func_info['complexity']})",
                'line': func_info['line'],
                'rule': 'high-complexity'
            })
    
    def _check_unused_variables(self, defined_names: set, used_names: set, lines: List[str]) -> None:
        """Check for variables that are defined but never used."""
        # Exclude some common variable names that might be intentionally unused
        exclude_patterns = {'_', '__', 'self', 'cls'}
        
        for name in defined_names:
            if (name not in used_names and 
                name not in exclude_patterns and 
                not name.startswith('_')):
                # Find the line where this variable was defined
                line_num = 1
                for i, line in enumerate(lines):
                    if f"{name} =" in line or f"{name}:" in line:
                        line_num = i + 1
                        break
                
                self.issues.append({
                    'type': 'code_smell',
                    'severity': 'info',
                    'message': f"Variable '{name}' is defined but never used",
                    'line': line_num,
                    'rule': 'unused-variable'
                })
    
    def _check_python_specific_issues(self, node: ast.AST, lines: List[str]) -> None:
        """Check for Python-specific code issues."""
        for child in ast.walk(node):
            # Check for bare except clauses
            if isinstance(child, ast.ExceptHandler) and child.type is None:
                self.issues.append({
                    'type': 'potential_issue',
                    'severity': 'warning',
                    'message': "Bare 'except:' clause. Consider catching specific exceptions.",
                    'line': child.lineno,
                    'rule': 'bare-except'
                })
            
            # Check for mutable default arguments
            elif isinstance(child, ast.FunctionDef):
                for default in child.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        self.issues.append({
                            'type': 'potential_issue',
                            'severity': 'warning',
                            'message': f"Mutable default argument in function '{child.name}'. Use None and create inside function.",
                            'line': child.lineno,
                            'rule': 'mutable-default-argument'
                        })
            
            # Check for == comparison with None, True, False
            elif isinstance(child, ast.Compare):
                for comparator in child.comparators:
                    if (isinstance(comparator, ast.Constant) and 
                        comparator.value in [None, True, False]):
                        if any(isinstance(op, ast.Eq) for op in child.ops):
                            value_name = str(comparator.value)
                            self.issues.append({
                                'type': 'code_smell',
                                'severity': 'info',
                                'message': f"Use 'is' instead of '==' when comparing with {value_name}",
                                'line': child.lineno,
                                'rule': 'comparison-with-singleton'
                            })
            
            # Check for string formatting issues
            elif isinstance(child, ast.BinOp) and isinstance(child.op, ast.Mod):
                if isinstance(child.left, ast.Constant) and isinstance(child.left.value, str):
                    self.issues.append({
                        'type': 'suggestion',
                        'severity': 'info',
                        'message': "Consider using f-strings or .format() instead of % formatting",
                        'line': child.lineno,
                        'rule': 'old-string-formatting'
                    })
    
    def _has_docstring(self, node) -> bool:
        """Check if a function or class has a docstring."""
        return (len(node.body) > 0 and 
                isinstance(node.body[0], ast.Expr) and 
                isinstance(node.body[0].value, ast.Constant) and 
                isinstance(node.body[0].value.value, str))
    
    def _get_decorator_name(self, decorator: ast.AST) -> str:
        """Get the name of a decorator."""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Attribute):
            return f"{self._get_node_name(decorator.value)}.{decorator.attr}"
        else:
            return str(decorator)
    
    def _get_node_name(self, node: ast.AST) -> str:
        """Get the name representation of an AST node."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_node_name(node.value)}.{node.attr}"
        else:
            return str(node)
    
    def _calculate_complexity(self, node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function."""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, ast.With):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'missing_file_path'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    analyzer = PythonASTAnalyzer()
    result = analyzer.parse_file(file_path)
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()