"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("@babel/parser");
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
    var lastStyleAttr = '';
    var lastVariableValue = '';
    concatStatement.parts.forEach(function (part) {
        if (part.type === 'TextNode') {
            var stylePropList_1 = part.chars.split(';');
            stylePropList_1.forEach(function (styleProp) {
                var ruleSplit = styleProp.split(':').map(function (str) { return str.trim(); });
                // a part of the value recently found in MustacheStatement
                if (ruleSplit.length === 1) {
                    styleObjectExpressionString += "\"" + exports.camelizePropName(lastStyleAttr.trim()) + "\": ";
                    styleObjectExpressionString += '`${' + lastVariableValue + '}' + stylePropList_1[0] + '`,';
                    lastStyleAttr = '';
                    lastVariableValue = '';
                }
                if (ruleSplit.length === 2) {
                    var styleAttr = ruleSplit[0], styleValue = ruleSplit[1];
                    if (!!styleAttr && !!styleValue) {
                        styleObjectExpressionString += "\"" + exports.camelizePropName(styleAttr.trim()) + "\": \"" + styleValue + "\",";
                    }
                    if (!!styleAttr && !styleValue) {
                        lastStyleAttr = styleAttr;
                    }
                }
            });
        }
        if (part.type === 'MustacheStatement' && part.path.type === 'PathExpression') {
            lastVariableValue = part.path.parts.join('.');
        }
    });
    styleObjectExpressionString += '}';
    return parser_1.parseExpression(styleObjectExpressionString);
};
