import { AST as Glimmer }      from '@glimmer/syntax'
import * as Babel              from '@babel/types'
import { createRootChildren }  from './expressions'
import { prepareProgramPaths } from './pathsPrepare'
import { createComponent }     from './componentCreator'

/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isModule Should output code be exported by default
 */
export const createProgram = (hbsProgram: Glimmer.Program, isComponent: boolean, isModule: boolean, includeImport: boolean): Babel.Program => {
  prepareProgramPaths(hbsProgram, isComponent)

  const reactImport = Babel.importDeclaration([Babel.importDefaultSpecifier(Babel.identifier('React'))], Babel.stringLiteral('react'));
  const componentBody = createRootChildren(hbsProgram.body)
  const expression = isComponent ? createComponent(componentBody) : componentBody
  const statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression)

  const directives: Babel.Statement[] = [statement];
  includeImport && directives.unshift(reactImport);

  return Babel.program(directives)
}
