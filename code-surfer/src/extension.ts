import * as vscode from 'vscode'
import { AnalysisEngine } from './analysisEngine'
import { RuleRegistry } from './rules/ruleRegistry'
import { CodeSurferReportProvider } from './webview/reportProvider'
import { DecorationManager } from './decorations/decorationManager'
import { ConfigurationManager } from './config/configurationManager'
import { CodeActionProvider } from './codeActions/codeActionProvider'
import { AnalysisReport, AnalyzerOptions } from './types'

/**
 * Main Code Surfer extension controller
 */
export class CodeSurferExtension {
  private analysisEngine: AnalysisEngine
  private reportProvider: CodeSurferReportProvider
  private decorationManager: DecorationManager
  private configManager: ConfigurationManager
  private codeActionProvider: CodeActionProvider
  private currentAnalysis = new Map<string, AnalysisReport>()

  constructor(private context: vscode.ExtensionContext) {
    console.log('🏄‍♂️ Initializing Code Surfer extension...')
    console.log('📁 Extension path:', context.extensionPath)

    this.analysisEngine = new AnalysisEngine(context.extensionPath)
    this.reportProvider = new CodeSurferReportProvider(context.extensionUri)
    this.decorationManager = DecorationManager.getInstance()
    this.configManager = new ConfigurationManager()
    this.codeActionProvider = new CodeActionProvider()

    // Register all available rules
    RuleRegistry.registerAllRules(this.analysisEngine)
    console.log(
      '✅ Rules registered:',
      this.analysisEngine.getRules().map((r) => r.id)
    )

    this.setupCommands()
    this.setupEventListeners()
    this.setupWebviewProvider()
    this.setupCodeActionProvider()

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

      vscode.commands.registerCommand('code-surfer.openSettings', () =>
        this.openSettings()
      ),

      vscode.commands.registerCommand('code-surfer.resetRuleConfig', () =>
        this.resetRuleConfig()
      ),

      // Debug command to test Python analysis directly
      vscode.commands.registerCommand('code-surfer.testPython', async () => {
        const editor = vscode.window.activeTextEditor
        if (!editor) {
          vscode.window.showErrorMessage('No active editor')
          return
        }

        console.log('🧪 Testing Python analysis on:', editor.document.fileName)
        try {
          const report = await this.analysisEngine.analyzeFile(
            editor.document.getText(),
            editor.document.fileName
          )
          console.log('🧪 Python analysis result:', report)
          vscode.window.showInformationMessage(
            `Python analysis completed: ${report.results.length} issues found`
          )
        } catch (error) {
          console.error('🧪 Python analysis error:', error)
          vscode.window.showErrorMessage(`Python analysis failed: ${error}`)
        }
      }),
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
        this.codeActionProvider.clearResults(uri)
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

  private setupCodeActionProvider(): void {
    console.log('🔧 Registering Code Action Provider')

    // Register for JavaScript and TypeScript files
    const selector: vscode.DocumentSelector = [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'typescriptreact' },
    ]

    this.context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        selector,
        this.codeActionProvider,
        {
          providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
        }
      )
    )
  }

  private shouldAnalyzeFile(document: vscode.TextDocument): boolean {
    if (!this.configManager.isEnabled()) {
      return false
    }

    const supportedLanguages = this.configManager.getSupportedLanguages()
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
      console.log('🔍 Starting analysis for:', document.fileName)
      console.log('📄 Language:', document.languageId)
      console.log('📝 Content length:', document.getText().length)

      // Refresh configuration and get enabled rules for the language
      this.configManager.refresh()
      const language = this.configManager.mapLanguageId(document.languageId)
      const enabledRules = this.configManager.getEnabledRules(language)
      console.log('📋 Enabled rules for', language, ':', enabledRules)

      const options: AnalyzerOptions = {
        enabledRules,
        language: document.languageId as any,
      }

      console.log('⚙️ Analysis options:', options)

      const report = await this.analysisEngine.analyzeFile(
        document.getText(),
        document.uri.fsPath,
        options
      )

      console.log(
        '📊 Analysis complete! Found',
        report.results.length,
        'issues'
      )
      console.log(
        '🔍 Issues:',
        report.results.map((r) => `${r.ruleId}: ${r.message}`)
      )

      // Store the analysis result
      this.currentAnalysis.set(document.uri.toString(), report)

      // Update the webview report
      console.log('📤 Sending report to webview...')
      this.reportProvider.updateReport(report)

      // Apply decorations if enabled
      if (this.configManager.showInlineHints()) {
        const editor = vscode.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === document.uri.toString()
        )
        if (editor) {
          console.log('🎨 Applying decorations...')
          this.decorationManager.applyDecorations(editor, report.results)

          // Update code action provider with the new results
          console.log('💡 Updating code actions...')
          this.codeActionProvider.updateResults(editor.document, report.results)
        }
      }

      console.log('✅ Analysis workflow complete!')
    } catch (error) {
      console.error('❌ Analysis error:', error)
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

  /**
   * Open Code Surfer settings
   */
  private async openSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'codeSurfer'
    )
  }

  /**
   * Reset rule configuration to defaults
   */
  private async resetRuleConfig(): Promise<void> {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage(
        'No active editor to determine language.'
      )
      return
    }

    const language = this.configManager.mapLanguageId(
      editor.document.languageId
    )

    const result = await vscode.window.showWarningMessage(
      `Reset ${language} rule configuration to defaults?`,
      { modal: true },
      'Reset'
    )

    if (result === 'Reset') {
      await this.configManager.resetRuleConfig(language)
      vscode.window.showInformationMessage(
        `${language} rule configuration reset to defaults.`
      )

      // Re-analyze current document
      if (this.shouldAnalyzeFile(editor.document)) {
        await this.analyzeDocument(editor.document)
      }
    }
  }

  public dispose(): void {
    this.decorationManager.dispose()
    this.currentAnalysis.clear()
  }
}

