import { AST as Glimmer }                         from '@glimmer/syntax'
import * as Babel                                 from '@babel/types'
import { convertRootChildren, convertExpression } from './converter'

export const resolveBlockStatement = (blockStatement: Glimmer.BlockStatement) => {
  switch (blockStatement.path.original) {
    case 'if': {
      return createConditionStatement(blockStatement)
    }

    default: {
      throw new Error('Unexpected block statement')
    }
  }
}

export const createConditionStatement = (blockStatement: Glimmer.BlockStatement) => {
  const condSubject = convertExpression(blockStatement.params[0])
  const boolCondSubject = Babel.callExpression(Babel.identifier('Boolean'), [condSubject])

  const { program, inverse } = blockStatement

  if (inverse == null) {
    // Logical expression
    // {Boolean(variable) && <div />}
    return Babel.logicalExpression('&&', boolCondSubject, convertRootChildren(program.body))
  } else {
    // Ternary expression
    // {Boolean(variable) ? <div /> : <span />}
    return Babel.conditionalExpression(
      boolCondSubject,
      convertRootChildren(program.body),
      convertRootChildren(inverse.body)
    )
  }
}
