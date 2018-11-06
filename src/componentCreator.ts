import * as Babel from '@babel/types'

/**
 * Creates arrow component
 */
export const createComponent = (body: Babel.Expression) =>
  Babel.arrowFunctionExpression([Babel.identifier('props')], body)
