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
 * @returns JSX code
 */
export function compile(hbsCode: string, options?: { isComponent?: boolean; isModule?: boolean, includeImport?: boolean }): string
