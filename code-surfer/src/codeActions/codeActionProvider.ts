import * as vscode from 'vscode'
import { AnalysisResult } from '../types'

/**
 * Provides code actions for Code Surfer analysis results
 */
export class CodeActionProvider implements vscode.CodeActionProvider {
  private results: Map<string, AnalysisResult[]> = new Map()

  /**
   * Update analysis results for a document
   */
  updateResults(
    document: vscode.TextDocument,
    results: AnalysisResult[]
  ): void {
    this.results.set(document.uri.toString(), results)
  }

  /**
   * Clear results for a document
   */
  clearResults(documentUri: string): void {
    this.results.delete(documentUri)
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const documentResults = this.results.get(document.uri.toString())
    if (!documentResults) {
      return []
    }

    const actions: vscode.CodeAction[] = []

    // Find results that overlap with the current range
    const relevantResults = documentResults.filter((result) => {
      const resultRange = new vscode.Range(
        new vscode.Position(
          result.range.start.line,
          result.range.start.character
        ),
        new vscode.Position(result.range.end.line, result.range.end.character)
      )
      return resultRange.intersection(range)
    })

    for (const result of relevantResults) {
      if (result.suggestion) {
        const action = this.createCodeAction(document, result)
        if (action) {
          actions.push(action)
        }
      }
    }

    return actions
  }

  private createCodeAction(
    document: vscode.TextDocument,
    result: AnalysisResult
  ): vscode.CodeAction | null {
    if (!result.suggestion) {
      return null
    }

    const action = new vscode.CodeAction(
      `💡 ${result.suggestion}`,
      vscode.CodeActionKind.QuickFix
    )

    action.diagnostics = []
    action.isPreferred = true

    const resultRange = new vscode.Range(
      new vscode.Position(
        result.range.start.line,
        result.range.start.character
      ),
      new vscode.Position(result.range.end.line, result.range.end.character)
    )

    // Generate edit based on the rule type
    const edit = this.generateEdit(document, result, resultRange)
    if (edit) {
      action.edit = edit
    }

    return action
  }

  private generateEdit(
    document: vscode.TextDocument,
    result: AnalysisResult,
    range: vscode.Range
  ): vscode.WorkspaceEdit | null {
    const edit = new vscode.WorkspaceEdit()
    const text = document.getText(range)

    let newText: string | null = null

    // Generate specific edits based on rule ID
    switch (result.ruleId) {
      case 'eslint-suggestions':
        newText = this.generateEslintEdit(text, result.message)
        break
      case 'unused-variable':
        // For unused variables, we could suggest removal
        if (result.message.includes('never used')) {
          // Don't auto-remove variables, just provide the suggestion
          return null
        }
        break
      default:
        return null
    }

    if (newText && newText !== text) {
      edit.replace(document.uri, range, newText)
      return edit
    }

    return null
  }

  private generateEslintEdit(
    originalText: string,
    message: string
  ): string | null {
    // Handle specific ESLint-style suggestions
    if (message.includes("Prefer 'const' over 'var'")) {
      return originalText.replace(/^var\s+/, 'const ')
    }

    if (message.includes("Prefer 'let' over 'var'")) {
      return originalText.replace(/^var\s+/, 'let ')
    }

    if (message.includes('Use strict equality operator')) {
      return originalText.replace(/\s==\s/, ' === ').replace(/\s!=\s/, ' !== ')
    }

    if (message.includes('Use includes() instead of indexOf()')) {
      // Transform array.indexOf(item) !== -1 to array.includes(item)
      const indexOfPattern = /(.+)\.indexOf\(([^)]+)\)\s*!==?\s*-1/
      const match = originalText.match(indexOfPattern)
      if (match) {
        return `${match[1]}.includes(${match[2]})`
      }
    }

    // For other suggestions, return null to let user implement manually
    return null
  }
}
