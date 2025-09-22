import * as vscode from 'vscode'
import { AnalysisEngine } from './analysisEngine'
import { RuleRegistry } from './rules/ruleRegistry'
import { CodeSurferReportProvider } from './webview/reportProvider'
import { DecorationManager } from './decorations/decorationManager'
import { AnalyzerOptions, AnalysisReport } from './types'

/**
 * Main Code Surfer extension controller
 */
export class CodeSurferExtension {
  private analysisEngine: AnalysisEngine
  private reportProvider: CodeSurferReportProvider
  private decorationManager: DecorationManager
  private currentAnalysis = new Map<string, AnalysisReport>()

  constructor(private context: vscode.ExtensionContext) {
    console.log('🏄‍♂️ Initializing Code Surfer extension...')

    this.analysisEngine = new AnalysisEngine()
    this.reportProvider = new CodeSurferReportProvider(context.extensionUri)
    this.decorationManager = DecorationManager.getInstance()

    // Register all available rules
    RuleRegistry.registerAllRules(this.analysisEngine)
    console.log(
      '✅ Rules registered:',
      this.analysisEngine.getRules().map((r) => r.id)
    )

    this.setupCommands()
    this.setupEventListeners()
    this.setupWebviewProvider()

    // Set context for view visibility
    vscode.commands.executeCommand('setContext', 'codeSurferEnabled', true)
    console.log('✅ Code Surfer extension initialized successfully')
  }

  private setupCommands(): void {
    const commands = [
      vscode.commands.registerCommand('code-surfer.analyzeFile', () =>
        this.analyzeCurrentFile()
      ),
      vscode.commands.registerCommand('code-surfer.showReport', () =>
        this.showReport()
      ),
      vscode.commands.registerCommand('code-surfer.refreshAnalysis', () =>
        this.refreshAnalysis()
      ),
    ]

    commands.forEach((cmd) => this.context.subscriptions.push(cmd))
  }

  private setupEventListeners(): void {
    // Analyze when files are opened
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.shouldAnalyzeFile(editor.document)) {
          this.analyzeDocument(editor.document)
        }
      })
    )

    // Analyze when files are saved
    this.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.shouldAnalyzeFile(document)) {
          this.analyzeDocument(document)
        }
      })
    )

    // Clear analysis when files are closed
    this.context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        const uri = document.uri.toString()
        this.currentAnalysis.delete(uri)
        this.decorationManager.clearDocumentDecorations(uri)
      })
    )
  }

  private setupWebviewProvider(): void {
    console.log(
      '🔧 Registering webview provider for:',
      CodeSurferReportProvider.viewType
    )
    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        CodeSurferReportProvider.viewType,
        this.reportProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true,
          },
        }
      )
    )
    console.log('✅ Webview provider registered')
  }

  private shouldAnalyzeFile(document: vscode.TextDocument): boolean {
    const config = vscode.workspace.getConfiguration('codeSurfer')
    if (!config.get('enabled', true)) {
      return false
    }

    const supportedLanguages = [
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
    ]
    return (
      supportedLanguages.includes(document.languageId) &&
      document.uri.scheme === 'file'
    )
  }

  private async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found')
      return
    }

    if (!this.shouldAnalyzeFile(editor.document)) {
      vscode.window.showWarningMessage(
        'Current file is not supported for analysis'
      )
      return
    }

    await this.analyzeDocument(editor.document)
    vscode.window.showInformationMessage('Code analysis completed!')
  }

  private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('codeSurfer')
      const enabledRules = RuleRegistry.getDefaultEnabledRules()

      const options: AnalyzerOptions = {
        enabledRules,
        language: document.languageId as any,
      }

      const report = this.analysisEngine.analyzeFile(
        document.getText(),
        document.uri.fsPath,
        options
      )

      // Store the analysis result
      this.currentAnalysis.set(document.uri.toString(), report)

      // Update the webview report
      this.reportProvider.updateReport(report)

      // Apply decorations if enabled
      if (config.get('showInlineHints', true)) {
        const editor = vscode.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === document.uri.toString()
        )
        if (editor) {
          this.decorationManager.applyDecorations(editor, report.results)
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      vscode.window.showErrorMessage(`Code analysis failed: ${error}`)
    }
  }

  private showReport(): void {
    vscode.commands.executeCommand('codeSurferReport.focus')
  }

  private async refreshAnalysis(): Promise<void> {
    const editor = vscode.window.activeTextEditor
    if (editor && this.shouldAnalyzeFile(editor.document)) {
      // Clear current analysis
      const uri = editor.document.uri.toString()
      this.currentAnalysis.delete(uri)
      this.decorationManager.clearDecorations(editor)

      // Re-analyze
      await this.analyzeDocument(editor.document)
      vscode.window.showInformationMessage('Analysis refreshed!')
    } else {
      vscode.window.showWarningMessage('No supported file open for analysis')
    }
  }

  public dispose(): void {
    this.decorationManager.dispose()
    this.currentAnalysis.clear()
  }
}

let extension: CodeSurferExtension

export function activate(context: vscode.ExtensionContext) {
  console.log('🏄‍♂️ Code Surfer extension is now active!')

  // Set the context immediately
  vscode.commands.executeCommand('setContext', 'codeSurferEnabled', true)

  extension = new CodeSurferExtension(context)

  // Analyze the currently active editor if it exists
  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor) {
    // Check if we should analyze using the public interface
    const shouldAnalyze =
      [
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
      ].includes(activeEditor.document.languageId) &&
      activeEditor.document.uri.scheme === 'file'

    if (shouldAnalyze) {
      // Trigger analysis through command to ensure proper initialization
      setTimeout(() => {
        vscode.commands.executeCommand('code-surfer.analyzeFile')
      }, 1000)
    }
  }
}

export function deactivate() {
  if (extension) {
    extension.dispose()
  }
}
