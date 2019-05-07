"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("@glimmer/syntax");
var constants_1 = require("./constants");
/**
 * Checks is each statement
 */
var isEachStatement = function (node) {
    return node.type === 'BlockStatement' && node.path.original === 'each';
};
/**
 * Creates stack of namespaces
 */
var createNamespaceStack = function () {
    var namespaces = [];
    return {
        // Getter of length
        get length() {
            return namespaces.length;
        },
        /** Pushes sub namespaces */
        push: function (item) {
            return namespaces.push({
                node: item.node,
                name: item.name || constants_1.DEFAULT_NAMESPACE_NAME
            });
        },
        /** Goes to namespace up */
        pop: function () { return namespaces.pop(); },
        /** Returns head item of the stack */
        head: function () { return namespaces[namespaces.length - 1]; }
    };
};
/**
 * Prepares paths Glimmer AST for compatible with JS AST.
 */
exports.prepareProgramPaths = function (program, isComponent) {
    var namespaces = createNamespaceStack();
    // Global component namespace
    if (isComponent) {
        namespaces.push({ node: program, name: 'props' });
    }
    var eachStatementEntered = false;
    syntax_1.traverse(program, {
        // Process block statements
        All: {
            enter: function (node) {
                if (node.type === 'Program' && eachStatementEntered) {
                    namespaces.push({ node: node });
                    eachStatementEntered = false;
                }
                if (isEachStatement(node)) {
                    eachStatementEntered = true;
                }
            },
            exit: function (node) {
                // Exit from namespace
                if (namespaces.length > 0 && node === namespaces.head().node) {
                    namespaces.pop();
                }
            }
        },
        // Process path expressions
        PathExpression: function (node) {
            // Add prefixes
            if (namespaces.length) {
                node.parts.unshift(namespaces.head().name);
            }
        }
    });
};
