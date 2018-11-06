/* eslint-disable import/export */

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to JSX
 * @param options Compilation options
 * @param [isComponent] Should wraps code to component
 * @returns JSX code
 */
export function compile(hbsCode: string, isComponent?: boolean): string

/**
 * Converts Handlebars code to JSX code
 * @param hbsCode Handlebars code to JSX
 * @param options Compilation options
 * @param [options.isComponent] Should wraps code to component
 * @param [options.isModule] Should be export code by default
 * @returns JSX code
 */
export function compile(hbsCode: string, options?: { isComponent?: boolean; isModule?: boolean }): string
