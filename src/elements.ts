import { AST as Glimmer }                                  from '@glimmer/syntax'
import * as Babel                                          from '@babel/types'
import * as isSelfClosing                                  from 'is-self-closing'
import * as convertHTMLAttribute                           from 'react-attr-converter'
import { createConcat, resolveExpression, createChildren } from './expressions'

/**
 * Creates JSX fragment
 */
export const createFragment = (children: Babel.JSXFragment['children']) => {
  const openingFragment = Babel.jsxOpeningFragment()
  const closingFragment = Babel.jsxClosingFragment()

  return Babel.jsxFragment(openingFragment, closingFragment, children)
}

/**
 * Coverts AttrNode to JSXAttribute
 */
export const createAttribute = (attrNode: Glimmer.AttrNode): Babel.JSXAttribute | null => {
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
      return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(resolveExpression(value.path)))
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
  const attributes = node.attributes.map(item => createAttribute(item)).filter(Boolean) as Babel.JSXAttribute[]
  const isElementSelfClosing = node.selfClosing || isSelfClosing(node.tag)
  const children = createChildren(node.children)

  return Babel.jsxElement(
    Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing),
    Babel.jsxClosingElement(tagName),
    isElementSelfClosing ? [] : children,
    isElementSelfClosing
  )
}
