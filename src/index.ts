import { preprocess }    from '@glimmer/syntax'
import generate          from '@babel/generator'
import { createProgram } from './expressions'

/**
 * Compiles hbs code
 */
export const compile = (hbsCode: string) => {
  // generate
  const glimmerProgram = preprocess(hbsCode)
  const babelAst = createProgram(glimmerProgram)

  return generate(babelAst).code
}
