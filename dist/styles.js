"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("@babel/parser");
var syntax_1 = require("@glimmer/syntax");
/**
 * Transforms "prop-name" to "propName"
 * @param propName
 */
exports.camelizePropName = function (propName) { return propName.replace(/-([a-z])/g, function (_, $1) { return $1.toUpperCase(); }); };
/**
 * Converts style string to style object
 */
exports.createStyleObject = function (style) {
    var styleObject = {};
    var stylePropsList = style.split(';');
    for (var i = 0; i < stylePropsList.length; i++) {
        var entry = stylePropsList[i].trim().split(/:(.+)/);
        if (entry.length < 2) {
            continue;
        }
        var propName = exports.camelizePropName(entry[0].trim());
        styleObject[propName] = entry[1].trim();
    }
    return styleObject;
};
/**
 * Creates AST tree of style object from style string
 * @param style Styles string
 */
exports.parseStyleString = function (style) { return parser_1.parseExpression(JSON.stringify(exports.createStyleObject(style))); };
/**
 * Create AST tree of style object from style concat
 */
exports.parseStyleConcat = function (concatStatement) {
    var styleObjectExpressionString = '{';
    var fullStatement = concatStatement.parts.reduce(function (statement, currentPart) {
        var currentStatement = '';
        if (currentPart.type === 'TextNode') {
            currentStatement = currentPart.chars;
        }
        if (currentPart.type === 'MustacheStatement' && currentPart.path.type === 'PathExpression') {
            currentStatement = "{{" + currentPart.path.parts.join('.') + "}}";
        }
        return "" + statement + currentStatement;
    }, '');
    fullStatement.split(';').forEach(function (cssRule) {
        var _a = cssRule.split(':').map(function (str) { return str.trim(); }), prop = _a[0], value = _a[1];
        var processedValue = syntax_1.preprocess(value);
        var finalValue = "\"" + value + "\"";
        if (processedValue.body.find(function (b) { return b.type === 'MustacheStatement'; })) {
            finalValue = processedValue.body.reduce(function (statement, current) {
                var currentStatement = '';
                if (current.type === 'TextNode') {
                    currentStatement = current.chars;
                }
                if (current.type === 'MustacheStatement' && current.path.type === 'PathExpression') {
                    currentStatement = '${' + current.path.parts.join('.') + '}';
                }
                return "" + statement + currentStatement;
            }, '');
            finalValue = "`" + finalValue + "`";
        }
        styleObjectExpressionString += "\"" + exports.camelizePropName(prop) + "\": ";
        styleObjectExpressionString += finalValue + ",";
    });
    styleObjectExpressionString += '}';
    return parser_1.parseExpression(styleObjectExpressionString);
};
