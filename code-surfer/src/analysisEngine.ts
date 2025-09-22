import * as parser from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import {
  Rule,
  AnalysisResult,
  AnalysisReport,
  AnalyzerOptions,
  IssueSeverity,
  IssueCategory,
} from './types'

/**
 * Core analysis engine for Code Surfer
 */
export class AnalysisEngine {
  private rules: Map<string, Rule> = new Map()

  constructor() {
    // Rules will be registered here
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
   * Analyze a single file
   */
  analyzeFile(
    code: string,
    filePath: string,
    options: AnalyzerOptions
  ): AnalysisReport {
    const results: AnalysisResult[] = []
    const enabledRules = this.getEnabledRules(options)

    for (const rule of enabledRules) {
      try {
        const ruleResults = rule.analyze(code, filePath)
        results.push(...ruleResults)
      } catch (error) {
        console.error(`Error running rule ${rule.id}:`, error)
        // Continue with other rules even if one fails
      }
    }

    return {
      filePath,
      results,
      timestamp: new Date(),
      language: options.language,
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
}
