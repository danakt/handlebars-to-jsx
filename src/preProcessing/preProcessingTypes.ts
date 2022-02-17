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
    attribute: string,
    originalStartIndex: number,
    originalLength: number
};

export interface ReplacementAttributeReferenceWithHelper extends ReplacementAttributeReference {
    helper: Babel.VariableDeclaration
};
