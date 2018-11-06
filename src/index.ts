/* eslint-disable import/export */
import { preprocess }    from '@glimmer/syntax'
import generate          from '@babel/generator'
import * as Babel        from '@babel/types'
import { createProgram } from './program'

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to JSX
 * @param options Compilation options
 * @param [options.isComponent] Should wraps code to component
 * @param [options.isModule] Should be export code by default
 */
export function compile(hbsCode: string, isComponent?: boolean): string
export function compile(hbsCode: string, options?: { isComponent?: boolean; isModule?: boolean }): string
export function compile(
  hbsCode: string,
  options: boolean | { isComponent?: boolean; isModule?: boolean } = true
): string {
  if (typeof options === 'boolean') {
    return compile(hbsCode, { isComponent: options })
  }

  const isComponent = !!options.isComponent
  const isModule = !!options.isModule

  const glimmerProgram = preprocess(hbsCode)
  const babelProgram: Babel.Program = createProgram(glimmerProgram, isComponent, isModule)

  return generate(babelProgram).code
}
