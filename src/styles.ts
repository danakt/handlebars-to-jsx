import { parseExpression } from '@babel/parser'

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
