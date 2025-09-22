/**
 * Python Analysis Types
 * Type definitions for Python AST analysis results
 */

export interface PythonSymbol {
  name: string
  line: number
}

export interface PythonFunction extends PythonSymbol {
  end_line: number
  args: string[]
  decorators: string[]
  is_async: boolean
  has_docstring: boolean
  complexity: number
}

export interface PythonClass extends PythonSymbol {
  end_line: number
  bases: string[]
  decorators: string[]
  has_docstring: boolean
  methods: string[]
}

export interface PythonVariable extends PythonSymbol {
  context: string
}

export interface PythonImport extends PythonSymbol {
  type: 'import' | 'from_import'
  module?: string
  alias?: string
}

export interface PythonSymbols {
  functions: PythonFunction[]
  classes: PythonClass[]
  variables: PythonVariable[]
  imports: PythonImport[]
}

export interface PythonIssue {
  type: 'potential_issue' | 'code_smell' | 'suggestion'
  severity: 'error' | 'warning' | 'info'
  message: string
  line: number
  rule: string
}

export interface PythonAnalysisResult {
  success: boolean
  symbols?: PythonSymbols
  issues?: PythonIssue[]
  file_path?: string
  error?: string
  message?: string
  traceback?: string
}
