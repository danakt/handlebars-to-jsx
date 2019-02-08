"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var expressions_1 = require("./expressions");
var elements_1 = require("./elements");
var contants_1 = require("./contants");
/**
 * Resolves block type
 */
exports.resolveBlockStatement = function (blockStatement) {
    switch (blockStatement.path.original) {
        case 'if': {
            return exports.createConditionStatement(blockStatement);
        }
        case 'each': {
            return exports.createEachStatement(blockStatement);
        }
        case 'linkTo': {
            return exports.createLinkStatement(blockStatement);
        }
        default: {
            throw new Error("Unexpected " + blockStatement.path.original + " statement");
        }
    }
};
/**
 * Creates a custom linkTo statement
 */
// HBS
// {{#linkTo 'javascript:void(0)' '' 'btn back-to-giving' '' }}
//   <i class='zp-icon zp-icon-arrow-back'></i> Back to Giving
// {{/linkTo}}
//
// React
// <Link href={javascript:void(0)}>
//   <i class='zp-icon zp-icon-arrow-back'></i> Back to Giving
// </Link>
exports.createLinkStatement = function (blockStatement) {
    var program = blockStatement.program, params = blockStatement.params;
    // console.log(params)
    // console.log(program.body)
    var href = params[0] && params[0].value;
    var text = params[1] && params[1].value;
    var className = params[2] && params[2].value;
    var attributesParam = params[4] && params[4].value;
    var hrefAttribute = Babel.jsxAttribute(Babel.jsxIdentifier('href'), Babel.stringLiteral(href));
    var classNameAttribute = Babel.jsxAttribute(Babel.jsxIdentifier('className'), Babel.stringLiteral(className));
    // this is a mess!
    var children = expressions_1.createRootChildren(program.body);
    var textChild = Babel.jsxText(children.value);
    var identifier = Babel.jsxIdentifier('Link');
    // TODO: return elementnode?
    return Babel.jsxElement(Babel.jsxOpeningElement(identifier, [hrefAttribute, classNameAttribute], false), Babel.jsxClosingElement(identifier), [textChild], // createRootChildren(program.body)
    false);
};
/**
 * Creates condition statement
 */
exports.createConditionStatement = function (blockStatement) {
    var program = blockStatement.program, inverse = blockStatement.inverse;
    var boolCondSubject = Babel.callExpression(Babel.identifier('Boolean'), [expressions_1.resolveExpression(blockStatement.params[0])] //
    );
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
    wrappedCallbackChildren.openingElement.attributes.push(Babel.jsxAttribute(Babel.jsxIdentifier('key'), Babel.jsxExpressionContainer(Babel.identifier(contants_1.DEFAULT_KEY_NAME))));
    var mapCallback = Babel.arrowFunctionExpression([Babel.identifier(contants_1.DEFAULT_NAMESPACE_NAME), Babel.identifier(contants_1.DEFAULT_KEY_NAME)], wrappedCallbackChildren);
    return Babel.callExpression(iterator, [mapCallback]);
};
