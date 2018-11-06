import { preprocess }    from '@glimmer/syntax'
import generate          from '@babel/generator'
import * as Babel        from '@babel/types'
import { createProgram } from './expressions'

/**
 * Compiles hbs code
 */
export const compile = (hbsCode: string): string => {
  const glimmerProgram = preprocess(hbsCode)
  const babelProgram: Babel.Program = createProgram(glimmerProgram)

  return generate(babelProgram).code
}
