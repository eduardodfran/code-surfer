import * as t from '@babel/types'
import { NodePath } from '@babel/traverse'
import {
  Rule,
  AnalysisResult,
  IssueSeverity,
  IssueCategory,
  Range,
  Position,
} from '../types'
import { AnalysisEngine } from '../analysisEngine'

/**
 * Base class for AST-based analysis rules
 */
export abstract class BaseRule implements Rule {
  abstract id: string
  abstract name: string
  abstract description: string
  abstract category: IssueCategory
  abstract severity: IssueSeverity
  enabled: boolean = true

  constructor(protected engine: AnalysisEngine) {}

  analyze(code: string, filePath: string): AnalysisResult[] {
    const ast = this.engine.parseCode(code, this.getLanguageFromPath(filePath))
    if (!ast) {
      return []
    }

    const results: AnalysisResult[] = []
    const lines = code.split('\n')

    this.engine.traverseAST(ast, this.getVisitor(results, lines))

    return results
  }

  protected abstract getVisitor(results: AnalysisResult[], lines: string[]): any

  protected createResult(
    message: string,
    node: t.Node,
    lines: string[],
    suggestion?: string
  ): AnalysisResult {
    const range = this.nodeToRange(node, lines)
    return {
      id: `${this.id}-${Date.now()}-${Math.random()}`,
      message,
      severity: this.severity,
      category: this.category,
      range,
      ruleId: this.id,
      suggestion,
    }
  }

  protected nodeToRange(node: t.Node, lines: string[]): Range {
    const startLine = (node.loc?.start.line ?? 1) - 1
    const endLine = (node.loc?.end.line ?? 1) - 1
    const startChar = node.loc?.start.column ?? 0
    const endChar = node.loc?.end.column ?? 0

    return {
      start: { line: startLine, character: startChar },
      end: { line: endLine, character: endChar },
    }
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'ts':
        return 'typescript'
      case 'tsx':
        return 'typescriptreact'
      case 'jsx':
        return 'javascriptreact'
      case 'js':
      default:
        return 'javascript'
    }
  }
}
