import * as Babel from '@babel/types';

export interface PreparedTemplate {
    template: string,
    helpers: Babel.VariableDeclaration[]
};
  
export interface AttributeReference {
    attributeName: string,
    value: string,
    startIndex: number,
    length: number
};

export interface ReplacementAttributeReference {
    helper: Babel.VariableDeclaration,
    attribute: string,
    originalStartIndex: number,
    originalLength: number
};
