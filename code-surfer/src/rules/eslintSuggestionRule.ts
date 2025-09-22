import * as t from '@babel/types'
import { NodePath } from '@babel/traverse'
import { AnalysisResult, IssueSeverity, IssueCategory } from '../types'
import { BaseRule } from './baseRule'

/**
 * Provides ESLint-style code suggestions for common patterns
 */
export class EslintSuggestionRule extends BaseRule {
  id = 'eslint-suggestions'
  name = 'ESLint Code Suggestions'
  description =
    'Provides inline code suggestions following ESLint best practices'
  category = IssueCategory.SUGGESTION
  severity = IssueSeverity.INFO

  protected getVisitor(results: AnalysisResult[], lines: string[]) {
    return {
      // Suggest const/let over var
      VariableDeclaration: (path: NodePath<t.VariableDeclaration>) => {
        if (path.node.kind === 'var') {
          const declarator = path.node.declarations[0]
          if (declarator && t.isVariableDeclarator(declarator)) {
            // Check if variable is reassigned
            const binding = path.scope.getBinding(
              t.isIdentifier(declarator.id) ? declarator.id.name : ''
            )
            const isReassigned = binding?.referencePaths.some((refPath) =>
              refPath.isAssignmentExpression()
            )

            const suggestion = isReassigned
              ? `Use 'let' instead of 'var': let ${
                  t.isIdentifier(declarator.id) ? declarator.id.name : '...'
                } = ...`
              : `Use 'const' instead of 'var': const ${
                  t.isIdentifier(declarator.id) ? declarator.id.name : '...'
                } = ...`

            results.push(
              this.createResult(
                `Prefer '${isReassigned ? 'let' : 'const'}' over 'var'`,
                path.node,
                lines,
                suggestion
              )
            )
          }
        }
      },

      // Suggest template literals over string concatenation and === over ==
      BinaryExpression: (path: NodePath<t.BinaryExpression>) => {
        // Check for string concatenation
        if (
          path.node.operator === '+' &&
          (t.isStringLiteral(path.node.left) ||
            t.isStringLiteral(path.node.right))
        ) {
          const leftIsString = t.isStringLiteral(path.node.left)
          const rightIsString = t.isStringLiteral(path.node.right)

          if (leftIsString || rightIsString) {
            results.push(
              this.createResult(
                'Consider using template literals instead of string concatenation',
                path.node,
                lines,
                'Use template literals: `${variable} text` instead of variable + " text"'
              )
            )
          }
        }

        // Check for == and != operators
        if (path.node.operator === '==' || path.node.operator === '!=') {
          const suggestion =
            path.node.operator === '=='
              ? 'Use strict equality: === instead of =='
              : 'Use strict inequality: !== instead of !='

          results.push(
            this.createResult(
              `Use strict ${
                path.node.operator === '==' ? 'equality' : 'inequality'
              } operator`,
              path.node,
              lines,
              suggestion
            )
          )
        }

        // Check for indexOf() !== -1 pattern
        if (
          (path.node.operator === '!==' || path.node.operator === '!=') &&
          t.isNumericLiteral(path.node.right) &&
          path.node.right.value === -1 &&
          t.isCallExpression(path.node.left) &&
          t.isMemberExpression(path.node.left.callee) &&
          t.isIdentifier(path.node.left.callee.property) &&
          path.node.left.callee.property.name === 'indexOf'
        ) {
          results.push(
            this.createResult(
              'Use includes() instead of indexOf() !== -1',
              path.node,
              lines,
              'Use includes(): array.includes(item) instead of array.indexOf(item) !== -1'
            )
          )
        }
      },

      // Suggest arrow functions for simple callbacks
      FunctionExpression: (path: NodePath<t.FunctionExpression>) => {
        // Check if it's a simple callback (e.g., in array methods)
        const parent = path.parent
        if (
          t.isCallExpression(parent) &&
          t.isMemberExpression(parent.callee) &&
          t.isIdentifier(parent.callee.property)
        ) {
          const methodName = parent.callee.property.name
          const arrayMethods = [
            'map',
            'filter',
            'reduce',
            'forEach',
            'find',
            'some',
            'every',
          ]

          if (arrayMethods.includes(methodName)) {
            results.push(
              this.createResult(
                'Consider using arrow function for cleaner syntax',
                path.node,
                lines,
                'Use arrow function: (param) => { ... } instead of function(param) { ... }'
              )
            )
          }
        }
      },

      // Suggest object shorthand
      ObjectExpression: (path: NodePath<t.ObjectExpression>) => {
        path.node.properties.forEach((prop) => {
          if (
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key) &&
            t.isIdentifier(prop.value) &&
            prop.key.name === prop.value.name
          ) {
            results.push(
              this.createResult(
                'Use object property shorthand',
                prop,
                lines,
                `Use shorthand: { ${prop.key.name} } instead of { ${prop.key.name}: ${prop.value.name} }`
              )
            )
          }
        })
      },

      // Suggest array destructuring
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        if (
          t.isIdentifier(path.node.id) &&
          t.isMemberExpression(path.node.init) &&
          t.isNumericLiteral(path.node.init.property)
        ) {
          const index = path.node.init.property.value
          if (index === 0 || index === 1) {
            results.push(
              this.createResult(
                'Consider using array destructuring',
                path.node,
                lines,
                `Use destructuring: const [${path.node.id.name}] = array instead of const ${path.node.id.name} = array[${index}]`
              )
            )
          }
        }
      },

      // Suggest optional chaining for nested property access
      MemberExpression: (path: NodePath<t.MemberExpression>) => {
        if (t.isMemberExpression(path.node.object) && !path.node.optional) {
          // Look for patterns like obj.prop.subprop that could benefit from optional chaining
          const parent = path.findParent(
            (p) =>
              t.isIfStatement(p.node) ||
              t.isConditionalExpression(p.node) ||
              t.isLogicalExpression(p.node)
          )

          if (parent) {
            results.push(
              this.createResult(
                'Consider using optional chaining for safer property access',
                path.node,
                lines,
                'Use optional chaining: obj?.prop?.subprop instead of checking each level'
              )
            )
          }
        }
      },
    }
  }
}
