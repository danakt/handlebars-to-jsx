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
