"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("@glimmer/syntax");
var generator_1 = require("@babel/generator");
var program_1 = require("./program");
/**
 * Compiles hbs code
 */
exports.compile = function (hbsCode, isComponent, isModule) {
    if (isComponent === void 0) { isComponent = true; }
    if (isModule === void 0) { isModule = false; }
    var glimmerProgram = syntax_1.preprocess(hbsCode);
    var babelProgram = program_1.createProgram(glimmerProgram, isComponent, isModule);
    return generator_1.default(babelProgram).code;
};
