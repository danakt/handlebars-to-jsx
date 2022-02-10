import { AST as Glimmer, preprocess, print } from '@glimmer/syntax'
import { PresentArray } from '@glimmer/interfaces';
import * as Babel                            from '@babel/types'
import { createConcat, resolveStatement }    from './expressions'

/**
 * Transforms "prop-name" to "propName"
 * @param propName
 */
export const camelizePropName = (propName: string) => propName.replace(/-([a-z])/g, (_, $1) => $1.toUpperCase())

/**
 * Create AST tree of style object
 */
export const createStyleObject = (hbsStatement: Glimmer.TextNode | Glimmer.ConcatStatement): Babel.ObjectExpression => {
  const rawHbsStatement: string
    = hbsStatement.type === 'TextNode' ? hbsStatement.chars : print(hbsStatement).slice(1, -1)

  const objectProps: Array<Babel.ObjectMethod | Babel.ObjectProperty | Babel.SpreadElement> = rawHbsStatement
    .split(';')
    .filter(item => item.length !== 0)
    .map(cssRule => {
      const [rawKey, rawValue]: (string | undefined)[] = cssRule.split(':').map(str => str.trim())

      const [hbsKey, hbsValue] = [rawKey, rawValue].map(
        item =>
          preprocess(item || '').body.filter(
            item => item.type === 'MustacheStatement' || item.type === 'TextNode'
          ) as PresentArray<Glimmer.TextNode | Glimmer.MustacheStatement>
      )

      const key
        = hbsKey.length === 1
          ? hbsKey[0].type === 'TextNode'
            ? Babel.stringLiteral(camelizePropName((hbsKey[0] as Glimmer.TextNode).chars)) // Capitalize key name
            : resolveStatement(hbsKey[0])
          : createConcat(hbsKey)

      const value = hbsValue.length === 1 ? resolveStatement(hbsValue[0]) : createConcat(hbsValue)
      const isComputed = hbsKey.length > 1

      return Babel.objectProperty(key, value, isComputed)
    })

  return Babel.objectExpression(objectProps)
}
