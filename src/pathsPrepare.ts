import { AST as Glimmer, traverse } from '@glimmer/syntax'
import { DEFAULT_EACH_LOOP_NAMESPACE, DEFAULT_GLOBAL_NAMESPACE }   from './constants'

/**
 * Checks is each statement
 */
const isEachStatement = (node: Glimmer.Node): node is Glimmer.BlockStatement =>
  node.type === 'BlockStatement' && (node.path as Glimmer.PathExpression).original === 'each'

/**
 * Creates stack of namespaces
 */
const createNamespaceStack = () => {
  const namespaces: { node: Glimmer.Node; name: string }[] = []

  return {
    // Getter of length
    get length() {
      return namespaces.length
    },

    /** Pushes sub namespaces */
    push: (item: { node: Glimmer.Node; name?: string }) =>
      namespaces.push({
        node: item.node,
        name: item.name || DEFAULT_EACH_LOOP_NAMESPACE
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
export const prepareProgramPaths = (programTemplate: Glimmer.Template, isComponent: boolean) => {
  const namespaces = createNamespaceStack()

  // Global component namespace
  if (isComponent) {
    namespaces.push({ node: programTemplate, name: DEFAULT_GLOBAL_NAMESPACE })
  }

  let eachStatementEntered = false

  traverse(programTemplate, {
    // Process block statements
    All: {
      // push the inner namespace for the next block after an each statement is entered
      // TODO: verify nested each statements work
      enter(node: Glimmer.Node) {
        if (node.type === 'Block' && eachStatementEntered) {
          namespaces.push({ node })
          eachStatementEntered = false
        }

        if (isEachStatement(node)) {
          eachStatementEntered = true
        }
      },
      exit(node: Glimmer.Node) {
        // Exit from namespace
        if (namespaces.length > 0 && node === namespaces.head().node) {
          namespaces.pop()
        }
      }
    },

    // Process path expressions
    PathExpression(node: Glimmer.PathExpression) {
      // Add prefixes
      if (namespaces.length) {
        node.parts.unshift(namespaces.head().name) // is this the bug???
        // node.tail.unshift(node.head.);
        // node.head = namespaces.head().name;
      }
    }
  })
}
