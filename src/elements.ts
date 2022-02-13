import { AST as Glimmer }                                  from 'glimmer-engine/dist/@glimmer/syntax'
import * as Babel                                          from '@babel/types'
import * as isSelfClosing                                  from 'is-self-closing'
import * as convertHTMLAttribute                           from 'react-attr-converter'
import { createConcat, resolveExpression, createChildren } from './expressions'
import { createStyleObject }                               from './styles'
import { getProgramOptions }                               from './programContext'
import { DEFAULT_PARTIAL_NAMESPACE } from './constants'

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

const createObjectProperty = (hashPair: Glimmer.HashPair): Babel.ObjectProperty => {
  const propertyNameIdentifier = Babel.identifier(hashPair.key);
  const innerValueExpression = resolveExpression(hashPair.value);

  return Babel.objectProperty(propertyNameIdentifier, innerValueExpression);
};

const createJsxAttribute = (hashPair: Glimmer.HashPair): Babel.JSXAttribute => {
  const nameIdentifier = Babel.jsxIdentifier(hashPair.key);
  const innerValueExpression = resolveExpression(hashPair.value);
  const valueExpressionContainer = Babel.jsxExpressionContainer(innerValueExpression);

  return Babel.jsxAttribute(nameIdentifier, valueExpressionContainer);
};

const createPropsSpreadContextAttribute = (paramExpression: Glimmer.Expression | null, customAttributes: Glimmer.HashPair[]): Babel.JSXAttribute | null => {
  const customProperties: (Babel.SpreadElement | Babel.ObjectProperty)[] = customAttributes.map(createObjectProperty);

  if (paramExpression !== null) {
    const innerValueExpression = resolveExpression(paramExpression);
    const propsSpreadElement = Babel.spreadElement(innerValueExpression);
    customProperties.unshift(propsSpreadElement);
  }

  if (customProperties.length === 0) {
    return null;
  }

  const valueExpression = Babel.objectExpression(customProperties);
  const valueExpressionContainer = Babel.jsxExpressionContainer(valueExpression);
  const nameIdentifier = Babel.jsxIdentifier(DEFAULT_PARTIAL_NAMESPACE);

  return Babel.jsxAttribute(nameIdentifier, valueExpressionContainer);
};

const createPropsSpreadAttribute = (paramExpression: Glimmer.Expression | null): Babel.JSXSpreadAttribute | null => {
  if (paramExpression === null) {
    return null;
  }

  const innerValueExpression = resolveExpression(paramExpression)

  return Babel.jsxSpreadAttribute(innerValueExpression);
};

const getAttributes = (partialStatement: Glimmer.PartialStatement): (Babel.JSXAttribute | Babel.JSXSpreadAttribute)[] => {
  const { includeContext } = getProgramOptions();
  const contextParameter = partialStatement.params.length === 0 ? null : partialStatement.params[0];
  const propsSpreadAttribute = includeContext ? createPropsSpreadContextAttribute(contextParameter, partialStatement.hash.pairs) : createPropsSpreadAttribute(contextParameter);
  if (propsSpreadAttribute === null) {
    return [];
  }

  const customAttributes = includeContext ? [] : partialStatement.hash.pairs.map(createJsxAttribute);

  return [propsSpreadAttribute, ...customAttributes];
}

/**
 * Converts a partial statement from Handlebars to a JSXElement
 */
 export const convertPartialStatement = (partialStatement: Glimmer.PartialStatement): Babel.JSXElement => {
  const jsxElementName = (partialStatement.name as Glimmer.PathExpression).original;
  const tagName = Babel.jsxIdentifier(jsxElementName)
  const attributes = getAttributes(partialStatement);
  const isElementSelfClosing = true;

  return Babel.jsxElement(
    Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing),
    Babel.jsxClosingElement(tagName),
    [],
    isElementSelfClosing
  )
}
