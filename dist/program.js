"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var expressions_1 = require("./expressions");
var pathsPrepare_1 = require("./pathsPrepare");
var componentCreator_1 = require("./componentCreator");
/**
 * Creates program statement
 * @param hbsProgram The Handlebars program (root AST node)
 * @param isModule Should output code be exported by default
 */
exports.createProgram = function (hbsProgram, isComponent, isModule) {
    pathsPrepare_1.prepareProgramPaths(hbsProgram, isComponent);
    var componentBody = expressions_1.createRootChildren(hbsProgram.body);
    var expression = isComponent ? componentCreator_1.createComponent(componentBody) : componentBody;
    var statement = isModule ? Babel.exportDefaultDeclaration(expression) : Babel.expressionStatement(expression);
    return Babel.program([statement]);
};
