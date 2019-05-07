"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var expressions_1 = require("./expressions");
var pathsPrepare_1 = require("./pathsPrepare");
var componentCreator_1 = require("./componentCreator");
/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isComponent Should return JSX code wrapped as a function component
 * @param isModule Should return generated code exported as default
 * @param includeImport Should include react import
 */
exports.createProgram = function (hbsProgram, isComponent, isModule, includeImport) {
    pathsPrepare_1.prepareProgramPaths(hbsProgram, isComponent);
    var reactImport = Babel.importDeclaration([Babel.importDefaultSpecifier(Babel.identifier('React'))], Babel.stringLiteral('react'));
    var componentBody = expressions_1.createRootChildren(hbsProgram.body);
    var expression = isComponent ? componentCreator_1.createComponent(componentBody) : componentBody;
    var statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression);
    var directives = [statement];
    includeImport && directives.unshift(reactImport);
    return Babel.program(directives);
};
