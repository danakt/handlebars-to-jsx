import { AST as Glimmer }                                                  from '@glimmer/syntax'
import * as Babel                                                          from '@babel/types'
import { resolveExpression, createRootChildren, createPath, appendToPath } from './expressions'

/**
 * Resolves block type
 */
export const resolveBlockStatement = (blockStatement: Glimmer.BlockStatement) => {
  switch (blockStatement.path.original) {
    case 'if': {
      return createConditionStatement(blockStatement)
    }

    case 'each': {
      const eachStatement = createEachStatement(blockStatement)

      // Babel.traverse(eachStatement, (node, parents) => {
      //   console.log(node, parents)
      // })

      return eachStatement
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
  blockStatement: Glimmer.BlockStatement
): Babel.ConditionalExpression | Babel.LogicalExpression => {
  const { program, inverse } = blockStatement
  const boolCondSubject: Babel.CallExpression = Babel.callExpression(
    Babel.identifier('Boolean'),
    [resolveExpression(blockStatement.params[0])] //
  )

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
  const eachSubject = appendToPath(createPath(pathExpression), Babel.identifier('map'))

  const callback = Babel.arrowFunctionExpression(
    [Babel.identifier('item')],
    createRootChildren(blockStatement.program.body)
  )

  return Babel.callExpression(eachSubject, [callback])
}
