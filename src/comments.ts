import { AST as Glimmer } from 'glimmer-engine/dist/@glimmer/syntax'
import * as Babel         from '@babel/types'

export const createComment = (
  statement: Glimmer.MustacheCommentStatement | Glimmer.CommentStatement
): Babel.JSXExpressionContainer => {
  const value = statement.value

  const emptyExpression = Babel.jsxEmptyExpression()
  emptyExpression.innerComments = [{ type: 'CommentBlock', value } as any]

  return Babel.jsxExpressionContainer(emptyExpression)
}
