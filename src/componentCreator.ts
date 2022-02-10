import * as Babel from '@babel/types'
import { DEFAULT_GLOBAL_NAMESPACE } from './constants';

/**
 * Creates arrow component
 */
export const createComponent = (body: Babel.Expression) =>
  Babel.arrowFunctionExpression([Babel.identifier(DEFAULT_GLOBAL_NAMESPACE)], body)
