/* eslint-disable import/export */

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to JSX
 * @param options Compilation options
 * @param [isComponent] Should return JSX code wrapped as a function component
 * @returns JSX code
 */
export function compile(hbsCode: string, isComponent?: boolean): string

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to JSX
 * @param options Compilation options
 * @param [options.isComponent] Should return JSX code wrapped as a function component
 * @param [options.isModule] Should return generated code exported as default
 * @param [options.includeImport] Should include react import
 * @param [options.alwaysIncludeContext] Should always contain a template's context reference within the top-level props
 * @param [options.includeExperimentalFeatures] Should execute preprocessors to convert features not supported by the Glimmer parser (has limitations/restrictions)
 * @returns JSX code
 */
export function compile(hbsCode: string, options?: { isComponent?: boolean; isModule?: boolean, includeImport?: boolean, alwaysIncludeContext?: boolean, includeExperimentalFeatures?: boolean }): string
