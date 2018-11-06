import { preprocess }    from '@glimmer/syntax'
import generate          from '@babel/generator'
import * as Babel        from '@babel/types'
import { createProgram } from './program'

/**
 * Compiles hbs code
 */
export const compile = (hbsCode: string, isComponent: boolean = true, isModule: boolean = false): string => {
  const glimmerProgram = preprocess(hbsCode)
  const babelProgram: Babel.Program = createProgram(glimmerProgram, isComponent, isModule)

  return generate(babelProgram).code
}
