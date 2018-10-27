export * from '@babel/types'

declare module '@babel/types' {
  /**
   * Append a node to a member expression.
   */
  export function appendToMemberExpression<T extends MemberExpression>(member: T, append: object, computed?: boolean): T

  /**
   * Prepend a node to a member expression.
   */
  export function prependToMemberExpression<T extends MemberExpression>(member: T, prepend: object): T

  /*
   * A general AST traversal with both prefix and postfix handlers, and a
   * state object. Exposes ancestry data to each handler so that more complex
   * AST data can be taken into account.
   */
  // export function traverse<T>(node: Node, handlers: TraversalHandler<T> | TraversalHandlers<T>, state?: T): void

  export function cleanJSXElementLiteralChild(child: { value: string }, args: Array<Object>): void
}
