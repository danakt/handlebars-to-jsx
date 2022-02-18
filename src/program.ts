import { AST as Glimmer }      from 'glimmer-engine/dist/@glimmer/syntax'
import * as Babel              from '@babel/types'
import { createRootChildren }  from './expressions'
import { prepareProgramPaths } from './pathsPrepare'
import { createComponent }     from './componentCreator'
import { setProgramOptions }   from './programContext'

const getImportDirectives = (externals: string[]):Babel.ImportDeclaration[] => {
  const reactImport = Babel.importDeclaration(
    [Babel.importDefaultSpecifier(Babel.identifier('React'))],
    Babel.stringLiteral('react')
  );
  const externalImports = externals.map((name) => Babel.importDeclaration(
    [Babel.importDefaultSpecifier(Babel.identifier(name))],
    Babel.stringLiteral(`./${name}`) // TODO: add support for specifying partial and/or helpers directory
  ));

  return [reactImport, ...externalImports];
};

/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isComponent Should return JSX code wrapped as a function component
 * @param isModule Should return generated code exported as default
 * @param includeImport Should include react import
 * @param includeContext Should always include template context as property of props
 * @param helpers Helper function declarations, generated from pre-processing block mustache statements within node attributes
 */
export const createProgram = (
  hbsProgram: Glimmer.Template,
  isComponent: boolean,
  isModule: boolean,
  includeImport: boolean,
  includeContext: boolean,
  includeExperimentalFeatures: boolean,
  helpers: Babel.VariableDeclaration[]
): Babel.Program => {
  setProgramOptions({ isComponent, isModule, includeImport, includeContext, includeExperimentalFeatures });
  
  const { partialTemplates, helperFunctions } = prepareProgramPaths(hbsProgram);
  const inlineHelperNames = helpers.map((helperDeclaration) => (helperDeclaration.declarations[0].id as Babel.Identifier).name);
  const externalHelpers = helperFunctions.filter((helper) => !inlineHelperNames.includes(helper));
  const externals = [...partialTemplates, ...externalHelpers];

  const componentBody = createRootChildren(hbsProgram.body);
  const expression = isComponent ? createComponent(componentBody) : componentBody;
  const statement: Babel.Statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression);
  const directives: Babel.Statement[] = includeImport ? [...getImportDirectives(externals), ...helpers, statement] : [...helpers, statement];

  return Babel.program(directives);
};
