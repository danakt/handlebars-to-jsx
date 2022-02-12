import { AST as Glimmer }      from 'glimmer-engine/dist/@glimmer/syntax'
import * as Babel              from '@babel/types'
import { createRootChildren }  from './expressions'
import { prepareProgramPaths } from './pathsPrepare'
import { createComponent }     from './componentCreator'

const getImportDirectives = (partialTemplates: string[]) => {
  const reactImport = Babel.importDeclaration(
    [Babel.importDefaultSpecifier(Babel.identifier('React'))],
    Babel.stringLiteral('react')
  );
  const partialImports = partialTemplates.map((partialName) => Babel.importDeclaration(
    [Babel.importDefaultSpecifier(Babel.identifier(partialName))],
    Babel.stringLiteral(`./${partialName}`) // TODO: add support for specifying partial directory
  ));

  return [reactImport, ...partialImports];
}

/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isComponent Should return JSX code wrapped as a function component
 * @param isModule Should return generated code exported as default
 * @param includeImport Should include react import
 * @param includeContext Should always include react import
 */
export const createProgram = (
  hbsProgram: Glimmer.Template,
  isComponent: boolean,
  isModule: boolean,
  includeImport: boolean,
  includeContext: boolean
): Babel.Program => {
  const { getEncounteredPartialTemplates } = prepareProgramPaths(hbsProgram, isComponent, includeContext)

  const componentBody = createRootChildren(hbsProgram.body)
  const expression = isComponent ? createComponent(componentBody) : componentBody
  const statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression)
  const partialTemplates = getEncounteredPartialTemplates();
  const directives: Babel.Statement[] = includeImport ? [...getImportDirectives(partialTemplates), statement] : [statement]
  
  return Babel.program(directives)
}
