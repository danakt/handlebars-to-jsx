import { AST as Glimmer, ASTv1, traverse } from 'glimmer-engine/dist/@glimmer/syntax'
import { DEFAULT_EACH_LOOP_NAMESPACE, DEFAULT_GLOBAL_NAMESPACE, DEFAULT_PARTIAL_NAMESPACE, ATTRIBUTE_GENERATOR_HELPER_FUNCTION }   from './constants'
import { getProgramOptions } from './programContext'
import { isMustacheHelperStatement } from './types';

/**
 * Checks is each statement
 */
const isEachStatement = (node: Glimmer.Node): node is Glimmer.BlockStatement =>
  node.type === 'BlockStatement' && (node.path as Glimmer.PathExpression).original === 'each'

const isWithStatement = (node: Glimmer.Node): node is Glimmer.BlockStatement =>
  node.type === 'BlockStatement' && (node.path as Glimmer.PathExpression).original === 'with'

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
    head: () => namespaces[namespaces.length - 1],

    currentPath: () => namespaces.reduce((aggregate, { name }) => aggregate !== '' ? `${aggregate}.${name}` : name, '')
  }
}

/**
 * Prepares paths Glimmer AST for compatible with JS AST.
 */
export const prepareProgramPaths = (programTemplate: Glimmer.Template) => {
  const { isComponent, includeContext, includeExperimentalFeatures } = getProgramOptions(); 
  const namespaces = createNamespaceStack()
  const partialTemplates:string[] = []; // TODO: update to include references to their props
  const helperFunctions:string[] = []; // TODO: update to include references to their props

  // Global component namespace
  if (isComponent) {
    const globalNamespace = includeContext ? `${DEFAULT_GLOBAL_NAMESPACE}.${DEFAULT_PARTIAL_NAMESPACE}` : DEFAULT_GLOBAL_NAMESPACE;
    namespaces.push({ node: programTemplate, name: globalNamespace })
  }

  let eachStatementEntered = false
  let withStatementEntered = false
  let withStatementContextProperty = ''

  let nestedContextStack: string[] = []

  traverse(programTemplate, {
    // Process block statements
    All: {
      // push the inner namespace for the next block after an each statement is entered
      // TODO: verify nested each statements work
      enter(node: Glimmer.Node) {
        if (node.type === 'Block' && eachStatementEntered) {
          nestedContextStack.push(namespaces.currentPath())
          namespaces.push({ node })
          eachStatementEntered = false
        }

        if (isEachStatement(node)) {
          eachStatementEntered = true
        }

        if (node.type === 'Block' && withStatementEntered) {
          const currentPath = namespaces.currentPath()
          const withContextPath = currentPath !== '' ? `${currentPath}.${withStatementContextProperty}` : withStatementContextProperty;
          nestedContextStack.push(currentPath)
          namespaces.push({ node, name: withContextPath })
          withStatementEntered = false
          withStatementContextProperty = ''
        }

        if (isWithStatement(node)) {
          withStatementEntered = true
          withStatementContextProperty = (node.params[0] as Glimmer.PathExpression).original
        }

        if (node.type === 'PartialStatement') {
          const jsxElementName = (node.name as Glimmer.PathExpression).original;

          if (!partialTemplates.includes(jsxElementName))
            partialTemplates.push(jsxElementName);
        }
      },
      exit(node: Glimmer.Node) {
        if (isEachStatement(node) || isWithStatement(node)) {
          nestedContextStack.splice(nestedContextStack.length - 1, 1)
        }
        
        // Exit from namespace
        if (namespaces.length > 0 && node === namespaces.head().node) {
          namespaces.pop()
        }
      }
    },
    MustacheStatement(node: Glimmer.MustacheStatement) {
      if (isMustacheHelperStatement(node)) {
        const statementPath = node.path as Glimmer.PathExpression;
        const functionName = statementPath.parts[statementPath.parts.length - 1];

        if (!partialTemplates.includes(functionName)) {
          helperFunctions.push(functionName);
        }
      }
    },
    AttrNode(node: Glimmer.AttrNode) {
      if (includeExperimentalFeatures && node.name === ATTRIBUTE_GENERATOR_HELPER_FUNCTION && !partialTemplates.includes(ATTRIBUTE_GENERATOR_HELPER_FUNCTION)) {
        helperFunctions.push(ATTRIBUTE_GENERATOR_HELPER_FUNCTION);
      }
    },

    // Process path expressions (i.e. add prefixes)
    PathExpression(node: Glimmer.PathExpression) {
      if (namespaces.length === 0) return;

      let context = namespaces.head().name
      const original = node.original
      if (original.startsWith('..')) { // TODO: update to handle traversing further than 1 step back
        const parentContextName = nestedContextStack.length > 0 ? nestedContextStack[nestedContextStack.length - 1] : namespaces.currentPath();
        context = parentContextName
      }

      node.parts.unshift(context)
    }
  });

  return { partialTemplates, helperFunctions };
}
