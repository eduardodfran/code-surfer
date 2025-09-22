import * as t from '@babel/types'
import { NodePath } from '@babel/traverse'
import { AnalysisResult, IssueSeverity, IssueCategory } from '../types'
import { BaseRule } from './baseRule'

/**
 * Detects functions that are too long (code smell)
 */
export class LongFunctionRule extends BaseRule {
  id = 'long-function'
  name = 'Long Function'
  description =
    'Detects functions that are too long and might benefit from refactoring'
  category = IssueCategory.CODE_SMELL
  severity = IssueSeverity.INFO

  private readonly MAX_LINES = 50

  protected getVisitor(results: AnalysisResult[], lines: string[]) {
    return {
      Function: (path: NodePath<t.Function>) => {
        const startLine = path.node.loc?.start.line ?? 0
        const endLine = path.node.loc?.end.line ?? 0
        const functionLength = endLine - startLine + 1

        if (functionLength > this.MAX_LINES) {
          const funcName = this.getFunctionName(path.node)
          results.push(
            this.createResult(
              `Function '${funcName}' is ${functionLength} lines long (max recommended: ${this.MAX_LINES})`,
              path.node,
              lines,
              `Consider breaking this function into smaller, more focused functions`
            )
          )
        }
      },
    }
  }

  private getFunctionName(node: t.Function): string {
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name
    }
    if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
      return '<anonymous>'
    }
    return '<function>'
  }
}
