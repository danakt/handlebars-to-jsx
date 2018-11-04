/**
 * Utils for converting Glimmer AST (Handlebars) to Babel AST (EcmaScript)
 */
import { AST as Glimmer }        from '@glimmer/syntax'
import * as Babel                from '@babel/types'
import * as isSelfClosing        from 'is-self-closing'
import * as convertHTMLAttribute from 'react-attr-converter'
import { resolveBlockStatement } from './blockStatements'

/**
 * Converts HBS expression to JS-compatible expression
 */
export const convertStatement = (statement: Glimmer.Statement): Babel.Expression => {
  switch (statement.type) {
    case 'ElementNode': {
      return convertElement(statement)
    }

    case 'TextNode': {
      return Babel.stringLiteral(statement.chars)
    }

    case 'MustacheStatement': {
      return convertExpression(statement.path)
    }

    case 'BlockStatement': {
      return resolveBlockStatement(statement)
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
      return Babel.jsxExpressionContainer(convertStatement(statement))
    }
  }
}

/**
 * Converts Hbs expression to Babel expression
 */
export const convertExpression = (
  expression: Glimmer.Expression
): Babel.Literal | Babel.Identifier | Babel.MemberExpression => {
  switch (expression.type) {
    case 'PathExpression': {
      return createMemberExpression(expression.parts)
    }

    case 'BooleanLiteral': {
      return Babel.booleanLiteral(expression.value)
    }

    case 'NullLiteral': {
      return Babel.nullLiteral()
    }

    case 'NumberLiteral': {
      return Babel.numericLiteral(expression.value)
    }

    case 'StringLiteral': {
      return Babel.stringLiteral(expression.value)
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
  body.map(statement => convertElementChild(statement))

/**
 * Converts root children
 */
export const convertRootChildren = (body: Glimmer.Statement[]): Babel.Expression =>
  body.length === 1 ? convertStatement(body[0]) : createFragment(convertChildren(body))

/**
 * Creates program statement
 */
export const convertProgram = (program: Glimmer.Program): Babel.Program => {
  const body = [Babel.expressionStatement(convertRootChildren(program.body))]

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
        return convertStatement(item)
      }

      return Babel.binaryExpression('+', acc, convertStatement(item))
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
      return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(convertExpression(value.path)))
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