let extension: CodeSurferExtension

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('=== CODE SURFER EXTENSION ACTIVATED ===')
    console.log('🏄‍♂️ Code Surfer extension activate() called!')
    console.log('📁 Extension path:', context.extensionPath)

    // Also show an alert to make sure the extension is running
    vscode.window.showInformationMessage('🏄‍♂️ Code Surfer Extension Loaded!')

    // Set the context immediately
    vscode.commands.executeCommand('setContext', 'codeSurferEnabled', true)

    console.log('🚀 Creating CodeSurferExtension instance...')
    extension = new CodeSurferExtension(context)
    console.log('✅ CodeSurferExtension created successfully!')

    // Analyze the currently active editor if it exists
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      console.log('📝 Active editor found:', activeEditor.document.fileName)
      // Check if we should analyze using the public interface
      const shouldAnalyze =
        [
          'javascript',
          'typescript',
          'javascriptreact',
          'typescriptreact',
        ].includes(activeEditor.document.languageId) &&
        activeEditor.document.uri.scheme === 'file'

      console.log(
        '🔍 Should analyze:',
        shouldAnalyze,
        'Language:',
        activeEditor.document.languageId
      )

      if (shouldAnalyze) {
        // Trigger analysis through command to ensure proper initialization
        console.log('⏰ Setting up delayed analysis...')
        setTimeout(() => {
          console.log('🎯 Triggering analysis command...')
          vscode.commands.executeCommand('code-surfer.analyzeFile')
        }, 1000)
      }
    } else {
      console.log('📄 No active editor found')
    }

    console.log('🎉 Extension activation complete!')
  } catch (error) {
    console.error('❌ Extension activation failed:', error)
    vscode.window.showErrorMessage(`Code Surfer failed to activate: ${error}`)
  }
}

export function deactivate() {
  if (extension) {
    extension.dispose()
  }
}
