"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
var isSelfClosing = require("is-self-closing");
var convertHTMLAttribute = require("react-attr-converter");
var expressions_1 = require("./expressions");
var styles_1 = require("./styles");
/**
 * Creates JSX fragment
 */
exports.createFragment = function (children, attributes) {
    if (attributes === void 0) { attributes = []; }
    var fragmentMemberExpression = Babel.jsxMemberExpression(Babel.jsxIdentifier('React'), Babel.jsxIdentifier('Fragment'));
    var openingFragment = Babel.jsxOpeningElement(fragmentMemberExpression, attributes);
    var closingFragment = Babel.jsxClosingElement(fragmentMemberExpression);
    return Babel.jsxElement(openingFragment, closingFragment, children, false);
};
/**
 * Coverts AttrNode to JSXAttribute
 */
exports.createAttribute = function (attrNode) {
    // Unsupported attribute
    var reactAttrName = convertHTMLAttribute(attrNode.name);
    if (!/^[_\-A-z0-9]+$/.test(reactAttrName)) {
        return null;
    }
    var name = Babel.jsxIdentifier(reactAttrName);
    var value = attrNode.value;
    switch (value.type) {
        case 'TextNode': {
            if (reactAttrName === 'style') {
                var styleObjectExpression = styles_1.parseStyleString(value.chars);
                return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(styleObjectExpression));
            }
            return Babel.jsxAttribute(name, Babel.stringLiteral(value.chars));
        }
        case 'MustacheStatement': {
            return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(expressions_1.resolveExpression(value.path)));
        }
        case 'ConcatStatement': {
            var expression = expressions_1.createConcat(value.parts);
            return Babel.jsxAttribute(name, Babel.jsxExpressionContainer(expression));
        }
        default: {
            throw new Error('Unexpected attribute value');
        }
    }
};
/**
 * Converts ElementNode to JSXElement
 */
exports.convertElement = function (node) {
    var tagName = Babel.jsxIdentifier(node.tag);
    var attributes = node.attributes.map(function (item) { return exports.createAttribute(item); }).filter(Boolean);
    var isElementSelfClosing = node.selfClosing || isSelfClosing(node.tag);
    var children = expressions_1.createChildren(node.children);
    return Babel.jsxElement(Babel.jsxOpeningElement(tagName, attributes, isElementSelfClosing), Babel.jsxClosingElement(tagName), isElementSelfClosing ? [] : children, isElementSelfClosing);
};
