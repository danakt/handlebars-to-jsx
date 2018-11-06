"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Babel = require("@babel/types");
exports.createComment = function (statement) {
    var value = statement.value;
    var emptyExpression = Babel.jsxEmptyExpression();
    emptyExpression.innerComments = [{ type: 'CommentBlock', value: value }];
    return Babel.jsxExpressionContainer(emptyExpression);
};
