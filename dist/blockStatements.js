"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var expressions_1 = require("./expressions");
var elements_1 = require("./elements");
var constants_1 = require("./constants");
/**
 * Resolves block type
 */
exports.resolveBlockStatement = function (blockStatement) {
    switch (blockStatement.path.original) {
        case 'if': {
            return exports.createConditionStatement(blockStatement, false);
        }
        case 'unless': {
            return exports.createConditionStatement(blockStatement, true);
        }
        case 'each': {
            return exports.createEachStatement(blockStatement);
        }
        default: {
            throw new Error("Unexpected " + blockStatement.path.original + " statement");
        }
    }
};
/**
 * Creates condition statement
 */
exports.createConditionStatement = function (blockStatement, invertCondition) {
    var program = blockStatement.program, inverse = blockStatement.inverse;
    var boolCondSubject = Babel.callExpression(Babel.identifier('Boolean'), [expressions_1.resolveExpression(blockStatement.params[0])]);
    if (invertCondition) {
        boolCondSubject = Babel.unaryExpression('!', boolCondSubject);
    }
    if (inverse == null) {
        // Logical expression
        // {Boolean(variable) && <div />}
        return Babel.logicalExpression('&&', boolCondSubject, expressions_1.createRootChildren(program.body));
    }
    else {
        // Ternary expression
        // {Boolean(variable) ? <div /> : <span />}
        return Babel.conditionalExpression(boolCondSubject, expressions_1.createRootChildren(program.body), expressions_1.createRootChildren(inverse.body));
    }
};
/**
 * Creates each block statement
 */
exports.createEachStatement = function (blockStatement) {
    var pathExpression = blockStatement.params[0];
    var iterator = expressions_1.appendToPath(expressions_1.createPath(pathExpression), Babel.identifier('map'));
    var mapCallbackChildren = expressions_1.createRootChildren(blockStatement.program.body);
    // If top-level child element is JS expression, wrap into fragment to add
    // the "key" attribute.
    var wrappedCallbackChildren = !Babel.isJSXElement(mapCallbackChildren)
        ? elements_1.createFragment([Babel.jsxExpressionContainer(mapCallbackChildren)])
        : mapCallbackChildren;
    // Adding the "key" attribute to child element
    wrappedCallbackChildren.openingElement.attributes.push(Babel.jsxAttribute(Babel.jsxIdentifier('key'), Babel.jsxExpressionContainer(Babel.identifier(constants_1.DEFAULT_KEY_NAME))));
    var mapCallback = Babel.arrowFunctionExpression([Babel.identifier(constants_1.DEFAULT_NAMESPACE_NAME), Babel.identifier(constants_1.DEFAULT_KEY_NAME)], wrappedCallbackChildren);
    return Babel.callExpression(iterator, [mapCallback]);
};
