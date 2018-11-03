/**
 * Utils for converting Glimmer AST (Handlebars) to Babel AST (EcmaScript)
 */
import { AST }                   from '@glimmer/syntax'
import * as Babel                from '@babel/types'
import * as isSelfClosing        from 'is-self-closing'
import * as convertHTMLAttribute from 'react-attr-converter'

/**
 * Detects expression type and converts to appropriate jsx expression
 */
export const convertExpression = (statement: AST.Statement): Babel.Expression => {
  switch (statement.type) {
    case 'ElementNode': {
      return convertElement(statement)
    }

    case 'TextNode': {
      return Babel.stringLiteral(statement.chars)
    }

    case 'MustacheStatement': {
      return convertMustacheStatement(statement)
    }

    default: {
      throw new Error('Unexpected statement')
    }
  }
}

/**
 * Converts mustache statement
 */
export const convertMustacheStatement = (statement: AST.MustacheStatement) => {
  const path = statement.path

  switch (path.type) {
    case 'PathExpression': {
      return createMemberExpression(path.parts)
    }

    case 'BooleanLiteral': {
      return Babel.booleanLiteral(path.value)
    }

    case 'NullLiteral': {
      return Babel.nullLiteral()
    }

    case 'NumberLiteral': {
      return Babel.numericLiteral(path.value)
    }

    case 'StringLiteral': {
      return Babel.stringLiteral(path.value)
    }

    case 'UndefinedLiteral': {
      return Babel.identifier('undefined')
    }

    default: {
      throw new Error('Unexpected mustache statement')
    }
  }
}

/**
 * Creates chain of member expression parts
 */
export const createMemberExpression = (parts: string[]): Babel.Identifier | Babel.MemberExpression => {
  if (parts.length === 0) {
    throw new Error('Unexpected empty expression parts')
  }

  return parts.reduce(
    (acc, item) => (acc == null ? Babel.identifier(item) : Babel.memberExpression(acc, Babel.identifier(item))),
    null as null | Babel.Identifier | Babel.MemberExpression
  )!
}

/**
 * Creates children list from js expression
 */
export const createJSXItem = (expressions: Babel.Expression[]): Babel.JSXElement['children'] =>
  expressions.map(
    expression =>
      expression.type === 'JSXElement' || expression.type === 'JSXFragment'
        ? expression
        : Babel.jsxExpressionContainer(expression)
  )

/**
 * Creates program statement
 */
export const convertProgram = (program: AST.Program) => {
  const expression
    = program.body.length === 1
      ? convertExpression(program.body[0])
      : createFragment(createJSXItem(program.body.map(statement => convertExpression(statement))))

  return Babel.program([Babel.expressionStatement(expression)])
}

/**
 * Creates JSX fragment
 */
export const createFragment = (children: Babel.JSXFragment['children']) => {
  const openingFragment = Babel.jsxOpeningFragment()
  const closingFragment = Babel.jsxClosingFragment()

  return Babel.jsxFragment(openingFragment, closingFragment, children)
}

/**
 * Creates attribute value concatenation
 */
export const createConcat = (parts: AST.ConcatStatement['parts']): Babel.BinaryExpression => {
  return parts.reduce(
    (acc, item) => {
      if (acc == null) {
        return convertExpression(item)
      }

      return Babel.binaryExpression('+', acc, convertExpression(item))
    },
    null as null | Babel.Expression | Babel.BinaryExpression
  ) as Babel.BinaryExpression
}

/**
 * Coverts AttrNode to JSXAttribute
 */
export const convertAttribute = (attrNode: AST.AttrNode): Babel.JSXAttribute | null => {
  // Unsupported attribute
  if (!/^[_\-A-z0-9]+$/.test(attrNode.name)) {
    return null
  }

  const reactAttrName = convertHTMLAttribute(attrNode.name)
  const name = Babel.jsxIdentifier(reactAttrName)
  const value = attrNode.value

  switch (value.type) {
    case 'TextNode': {
      return Babel.jsxAttribute(name, Babel.stringLiteral(value.chars))
    }

    case 'MustacheStatement': {
      return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(convertMustacheStatement(value)))
    }

    case 'ConcatStatement': {
      const expression = createConcat(value.parts)

      return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(expression))
    }

    default: {
      throw new Error('Unexpected attribute value')
    }
  }
}

/**
 * Converts ElementNode to JSXElement
 */
export const convertElement = (node: AST.ElementNode): Babel.JSXElement => {
  const tagName = Babel.jsxIdentifier(node.tag)
  const attributes = node.attributes.map(item => convertAttribute(item)).filter(Boolean) as Babel.JSXAttribute[]
  const isElementSelfClosing = node.selfClosing || isSelfClosing(node.tag)
  const openingElement = Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing)
  const closingElement = Babel.jsxClosingElement(tagName)

  return Babel.jsxElement(openingElement, closingElement, [], isElementSelfClosing)
}
