import { preprocess }     from '@glimmer/syntax'
import generate           from '@babel/generator'
import { convertProgram } from './converter'

/**
 * Compiles hbs code
 */
export const compile = (hbsCode: string) => {
  // generate
  const glimmerProgram = preprocess(hbsCode)
  const babelAst = convertProgram(glimmerProgram)

  return generate(babelAst).code
}
