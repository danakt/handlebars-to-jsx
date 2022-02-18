/* eslint-disable import/export */
import { preprocess }                           from 'glimmer-engine/dist/@glimmer/syntax';
import generate                                 from '@babel/generator';
import * as Babel                               from '@babel/types';
import { createProgram }                        from './program';
import { print }                                from './printer';
import preProcessUnsupportedParserFeatures      from './preProcessing/preProcessUnsupportedParserFeatures';

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to convert
 * @param [options] Compilation options
 * @param [options.isComponent] Should return JSX code wrapped as a function component
 * @param [options.isModule] Should return generated code exported as default
 * @param [options.includeImport] Should include react import
 * @param [options.alwaysIncludeContext] Should always contain a template's context reference within the top-level props
 * @param [options.includeExperimentalFeatures] Should execute preprocessors to convert features not supported by the Glimmer parser (has limitations/restrictions)
 */
export function compile(hbsCode: string, isComponent?: boolean): string
export function compile(
  hbsCode: string,
  options?: {
    isComponent?: boolean
    isModule?: boolean
    includeImport?: boolean
    alwaysIncludeContext?: boolean,
    includeExperimentalFeatures?: boolean
  }
): string
export function compile(
  hbsCode: string,
  options: boolean | { isComponent?: boolean; isModule?: boolean; includeImport?: boolean, alwaysIncludeContext?: boolean, includeExperimentalFeatures?: boolean } = true
): string {
  if (typeof options === 'boolean') {
    return compile(hbsCode, { isComponent: options })
  }

  const isComponent = !!options.isComponent
  const isModule = !!options.isModule
  const includeImport = !!options.includeImport && isModule
  const includeContext = !!options.alwaysIncludeContext
  const includeExperimentalFeatures = !!options.includeExperimentalFeatures

  const preparedTemplate = includeExperimentalFeatures ? preProcessUnsupportedParserFeatures(hbsCode) : {
    template: hbsCode,
    helpers: []
  };
  const glimmerProgram = preprocess(preparedTemplate.template)
  const babelProgram: Babel.Program = createProgram(glimmerProgram, isComponent, isModule, includeImport, includeContext, includeExperimentalFeatures, preparedTemplate.helpers)
  const generatedCode = generate(babelProgram).code;

  return print(generatedCode);
}
