"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("@glimmer/syntax");
var Babel = require("@babel/types");
var expressions_1 = require("./expressions");
/**
 * Transforms "prop-name" to "propName"
 * @param propName
 */
exports.camelizePropName = function (propName) { return propName.replace(/-([a-z])/g, function (_, $1) { return $1.toUpperCase(); }); };
/**
 * Create AST tree of style object
 */
exports.createStyleObject = function (hbsStatement) {
    var rawHbsStatement = hbsStatement.type === 'TextNode' ? hbsStatement.chars : syntax_1.print(hbsStatement).slice(1, -1);
    var objectProps = rawHbsStatement
        .split(';')
        .filter(function (item) { return item.length !== 0; })
        .map(function (cssRule) {
        var _a = cssRule.split(':').map(function (str) { return str.trim(); }), rawKey = _a[0], rawValue = _a[1];
        var _b = [rawKey, rawValue].map(function (item) {
            return syntax_1.preprocess(item || '').body.filter(function (item) { return item.type === 'MustacheStatement' || item.type === 'TextNode'; });
        }), hbsKey = _b[0], hbsValue = _b[1];
        var key = hbsKey.length === 1
            ? hbsKey[0].type === 'TextNode'
                ? Babel.stringLiteral(exports.camelizePropName(hbsKey[0].chars)) // Capitalize key name
                : expressions_1.resolveStatement(hbsKey[0])
            : expressions_1.createConcat(hbsKey);
        var value = hbsValue.length === 1 ? expressions_1.resolveStatement(hbsValue[0]) : expressions_1.createConcat(hbsValue);
        var isComputed = hbsKey.length > 1;
        return Babel.objectProperty(key, value, isComputed);
    });
    return Babel.objectExpression(objectProps);
};
