import { AST as Glimmer, traverse } from '@glimmer/syntax'
import * as hash                    from 'object-hash'
import { DEFAULT_NAMESPACE_NAME }   from './contants'

/**
 * Checks is each statement
 */
const isEachStatement = (node: Glimmer.BlockStatement) => node.path.original === 'each'

/**
 * Creates stack of namespaces
 */
const createNamespaceStack = () => {
  const namespaces: { node: Glimmer.Node; name: string; hash: string }[] = []

  return {
    // Getter of length
    get length() {
      return namespaces.length
    },

    /** Pushes sub namespaces */
    push: (item: { node: Glimmer.Node; name?: string }) =>
      namespaces.push({
        node: item.node,
        hash: hash(item.node),
        name: item.name || DEFAULT_NAMESPACE_NAME
      }),

    /** Goes to namespace up */
    pop: () => namespaces.pop(),

    /** Returns head item of the stack */
    head: () => namespaces[namespaces.length - 1]
  }
}

/**
 * Prepares paths Glimmer AST for compatible with JS AST.
 */
export const prepareProgramPaths = (program: Glimmer.Program, isComponent: boolean) => {
  const namespaces = createNamespaceStack()

  // Global component namespace
  if (isComponent) {
    namespaces.push({ node: program, name: 'props' })
  }

  traverse(program, {
    // Process block statements
    BlockStatement: {
      enter(node: Glimmer.BlockStatement) {
        // Creates new namespace to prefix all contained path expressions in
        // the block scope
        if (isEachStatement(node)) {
          namespaces.push({ node })
        }
      },
      exit(node: Glimmer.BlockStatement) {
        // Exit from namespace
        if (isEachStatement(node)) {
          namespaces.pop()
        }
      }
    },

    // Process path expressions
    PathExpression(node: Glimmer.PathExpression) {
      // Add prefixes
      if (namespaces.length) {
        node.parts.unshift(namespaces.head().name)
      }
    }
  })
}
