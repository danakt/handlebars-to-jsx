import { parseExpression } from '@babel/parser'
import { ConcatStatement } from '@glimmer/syntax/dist/types/lib/types/nodes';

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
  let lastStyleAttr = '';
  let lastVariableValue = '';
  concatStatement.parts.forEach(part => {
    if (part.type === 'TextNode') {
      const stylePropList = part.chars.split(';');
      stylePropList.forEach(styleProp => {
        const ruleSplit = styleProp.split(':').map(str => str.trim());
        // a part of the value recently found in MustacheStatement
        if (ruleSplit.length === 1) {
          styleObjectExpressionString += `"${camelizePropName(lastStyleAttr.trim())}": `;
          styleObjectExpressionString += '`${' + lastVariableValue + '}' + stylePropList[0] + '`,';
          lastStyleAttr = '';
          lastVariableValue = '';
        }
        if (ruleSplit.length === 2) {
          const [styleAttr, styleValue] = ruleSplit;
          if (!!styleAttr && !!styleValue) {
            styleObjectExpressionString += `"${camelizePropName(styleAttr.trim())}": "${styleValue}",`;
          }
          if (!!styleAttr && !styleValue) {
            lastStyleAttr = styleAttr;
          }
        }
        
      })
    }
    if (part.type === 'MustacheStatement' && part.path.type === 'PathExpression') {
      lastVariableValue = part.path.parts.join('.');
    }
  });
  styleObjectExpressionString += '}';
  return parseExpression(styleObjectExpressionString);
}