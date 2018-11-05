import { preprocess }    from '@glimmer/syntax'
import generate          from '@babel/generator'
import * as Babel        from '@babel/types'
import { createProgram } from './expressions'

export const parse = (hbsCode: string): Babel.Program => {
  // generate
  const glimmerProgram = preprocess(hbsCode)
  const babelProgram = createProgram(glimmerProgram)

  return babelProgram
}

/**
 * Compiles hbs code
 */
export const compile = (hbsCode: string): string => {
  return generate(parse(hbsCode)).code
}
