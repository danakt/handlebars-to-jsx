import { AST as Glimmer }                                                  from '@glimmer/syntax'
import * as Babel                                                          from '@babel/types'
import { resolveExpression, createRootChildren, createPath, appendToPath } from './expressions'
import { createFragment }                                                  from './elements'
import { DEFAULT_NAMESPACE_NAME, DEFAULT_KEY_NAME }                        from './constants'

/**
 * Resolves block type
 */
export const resolveBlockStatement = (blockStatement: Glimmer.BlockStatement) => {
  switch (blockStatement.path.original) {
    case 'if': {
      return createConditionStatement(blockStatement, false)
    }

    case 'unless': {
      return createConditionStatement(blockStatement, true)
    }

    case 'each': {
      return createEachStatement(blockStatement)
    }

    default: {
      throw new Error(`Unexpected ${blockStatement.path.original} statement`)
    }
  }
}

/**
 * Creates condition statement
 */
export const createConditionStatement = (
  blockStatement: Glimmer.BlockStatement,
  invertCondition: boolean
): Babel.ConditionalExpression | Babel.LogicalExpression => {
  const { program, inverse } = blockStatement
  let boolCondSubject: Babel.CallExpression | Babel.UnaryExpression = Babel.callExpression(
    Babel.identifier('Boolean'),
    [resolveExpression(blockStatement.params[0])]
  )

  if (invertCondition) {
    boolCondSubject = Babel.unaryExpression('!', boolCondSubject)
  }

  if (inverse == null) {
    // Logical expression
    // {Boolean(variable) && <div />}
    return Babel.logicalExpression('&&', boolCondSubject, createRootChildren(program.body))
  } else {
    // Ternary expression
    // {Boolean(variable) ? <div /> : <span />}
    return Babel.conditionalExpression(
      boolCondSubject,
      createRootChildren(program.body),
      createRootChildren(inverse.body)
    )
  }
}

/**
 * Creates each block statement
 */
export const createEachStatement = (blockStatement: Glimmer.BlockStatement) => {
  const pathExpression = blockStatement.params[0] as Glimmer.PathExpression
  const iterator = appendToPath(createPath(pathExpression), Babel.identifier('map'))

  const mapCallbackChildren = createRootChildren(blockStatement.program.body)

  // If top-level child element is JS expression, wrap into fragment to add
  // the "key" attribute.
  const wrappedCallbackChildren = !Babel.isJSXElement(mapCallbackChildren)
    ? createFragment([Babel.jsxExpressionContainer(mapCallbackChildren)])
    : mapCallbackChildren

  // Adding the "key" attribute to child element
  wrappedCallbackChildren.openingElement.attributes.push(
    Babel.jsxAttribute(Babel.jsxIdentifier('key'), Babel.jsxExpressionContainer(Babel.identifier(DEFAULT_KEY_NAME)))
  )

  const mapCallback = Babel.arrowFunctionExpression(
    [Babel.identifier(DEFAULT_NAMESPACE_NAME), Babel.identifier(DEFAULT_KEY_NAME)],
    wrappedCallbackChildren
  )

  return Babel.callExpression(iterator, [mapCallback])
}
