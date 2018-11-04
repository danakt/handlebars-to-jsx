/**
 * Utils for converting Glimmer AST (Handlebars) to Babel AST (EcmaScript)
 */
import { AST as Glimmer }        from '@glimmer/syntax'
import * as Babel                from '@babel/types'
import * as isSelfClosing        from 'is-self-closing'
import * as convertHTMLAttribute from 'react-attr-converter'

/**
 * Converts HBS expression to JS-compatible expression
 */
export const convertExpression = (statement: Glimmer.Statement): Babel.Expression => {
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
      throw new Error('Unexpected expression')
    }
  }
}

/**
 * Converts the child element of Handlebars node to JSX-compatible child element
 */
export const convertElementChild = (
  statement: Glimmer.Statement
): Babel.JSXText | Babel.JSXElement | Babel.JSXExpressionContainer => {
  switch (statement.type) {
    case 'ElementNode': {
      return convertElement(statement)
    }

    case 'TextNode': {
      return Babel.jsxText(statement.chars)
    }

    // If ig expression, create a expression container
    default: {
      return Babel.jsxExpressionContainer(convertExpression(statement))
    }
  }
}

/**
 * Converts Mustache statement to Babel expression
 */
export const convertMustacheStatement = (
  statement: Glimmer.MustacheStatement
): Babel.Literal | Babel.Identifier | Babel.MemberExpression => {
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
 * Converts child statements of element to JSX-compatible expressions
 * @param body List of Glimmer statements
 */
export const convertChildren = (body: Glimmer.Statement[]): Babel.JSXElement['children'] =>
  body
    // Converting HBS statements to ES expression
    .map(statement => convertElementChild(statement))

/**
 * Creates program statement
 */
export const convertProgram = (program: Glimmer.Program): Babel.Program => {
  const expression: Babel.Expression
    = program.body.length === 1 ? convertExpression(program.body[0]) : createFragment(convertChildren(program.body))
  const body = [Babel.expressionStatement(expression)]

  return Babel.program(body)
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
export const createConcat = (parts: Glimmer.ConcatStatement['parts']): Babel.BinaryExpression | Babel.Expression => {
  return parts.reduce(
    (acc, item) => {
      if (acc == null) {
        return convertExpression(item)
      }

      return Babel.binaryExpression('+', acc, convertExpression(item))
    },
    null as null | Babel.Expression | Babel.BinaryExpression
  ) as Babel.BinaryExpression | Babel.Expression
}

/**
 * Coverts AttrNode to JSXAttribute
 */
export const convertAttribute = (attrNode: Glimmer.AttrNode): Babel.JSXAttribute | null => {
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
export const convertElement = (node: Glimmer.ElementNode): Babel.JSXElement => {
  const tagName = Babel.jsxIdentifier(node.tag)
  const attributes = node.attributes.map(item => convertAttribute(item)).filter(Boolean) as Babel.JSXAttribute[]
  const isElementSelfClosing = node.selfClosing || isSelfClosing(node.tag)
  const children = convertChildren(node.children)

  return Babel.jsxElement(
    Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing),
    Babel.jsxClosingElement(tagName),
    isElementSelfClosing ? [] : children,
    isElementSelfClosing
  )
}
