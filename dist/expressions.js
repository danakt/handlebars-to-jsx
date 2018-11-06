"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var elements_1 = require("./elements");
var blockStatements_1 = require("./blockStatements");
var comments_1 = require("./comments");
/**
 * Converts the Handlebars expression to NON-JSX JS-compatible expression.
 * Creates top-level expression or expression which need to wrap to JSX
 * expression container.
 */
exports.resolveStatement = function (statement) {
    switch (statement.type) {
        case 'ElementNode': {
            return elements_1.convertElement(statement);
        }
        case 'TextNode': {
            return Babel.stringLiteral(statement.chars);
        }
        case 'MustacheStatement': {
            return exports.resolveExpression(statement.path);
        }
        case 'BlockStatement': {
            return blockStatements_1.resolveBlockStatement(statement);
        }
        case 'MustacheCommentStatement':
        case 'CommentStatement': {
            throw new Error('Top level comments currently is not supported');
        }
        default: {
            throw new Error("Unexpected expression \"" + statement.type + "\"");
        }
    }
};
/**
 * Converts the Handlebars node to JSX-children-compatible child element.
 * Creates JSX expression or expression container with JS expression, to place
 * to children of a JSX element.
 */
exports.resolveElementChild = function (statement) {
    switch (statement.type) {
        case 'ElementNode': {
            return elements_1.convertElement(statement);
        }
        case 'TextNode': {
            return Babel.jsxText(statement.chars);
        }
        case 'MustacheCommentStatement':
        case 'CommentStatement': {
            return comments_1.createComment(statement);
        }
        // If it expression, create a expression container
        default: {
            return Babel.jsxExpressionContainer(exports.resolveStatement(statement));
        }
    }
};
/**
 * Converts Hbs expression to Babel expression
 */
exports.resolveExpression = function (expression) {
    switch (expression.type) {
        case 'PathExpression': {
            return exports.createPath(expression);
        }
        case 'BooleanLiteral': {
            return Babel.booleanLiteral(expression.value);
        }
        case 'NullLiteral': {
            return Babel.nullLiteral();
        }
        case 'NumberLiteral': {
            return Babel.numericLiteral(expression.value);
        }
        case 'StringLiteral': {
            return Babel.stringLiteral(expression.value);
        }
        case 'UndefinedLiteral': {
            return Babel.identifier('undefined');
        }
        default: {
            throw new Error('Unexpected mustache statement');
        }
    }
};
/**
 * Returns path to variable
 */
exports.createPath = function (pathExpression) {
    var parts = pathExpression.parts;
    if (parts.length === 0) {
        throw new Error('Unexpected empty expression parts');
    }
    // Start identifier
    var acc = Babel.identifier(parts[0]);
    for (var i = 1; i < parts.length; i++) {
        acc = exports.appendToPath(acc, Babel.identifier(parts[i]));
    }
    return acc;
};
/**
 * Appends item to path
 */
exports.appendToPath = function (path, append) {
    return Babel.memberExpression(path, append);
};
/**
 * Prepends item to path
 */
exports.prependToPath = function (path, prepend) {
    return Babel.memberExpression(prepend, path);
};
/**
 * Converts child statements of element to JSX-compatible expressions
 * @param body List of Glimmer statements
 */
exports.createChildren = function (body) {
    return body.map(function (statement) { return exports.resolveElementChild(statement); });
};
/**
 * Converts root children
 */
exports.createRootChildren = function (body) {
    return body.length === 1 ? exports.resolveStatement(body[0]) : elements_1.createFragment(exports.createChildren(body));
};
/**
 * Creates attribute value concatenation
 */
exports.createConcat = function (parts) {
    return parts.reduce(function (acc, item) {
        if (acc == null) {
            return exports.resolveStatement(item);
        }
        return Babel.binaryExpression('+', acc, exports.resolveStatement(item));
    }, null);
};
