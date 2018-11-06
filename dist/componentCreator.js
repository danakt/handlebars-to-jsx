"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
/**
 * Creates arrow component
 */
exports.createComponent = function (body) {
    return Babel.arrowFunctionExpression([Babel.identifier('props')], body);
};
