import { parseExpression } from '@babel/parser'
import { ConcatStatement } from '@glimmer/syntax/dist/types/lib/types/nodes';
import { preprocess } from '@glimmer/syntax';

/**
 * Transforms "prop-name" to "propName"
 * @param propName
 */
export const camelizePropName = (propName: string) => propName.replace(/-([a-z])/g, (_, $1) => $1.toUpperCase())

/**
 * Converts style string to style object
 */
export const createStyleObject = (style: string): Record<string, string | number> => {
  const styleObject: Record<string, string | number> = {}

  const stylePropsList = style.split(';')

  for (let i = 0; i < stylePropsList.length; i++) {
    const entry = stylePropsList[i].trim().split(/:(.+)/)

    if (entry.length < 2) {
      continue
    }

    const propName = camelizePropName(entry[0].trim())

    styleObject[propName] = entry[1].trim()
  }

  return styleObject
}

/**
 * Creates AST tree of style object from style string
 * @param style Styles string
 */
export const parseStyleString = (style: string) => parseExpression(JSON.stringify(createStyleObject(style)))

/**
 * Create AST tree of style object from style concat
 */
export const parseStyleConcat = (concatStatement: ConcatStatement) => {
  let styleObjectExpressionString = '{';
  const fullStatement = concatStatement.parts.reduce((statement, currentPart) => {
    let currentStatement = '';
    if (currentPart.type === 'TextNode') {
      currentStatement = currentPart.chars;
    }
    if (currentPart.type === 'MustacheStatement' && currentPart.path.type === 'PathExpression') {
      currentStatement = `{{${currentPart.path.parts.join('.')}}}`;
    }
    return `${statement}${currentStatement}`;
  }, '');

  fullStatement.split(';').forEach(cssRule => {
    const [prop, value] = cssRule.split(':').map(str => str.trim());
    const processedValue = preprocess(value);
    let finalValue = `"${value}"`;
    if (processedValue.body.find(b => b.type === 'MustacheStatement')) {
      finalValue = processedValue.body.reduce((statement, current) => {
        let currentStatement = '';
        if (current.type === 'TextNode') {
          currentStatement = current.chars;
        }
        if (current.type === 'MustacheStatement' && current.path.type === 'PathExpression') {
          currentStatement = '${' + current.path.parts.join('.') + '}';
        }
        return `${statement}${currentStatement}`;
      }, '');
      finalValue = `\`${finalValue}\``;
    }
    styleObjectExpressionString += `"${camelizePropName(prop)}": `
    styleObjectExpressionString += `${finalValue},`
  });
  styleObjectExpressionString += '}';
  return parseExpression(styleObjectExpressionString);
}