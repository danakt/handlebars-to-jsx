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
 * @param [options.includeImport] Should include react import
 */
export function compile(hbsCode: string, isComponent?: boolean): string
export function compile(hbsCode: string, options?: { isComponent?: boolean; isModule?: boolean, includeImport?: boolean }): string
export function compile(
  hbsCode: string,
  options: boolean | { isComponent?: boolean; isModule?: boolean, includeImport?: boolean } = true
): string {
  if (typeof options === 'boolean') {
    return compile(hbsCode, { isComponent: options })
  }

  const isComponent = !!options.isComponent
  const isModule = !!options.isModule
  const includeImport = !!options.includeImport && isModule;

  const glimmerProgram = preprocess(hbsCode)
  const babelProgram: Babel.Program = createProgram(glimmerProgram, isComponent, isModule, includeImport)

  return generate(babelProgram).code
}
