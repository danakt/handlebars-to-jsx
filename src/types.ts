import { AST as Glimmer } from 'glimmer-engine/dist/@glimmer/syntax'

export interface MustacheHelperStatement extends Omit<Glimmer.MustacheStatement, 'type'> {
    type: 'MustacheHelperStatement'
}

// NOTE: without additional context, a helper function with no params is indistinguishable from a regular mustache statement
export const isMustacheHelperStatement = (node:Glimmer.MustacheStatement) => node.params.length > 0;
