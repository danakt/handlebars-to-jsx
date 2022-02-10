import { AST as Glimmer }                                  from 'glimmer-engine/dist/@glimmer/syntax'
import * as Babel                                          from '@babel/types'
import * as isSelfClosing                                  from 'is-self-closing'
import * as convertHTMLAttribute                           from 'react-attr-converter'
import { createConcat, resolveExpression, createChildren } from './expressions'
import { createStyleObject }                               from './styles'

/**
 * Creates JSX fragment
 */
export const createFragment = (
  children: Babel.JSXFragment['children'],
  attributes: (Babel.JSXAttribute | Babel.JSXSpreadAttribute)[] = []
) => {
  const fragmentMemberExpression = Babel.jsxMemberExpression(
    Babel.jsxIdentifier('React'),
    Babel.jsxIdentifier('Fragment')
  )

  const openingFragment = Babel.jsxOpeningElement(fragmentMemberExpression, attributes)
  const closingFragment = Babel.jsxClosingElement(fragmentMemberExpression)

  return Babel.jsxElement(openingFragment, closingFragment, children, false)
}

/**
 * Coverts AttrNode to JSXAttribute
 */
export const createAttribute = (attrNode: Glimmer.AttrNode): Babel.JSXAttribute | null => {
  // Unsupported attribute
  const reactAttrName = convertHTMLAttribute(attrNode.name)

  if (!/^[_\-A-z0-9]+$/.test(reactAttrName)) {
    return null
  }

  const name = Babel.jsxIdentifier(reactAttrName)
  const value = attrNode.value

  switch (value.type) {
    case 'TextNode': {
      if (reactAttrName === 'style') {
        const styleObjectExpression = createStyleObject(value)
        return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(styleObjectExpression))
      }

      return Babel.jsxAttribute(name, Babel.stringLiteral(value.chars))
    }

    case 'MustacheStatement': {
      return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(resolveExpression(value.path)))
    }

    case 'ConcatStatement': {
      const expression = createConcat(value.parts)
      if (reactAttrName === 'style') {
        const styleObjectExpression = createStyleObject(value)
        return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(styleObjectExpression))
      }

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

// TODO: to get the correct prop name, we must have already converted the partial into JSX.
// TODO: generate lookup of pre-converted partials, allowing us to verify & set prop names correctly.
const createPropAttributeFromPartialParamExpression = (paramExpression: Glimmer.Expression): Babel.JSXAttribute | null => {
  const paramAsPathExpression = paramExpression as Glimmer.PathExpression;
  const propName = paramAsPathExpression.parts[paramAsPathExpression.parts.length - 1];
  const attributeName = convertHTMLAttribute(propName)

  if (!/^[_\-A-z0-9]+$/.test(attributeName)) {
    return null
  }

  const name = Babel.jsxIdentifier(attributeName)
  const valueExpression = Babel.jsxExpressionContainer(resolveExpression(paramAsPathExpression));

  return Babel.jsxAttribute(name, valueExpression)
};

/**
 * Converts a partial statement from Handlebars to a JSXElement
 */
 export const convertPartialStatement = (partialStatement: Glimmer.PartialStatement): Babel.JSXElement => {
  const jsxElementName = (partialStatement.name as Glimmer.PathExpression).original;
  const tagName = Babel.jsxIdentifier(jsxElementName)
  const attributes = partialStatement.params.map(createPropAttributeFromPartialParamExpression).filter(Boolean) as Babel.JSXAttribute[]
  const isElementSelfClosing = true;

  return Babel.jsxElement(
    Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing),
    Babel.jsxClosingElement(tagName),
    [],
    isElementSelfClosing
  )
}
