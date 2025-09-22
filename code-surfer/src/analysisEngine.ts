import * as parser from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import * as path from 'path'
import {
  Rule,
  AnalysisResult,
  AnalysisReport,
  AnalyzerOptions,
  IssueSeverity,
  IssueCategory,
} from './types'
import { PythonAnalyzer } from './python/pythonAnalyzer'
import { ConfigurationManager } from './config/configurationManager'

/**
 * Core analysis engine for Code Surfer
 */
export class AnalysisEngine {
  private rules: Map<string, Rule> = new Map()
  private pythonAnalyzer: PythonAnalyzer
  private configManager: ConfigurationManager

  constructor(extensionPath?: string) {
    // Rules will be registered here
    this.pythonAnalyzer = new PythonAnalyzer(extensionPath)
    this.configManager = new ConfigurationManager()
  }

  /**
   * Register a new analysis rule
   */
  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Get all registered rules
   */
  getRules(): Rule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get enabled rules based on options
   */
  getEnabledRules(options: AnalyzerOptions): Rule[] {
    return this.getRules().filter(
      (rule) =>
        rule.enabled &&
        (options.enabledRules.length === 0 ||
          options.enabledRules.includes(rule.id))
    )
  }

  /**
   * Detect language from file extension
   */
  detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
      case '.py':
      case '.pyw':
      case '.pyx':
        return 'python'
      case '.ts':
        return 'typescript'
      case '.tsx':
        return 'typescriptreact'
      case '.jsx':
        return 'javascriptreact'
      case '.js':
      case '.mjs':
      case '.cjs':
      default:
        return 'javascript'
    }
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(
    code: string,
    filePath: string,
    options?: Partial<AnalyzerOptions>
  ): Promise<AnalysisReport> {
    console.log('🏃‍♂️ AnalysisEngine.analyzeFile called')
    console.log('📁 File path:', filePath)

    const detectedLanguage = this.detectLanguage(filePath)
    const language = options?.language || detectedLanguage
    console.log('🎯 Language:', language)

    // Handle Python files differently
    if (language === 'python') {
      console.log('🐍 Using Python analyzer')
      const pythonReport = await this.pythonAnalyzer.analyzeFile(filePath)

      // Apply configuration filtering to Python results
      console.log('🎯 Applying configuration filtering to Python results')
      console.log(
        '📊 Python results before filtering:',
        pythonReport.results.length
      )
      const filteredResults = this.filterResultsByConfig(
        pythonReport.results,
        language
      )
      console.log('🔍 Python results after filtering:', filteredResults.length)

      return {
        ...pythonReport,
        results: filteredResults,
      }
    }

    // Handle JavaScript/TypeScript files with existing rule system
    const results: AnalysisResult[] = []
    const analyzerOptions: AnalyzerOptions = {
      enabledRules: options?.enabledRules || [],
      language: language as
        | 'javascript'
        | 'typescript'
        | 'javascriptreact'
        | 'typescriptreact',
    }
    const enabledRules = this.getEnabledRules(analyzerOptions)

    console.log(
      '📏 Found',
      enabledRules.length,
      'enabled rules:',
      enabledRules.map((r) => r.id)
    )

    for (const rule of enabledRules) {
      try {
        console.log(`🔧 Running rule: ${rule.id}`)
        const ruleResults = rule.analyze(code, filePath)
        console.log(`✅ Rule ${rule.id} found ${ruleResults.length} issues`)
        results.push(...ruleResults)
      } catch (error) {
        console.error(`❌ Error running rule ${rule.id}:`, error)
        // Continue with other rules even if one fails
      }
    }

    console.log('🎯 Total results:', results.length)

    // Filter results based on configuration
    const filteredResults = this.filterResultsByConfig(results, language)
    console.log('🔍 Filtered results:', filteredResults.length)

    return {
      filePath,
      results: filteredResults,
      timestamp: new Date(),
      language: language,
    }
  }

  /**
   * Parse JavaScript/TypeScript code into AST
   */
  parseCode(code: string, language: string): t.File | null {
    try {
      const isTypeScript =
        language === 'typescript' || language === 'typescriptreact'
      const isReact =
        language === 'javascriptreact' || language === 'typescriptreact'

      const plugins: parser.ParserPlugin[] = []

      if (isTypeScript) {
        plugins.push('typescript')
      }

      if (isReact) {
        plugins.push('jsx')
      }

      // Add common plugins
      plugins.push(
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining'
      )

      return parser.parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins,
      })
    } catch (error) {
      console.error('Parse error:', error)
      return null
    }
  }

  /**
   * Traverse AST with visitor pattern
   */
  traverseAST(ast: t.File, visitor: any): void {
    traverse(ast, visitor)
  }

  /**
   * Filter analysis results based on user configuration
   */
  private filterResultsByConfig(
    results: AnalysisResult[],
    language: string
  ): AnalysisResult[] {
    this.configManager.refresh()

    const configLanguage = this.configManager.mapLanguageId(language)
    const ruleConfig = this.configManager.getRuleConfig(configLanguage)

    console.log(
      '🔍 Filtering results for language:',
      language,
      '-> config language:',
      configLanguage
    )
    console.log('📋 Rule config:', Object.keys(ruleConfig))
    console.log('📊 Input results:', results.length)

    const filteredResults = results.filter((result) => {
      // Check if rule is enabled
      const rule = ruleConfig[result.ruleId]
      console.log(
        `🔧 Checking rule ${result.ruleId}:`,
        rule ? `enabled=${rule.enabled}` : 'not found'
      )

      if (!rule || !rule.enabled) {
        console.log(`❌ Rule ${result.ruleId} is disabled or not found`)
        return false
      }

      // Check if severity level should be shown
      const severityAllowed = this.configManager.shouldShowSeverity(
        result.severity
      )
      console.log(`📊 Severity ${result.severity} allowed:`, severityAllowed)
      if (!severityAllowed) {
        console.log(`❌ Severity ${result.severity} is disabled`)
        return false
      }

      console.log(`✅ Rule ${result.ruleId} passed filter`)
      return true
    })

    console.log('📤 Filtered results:', filteredResults.length)
    return filteredResults
  }

  /**
   * Get configuration manager
   */
  getConfigurationManager(): ConfigurationManager {
    return this.configManager
  }
}
