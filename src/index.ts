/* eslint-disable import/export */
import { preprocess }    from 'glimmer-engine/dist/@glimmer/syntax'
import generate          from '@babel/generator'
import * as Babel        from '@babel/types'
import { createProgram } from './program'
import { print }         from './printer';

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to convert
 * @param [options] Compilation options
 * @param [options.isComponent] Should return JSX code wrapped as a function component
 * @param [options.isModule] Should return generated code exported as default
 * @param [options.includeImport] Should include react import
 * @param [options.alwaysIncludeContext] Should always contain a template's context reference within the top-level props
 */
export function compile(hbsCode: string, isComponent?: boolean): string
export function compile(
  hbsCode: string,
  options?: {
    isComponent?: boolean
    isModule?: boolean
    includeImport?: boolean
    alwaysIncludeContext?: boolean
  }
): string
export function compile(
  hbsCode: string,
  options: boolean | { isComponent?: boolean; isModule?: boolean; includeImport?: boolean, alwaysIncludeContext?: boolean } = true
): string {
  if (typeof options === 'boolean') {
    return compile(hbsCode, { isComponent: options })
  }

  const isComponent = !!options.isComponent
  const isModule = !!options.isModule
  const includeImport = !!options.includeImport && isModule
  const includeContext = !!options.alwaysIncludeContext

  const compatibleHandlebarsTemplate = preProcessBlockStatementsWithinAttributes(hbsCode);
  const glimmerProgram = preprocess(compatibleHandlebarsTemplate)
  const babelProgram: Babel.Program = createProgram(glimmerProgram, isComponent, isModule, includeImport, includeContext)
  const generatedCode = generate(babelProgram).code;

  return print(generatedCode);
}

const getAllAttributesRegex = /(\w+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const preProcessBlockStatementsWithinAttributes = (handlebarsTemplate: string):string => {
  const rawAttributes = handlebarsTemplate.match(getAllAttributesRegex)?.filter((rawValue) => rawValue.match(containsMustacheBlockRegex));
  if (!rawAttributes || rawAttributes.length === 0) {
    return handlebarsTemplate;
  }

  const attributeKeyPairs = rawAttributes.map((rawValue) => {
    const keyValueDividerIndex = rawValue.indexOf('=');
    return {
      key: rawValue.substring(0, keyValueDividerIndex).trim(),
      value: rawValue.substring(keyValueDividerIndex + 1).trim()
    };
  });
  attributeKeyPairs.forEach(({ key, value }) => {
    throw (`Mustache found in <${key}>: ${value}`);
  });

  return handlebarsTemplate;
};
