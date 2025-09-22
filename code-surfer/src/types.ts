/**
 * Core types for Code Surfer analysis
 */

export enum IssueSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum IssueCategory {
  POTENTIAL_ISSUE = 'potential-issue',
  CODE_SMELL = 'code-smell',
  SUGGESTION = 'suggestion',
}

export interface Position {
  line: number
  character: number
}

export interface Range {
  start: Position
  end: Position
}

export interface AnalysisResult {
  id: string
  message: string
  severity: IssueSeverity
  category: IssueCategory
  range: Range
  ruleId: string
  suggestion?: string
}

export interface AnalysisReport {
  filePath: string
  results: AnalysisResult[]
  timestamp: Date
  language: string
}

export interface Rule {
  id: string
  name: string
  description: string
  category: IssueCategory
  severity: IssueSeverity
  enabled: boolean
  analyze(code: string, filePath: string): AnalysisResult[]
}

export interface AnalyzerOptions {
  enabledRules: string[]
  language:
    | 'javascript'
    | 'typescript'
    | 'javascriptreact'
    | 'typescriptreact'
    | 'python'
}
