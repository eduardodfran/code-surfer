import * as t from '@babel/types'
import { NodePath } from '@babel/traverse'
import { AnalysisResult, IssueSeverity, IssueCategory } from '../types'
import { BaseRule } from './baseRule'

/**
 * Detects unused variables
 */
export class UnusedVariableRule extends BaseRule {
  id = 'unused-variable'
  name = 'Unused Variable'
  description = 'Detects variables that are declared but never used'
  category = IssueCategory.CODE_SMELL
  severity = IssueSeverity.WARNING

  protected getVisitor(results: AnalysisResult[], lines: string[]) {
    const declaredVars = new Map<string, { node: t.Node; path: NodePath }>()
    const usedVars = new Set<string>()

    return {
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        if (t.isIdentifier(path.node.id)) {
          declaredVars.set(path.node.id.name, { node: path.node.id, path })
        }
      },
      Identifier: (path: NodePath<t.Identifier>) => {
        // Don't count identifiers that are part of declarations
        if (path.isReferencedIdentifier()) {
          usedVars.add(path.node.name)
        }
      },
      Program: {
        exit: () => {
          for (const [varName, { node }] of declaredVars) {
            if (!usedVars.has(varName)) {
              results.push(
                this.createResult(
                  `Variable '${varName}' is declared but never used`,
                  node,
                  lines,
                  `Consider removing unused variable '${varName}' or use it in your code`
                )
              )
            }
          }
        },
      },
    }
  }
}
