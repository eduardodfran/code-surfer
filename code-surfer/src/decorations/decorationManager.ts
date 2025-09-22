import * as vscode from 'vscode'
import { AnalysisResult, IssueSeverity, IssueCategory } from '../types'

/**
 * Manages editor decorations for Code Surfer analysis results
 */
export class DecorationManager {
  private static instance: DecorationManager

  // Decoration types for different severities
  private errorDecorationType!: vscode.TextEditorDecorationType
  private warningDecorationType!: vscode.TextEditorDecorationType
  private infoDecorationType!: vscode.TextEditorDecorationType

  // Store decorations by document URI
  private decorationsByDocument = new Map<
    string,
    vscode.TextEditorDecorationType[]
  >()

  private constructor() {
    this.createDecorationTypes()
  }

  public static getInstance(): DecorationManager {
    if (!DecorationManager.instance) {
      DecorationManager.instance = new DecorationManager()
    }
    return DecorationManager.instance
  }

  private createDecorationTypes(): void {
    this.errorDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      overviewRulerColor: new vscode.ThemeColor('errorForeground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      isWholeLine: false,
    })

    this.warningDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 165, 0, 0.1)',
      overviewRulerColor: new vscode.ThemeColor('warningForeground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      isWholeLine: false,
    })

    this.infoDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0, 123, 255, 0.05)',
      overviewRulerColor: new vscode.ThemeColor('infoForeground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      isWholeLine: false,
    })
  }

  /**
   * Apply decorations to an editor based on analysis results
   */
  public applyDecorations(
    editor: vscode.TextEditor,
    results: AnalysisResult[]
  ): void {
    // Clear existing decorations for this document
    this.clearDecorations(editor)

    if (!results || results.length === 0) {
      return
    }

    // Group results by severity
    const errorResults = results.filter(
      (r) => r.severity === IssueSeverity.ERROR
    )
    const warningResults = results.filter(
      (r) => r.severity === IssueSeverity.WARNING
    )
    const infoResults = results.filter((r) => r.severity === IssueSeverity.INFO)

    // Create decoration options for each severity
    const errorDecorations = this.createDecorationOptions(errorResults)
    const warningDecorations = this.createDecorationOptions(warningResults)
    const infoDecorations = this.createDecorationOptions(infoResults)

    // Apply decorations
    editor.setDecorations(this.errorDecorationType, errorDecorations)
    editor.setDecorations(this.warningDecorationType, warningDecorations)
    editor.setDecorations(this.infoDecorationType, infoDecorations)

    // Store the decoration types for this document
    const documentUri = editor.document.uri.toString()
    this.decorationsByDocument.set(documentUri, [
      this.errorDecorationType,
      this.warningDecorationType,
      this.infoDecorationType,
    ])
  }

  /**
   * Clear decorations from an editor
   */
  public clearDecorations(editor: vscode.TextEditor): void {
    const documentUri = editor.document.uri.toString()
    const decorationTypes = this.decorationsByDocument.get(documentUri)

    if (decorationTypes) {
      decorationTypes.forEach((decorationType) => {
        editor.setDecorations(decorationType, [])
      })
    }

    // Also clear the main decoration types
    editor.setDecorations(this.errorDecorationType, [])
    editor.setDecorations(this.warningDecorationType, [])
    editor.setDecorations(this.infoDecorationType, [])
  }

  /**
   * Clear all decorations for a specific document
   */
  public clearDocumentDecorations(documentUri: string): void {
    this.decorationsByDocument.delete(documentUri)

    // If there's an active editor for this document, clear its decorations
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.toString() === documentUri
    )

    if (editor) {
      this.clearDecorations(editor)
    }
  }

  private createDecorationOptions(
    results: AnalysisResult[]
  ): vscode.DecorationOptions[] {
    return results.map((result) => {
      const range = new vscode.Range(
        new vscode.Position(
          result.range.start.line,
          result.range.start.character
        ),
        new vscode.Position(result.range.end.line, result.range.end.character)
      )

      const hoverMessage = new vscode.MarkdownString()
      hoverMessage.appendMarkdown(
        `**${this.getSeverityIcon(result.severity)} Code Surfer**\n\n`
      )
      hoverMessage.appendMarkdown(`${result.message}\n\n`)

      if (result.suggestion) {
        hoverMessage.appendMarkdown(
          `💡 **Suggestion:** ${result.suggestion}\n\n`
        )
        hoverMessage.appendMarkdown(`_Use Ctrl+. (Cmd+.) for quick fixes_\n\n`)
      }

      hoverMessage.appendMarkdown(`*Rule: ${result.ruleId}*`)

      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage,
      }

      // Add a light bulb gutter icon for suggestions
      if (result.suggestion && result.category === IssueCategory.SUGGESTION) {
        decoration.renderOptions = {
          before: {
            contentText: '💡',
            margin: '0 0.2em 0 0',
            textDecoration: 'none; opacity: 0.7;',
          },
        }
      }

      return decoration
    })
  }

  private getSeverityIcon(severity: IssueSeverity): string {
    switch (severity) {
      case IssueSeverity.ERROR:
        return '🚨'
      case IssueSeverity.WARNING:
        return '⚠️'
      case IssueSeverity.INFO:
        return '💡'
      default:
        return 'ℹ️'
    }
  }

  /**
   * Dispose of all decoration types
   */
  public dispose(): void {
    this.errorDecorationType.dispose()
    this.warningDecorationType.dispose()
    this.infoDecorationType.dispose()
    this.decorationsByDocument.clear()
  }
}
