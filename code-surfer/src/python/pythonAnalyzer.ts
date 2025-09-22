/**
 * Python AST Analyzer
 * Integrates with Python AST parser to provide analysis for Python files
 */

import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import {
  AnalysisResult,
  AnalysisReport,
  IssueSeverity,
  IssueCategory,
} from '../types'
import { PythonAnalysisResult, PythonIssue } from './pythonTypes'

export class PythonAnalyzer {
  private pythonScriptPath: string

  constructor(extensionPath?: string) {
    // Path to the Python AST parser script
    let basePath: string

    if (extensionPath) {
      // Use extension path when provided (from VS Code context)
      basePath = extensionPath
      console.log('🎯 Using extension path:', extensionPath)
    } else {
      // Fallback for when no extension path is provided
      basePath = path.join(__dirname, '..', '..')
      console.log('⚠️  Fallback to __dirname:', __dirname)
    }

    this.pythonScriptPath = path.join(
      basePath,
      'python-analyzer',
      'ast_parser.py'
    )
    console.log('📂 Python script path:', this.pythonScriptPath)
    console.log(
      '📄 Python script exists:',
      fs.existsSync(this.pythonScriptPath)
    )
  }

  /**
   * Analyze a Python file using the Python AST parser
   */
  async analyzeFile(filePath: string): Promise<AnalysisReport> {
    console.log('🐍 PythonAnalyzer.analyzeFile called for:', filePath)
    try {
      console.log('🔧 Running Python analyzer script...')
      const pythonResult = await this.runPythonAnalyzer(filePath)
      console.log('✅ Python analyzer result:', {
        success: pythonResult.success,
        issueCount: pythonResult.issues?.length || 0,
      })

      if (!pythonResult.success) {
        return {
          filePath,
          language: 'python',
          results: [
            {
              id: 'syntax_error',
              message: pythonResult.message || 'Failed to parse Python file',
              severity: IssueSeverity.ERROR,
              category: IssueCategory.POTENTIAL_ISSUE,
              range: {
                start: { line: 1, character: 0 },
                end: { line: 1, character: 0 },
              },
              ruleId: 'syntax_error',
            },
          ],
          timestamp: new Date(),
        }
      }

      // Convert Python issues to our standard format
      const results: AnalysisResult[] = (pythonResult.issues || []).map(
        this.convertPythonIssue
      )

      return {
        filePath,
        language: 'python',
        results,
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        filePath,
        language: 'python',
        results: [
          {
            id: 'analysis_error',
            message: `Analysis failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            severity: IssueSeverity.ERROR,
            category: IssueCategory.POTENTIAL_ISSUE,
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 0 },
            },
            ruleId: 'analysis_error',
          },
        ],
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check if Python is available on the system
   */
  async isPythonAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      cp.exec('python --version', (error) => {
        if (error) {
          // Try python3 as fallback
          cp.exec('python3 --version', (error2) => {
            resolve(!error2)
          })
        } else {
          resolve(true)
        }
      })
    })
  }

  /**
   * Get the Python command to use (python or python3)
   */
  private async getPythonCommand(): Promise<string> {
    return new Promise((resolve) => {
      cp.exec('python --version', (error) => {
        if (error) {
          resolve('python3')
        } else {
          resolve('python')
        }
      })
    })
  }

  /**
   * Run the Python AST analyzer script
   */
  private async runPythonAnalyzer(
    filePath: string
  ): Promise<PythonAnalysisResult> {
    const pythonCmd = await this.getPythonCommand()
    console.log('🔧 Python command:', pythonCmd)
    console.log('📁 Python script path:', this.pythonScriptPath)

    return new Promise((resolve, reject) => {
      const command = `${pythonCmd} "${this.pythonScriptPath}" "${filePath}"`
      console.log('⚡ Executing command:', command)

      cp.exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Python analyzer failed: ${error.message}\nStderr: ${stderr}`
            )
          )
          return
        }

        try {
          const result: PythonAnalysisResult = JSON.parse(stdout)
          resolve(result)
        } catch (parseError) {
          reject(
            new Error(
              `Failed to parse Python analyzer output: ${parseError}\nOutput: ${stdout}`
            )
          )
        }
      })
    })
  }

  /**
   * Convert Python issue to our standard AnalysisResult format
   */
  private convertPythonIssue(pythonIssue: PythonIssue): AnalysisResult {
    // Map Python severity to our severity enum
    let severity: IssueSeverity
    switch (pythonIssue.severity) {
      case 'error':
        severity = IssueSeverity.ERROR
        break
      case 'warning':
        severity = IssueSeverity.WARNING
        break
      case 'info':
      default:
        severity = IssueSeverity.INFO
        break
    }

    // Map Python issue type to our category enum
    let category: IssueCategory
    switch (pythonIssue.type) {
      case 'potential_issue':
        category = IssueCategory.POTENTIAL_ISSUE
        break
      case 'code_smell':
        category = IssueCategory.CODE_SMELL
        break
      case 'suggestion':
      default:
        category = IssueCategory.SUGGESTION
        break
    }

    return {
      id: `${pythonIssue.rule}_${pythonIssue.line}`,
      message: pythonIssue.message,
      severity,
      category,
      range: {
        start: { line: pythonIssue.line, character: 0 },
        end: { line: pythonIssue.line, character: 100 }, // Approximate end of line
      },
      ruleId: pythonIssue.rule,
    }
  }

  /**
   * Get supported file extensions for Python
   */
  getSupportedExtensions(): string[] {
    return ['.py', '.pyw', '.pyx']
  }

  /**
   * Check if a file is a Python file
   */
  isPythonFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return this.getSupportedExtensions().includes(ext)
  }
}
