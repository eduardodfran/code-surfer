import * as t from '@babel/types'
import { NodePath } from '@babel/traverse'
import { AnalysisResult, IssueSeverity, IssueCategory } from '../types'
import { BaseRule } from './baseRule'

/**
 * Detects async functions that don't use await
 */
export class AsyncWithoutAwaitRule extends BaseRule {
  id = 'async-without-await'
  name = 'Async Without Await'
  description = 'Detects async functions that contain no await expressions'
  category = IssueCategory.POTENTIAL_ISSUE
  severity = IssueSeverity.WARNING

  protected getVisitor(results: AnalysisResult[], lines: string[]) {
    const asyncFunctions = new Map<NodePath, { hasAwait: boolean }>()

    return {
      Function: (path: NodePath<t.Function>) => {
        if (path.node.async) {
          asyncFunctions.set(path, { hasAwait: false })
        }
      },
      AwaitExpression: (path: NodePath<t.AwaitExpression>) => {
        // Find the containing async function
        let parent = path.getFunctionParent()
        if (parent && asyncFunctions.has(parent)) {
          asyncFunctions.get(parent)!.hasAwait = true
        }
      },
      Program: {
        exit: () => {
          for (const [funcPath, { hasAwait }] of asyncFunctions) {
            if (!hasAwait && t.isFunction(funcPath.node)) {
              const funcName = this.getFunctionName(funcPath.node)
              results.push(
                this.createResult(
                  `Async function '${funcName}' contains no await expressions`,
                  funcPath.node,
                  lines,
                  `Consider making this function synchronous or add await expressions`
                )
              )
            }
          }
        },
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
