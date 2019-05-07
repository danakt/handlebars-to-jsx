import { AST as Glimmer }      from '@glimmer/syntax'
import * as Babel              from '@babel/types'
import { createRootChildren }  from './expressions'
import { prepareProgramPaths } from './pathsPrepare'
import { createComponent }     from './componentCreator'

/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isComponent Should return JSX code wrapped as a function component
 * @param isModule Should return generated code exported as default
 * @param includeImport Should include react import
 */
export const createProgram = (
  hbsProgram: Glimmer.Program,
  isComponent: boolean,
  isModule: boolean,
  includeImport: boolean
): Babel.Program => {
  prepareProgramPaths(hbsProgram, isComponent)

  const reactImport = Babel.importDeclaration(
    [Babel.importDefaultSpecifier(Babel.identifier('React'))],
    Babel.stringLiteral('react')
  )
  const componentBody = createRootChildren(hbsProgram.body)
  const expression = isComponent ? createComponent(componentBody) : componentBody
  const statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression)

  const directives: Babel.Statement[] = [statement]
  includeImport && directives.unshift(reactImport)

  return Babel.program(directives)
}
