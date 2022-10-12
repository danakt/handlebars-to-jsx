import * as Babel from '@babel/types';
import { AttributeReference, ReplacementAttributeReferenceWithHelper, PreparedTemplate } from './preProcessingTypes';
import { lowercaseFirstLetter, capitalizeFirstLetter, escapeRegexCharacters } from './utilities';
import buildNewTemplate from './buildNewTemplate';

// Locate attributes including: <div id='id' class="class" text=text data = "data" mustache={{name}} ...etc
const getAllAttributesRegex = /(\w+)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const containsMustacheStatementRegex = /{{\s?(\w*)\s?}}/;
const getDataFromBuiltInHelperRegex = '([^}]*){{#(if|unless) ([^}]*)}}(.*){{/(if|unless)}}([^{]*)$';

const getIfTrueResultForLiteralChild = (helperChild: string, leadingData: string, trailingData: string):Babel.Expression => Babel.stringLiteral(`${leadingData}${helperChild}${trailingData}`);

const getIfTrueResultForDependentChild = (helperChild: Babel.Identifier, leadingData: string | null, trailingData: string | null):Babel.Expression => {
  if (!leadingData && !trailingData) {
    return helperChild;
  }

  const leadingExpression = leadingData ? Babel.binaryExpression('+', Babel.stringLiteral(leadingData as string), helperChild) : helperChild;

  return trailingData ? Babel.binaryExpression('+', leadingExpression, Babel.stringLiteral(trailingData as string)) : leadingExpression;
};

const getHelperAndAttribute = (attributeName: string, originalHelperName: string, currentHelperCount: number, originalHelperArg: string, helperChild: string, leadingData: string | null, trailingData: string | null): {
  helper: Babel.VariableDeclaration,
  attribute: string
} => {
  const contextDependentChild = helperChild.match(containsMustacheStatementRegex);
  const childIdentifier = contextDependentChild ? Babel.identifier(lowercaseFirstLetter(contextDependentChild[1])) : null;
  const helperName = `${attributeName.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper${currentHelperCount > 1 ? currentHelperCount : ''}`;
  const shouldNegateArgument = originalHelperName === 'unless';
  const variableName = Babel.identifier(helperName);
  const contextualizedHelperArg = originalHelperArg.replaceAll("../", "")
  const variableFunctionArgumentFromOriginal = Babel.identifier(lowercaseFirstLetter(contextualizedHelperArg));
  const variableFunctionArguments = childIdentifier ? [variableFunctionArgumentFromOriginal, childIdentifier] : [variableFunctionArgumentFromOriginal];
  const conditionalCheck = shouldNegateArgument ? Babel.unaryExpression('!', variableFunctionArgumentFromOriginal) : variableFunctionArgumentFromOriginal;
  const ifTrueResult = childIdentifier ? getIfTrueResultForDependentChild(childIdentifier, leadingData, trailingData) : getIfTrueResultForLiteralChild(helperChild, leadingData ?? '', trailingData ?? '');
  const ifFalseResult = Babel.stringLiteral(`${leadingData ?? ''}${trailingData ?? ''}`);
  const variableFunctionBody = Babel.conditionalExpression(conditionalCheck, ifTrueResult, ifFalseResult);
  const variableFunction = Babel.arrowFunctionExpression(variableFunctionArguments, variableFunctionBody);
  const variableDeclarator = Babel.variableDeclarator(variableName, variableFunction);
  const helper = Babel.variableDeclaration('const', [variableDeclarator]);
  const attribute = childIdentifier ? `${attributeName}="{{${helperName} ${originalHelperArg} ${childIdentifier.name}}}"` : `${attributeName}="{{${helperName} ${originalHelperArg}}}"`;

  return { helper, attribute };
};

const rewriteAttributeAsHelper = ({ attributeName, value, startIndex: originalStartIndex, length: originalLength }: AttributeReference, currentHelperCount: number): ReplacementAttributeReferenceWithHelper => {
    const attributeValueData = value.match(getDataFromBuiltInHelperRegex);
    if (!attributeValueData) {
      throw `Unsupported block statement found in attribute '${attributeName}'': ${value}`;
    }

    const [_, leadingData, originalHelperName, originalHelperArg, helperChild, __, trailingData] = attributeValueData;
    if (helperChild.match(containsMustacheBlockRegex)) { // TODO: support helperChild being a block statement (use recursion?)
        throw `Unsupported block statement as child found in attribute '${attributeName}': ${helperChild}`;
    }

    const { helper, attribute } = getHelperAndAttribute(attributeName, originalHelperName, currentHelperCount, originalHelperArg, helperChild, leadingData, trailingData);
    
    return { helper, attribute, originalStartIndex, originalLength };
};

const getAttributesContainingBlockStatement = (handlebarsTemplate: string):AttributeReference[] => [...handlebarsTemplate.matchAll(getAllAttributesRegex)]
  .filter(([fullMatch]) => fullMatch.match(containsMustacheBlockRegex))
  .map((attributeMatchData) => {
    const [ originalAttribute, attributeName, value ] = attributeMatchData
    return {
      attributeName,
      value,
      startIndex: attributeMatchData.index as number,
      length: originalAttribute.length as number
    } as AttributeReference
  });

const getConditionalAttributeHelper = (attributeName: string, originalHelperName: string, currentHelperCount: number, originalHelperArg: string, helperChild: string): {
  helper: Babel.VariableDeclaration,
  attribute: string
} => {
  const contextDependentChild = helperChild.match(containsMustacheStatementRegex);
  const childIdentifier = contextDependentChild ? Babel.identifier(lowercaseFirstLetter(contextDependentChild[1])) : null;
  const helperName = `${attributeName.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper${currentHelperCount > 1 ? currentHelperCount : ''}`;
  const shouldNegateArgument = originalHelperName === 'unless';
  const variableName = Babel.identifier(helperName);
  const contextualizedHelperArg = originalHelperArg.replaceAll("../", "")
  const variableFunctionArgumentFromOriginal = Babel.identifier(lowercaseFirstLetter(contextualizedHelperArg));
  const variableFunctionArguments = childIdentifier ? [variableFunctionArgumentFromOriginal, childIdentifier] : [variableFunctionArgumentFromOriginal];
  const conditionalCheck = shouldNegateArgument ? Babel.unaryExpression('!', variableFunctionArgumentFromOriginal) : variableFunctionArgumentFromOriginal;
  const ifTrueResult = childIdentifier ? getIfTrueResultForDependentChild(childIdentifier, null, null) : getIfTrueResultForLiteralChild(helperChild, '', '');
  const ifFalseResult = Babel.identifier('undefined');
  const variableFunctionBody = Babel.conditionalExpression(conditionalCheck, ifTrueResult, ifFalseResult);
  const variableFunction = Babel.arrowFunctionExpression(variableFunctionArguments, variableFunctionBody);
  const variableDeclarator = Babel.variableDeclarator(variableName, variableFunction);
  const helper = Babel.variableDeclaration('const', [variableDeclarator]);
  const attribute = childIdentifier ? `${attributeName}="{{${helperName} ${originalHelperArg} ${childIdentifier.name}}}"` : `${attributeName}="{{${helperName} ${originalHelperArg}}}"`;

  return { helper, attribute };
};

const getAttributesSurroundedByBlockStatement = (handlebarsTemplate: string, helpersCount: number):ReplacementAttributeReferenceWithHelper[] => {
  const attributesWithConditionalHelpers:ReplacementAttributeReferenceWithHelper[] = [];
  [...handlebarsTemplate.matchAll(getAllAttributesRegex)].forEach(([originalAttribute, attributeName, value], referenceIndex) => {
    // TODO: support multiple conditional attributes within the same block
    const testRegex = `{{#(if|unless) ([^}]*)}} *${escapeRegexCharacters(originalAttribute)} *{{/(if|unless)}}`;
    const testResults = handlebarsTemplate.match(testRegex);
    if (!testResults) {
      return;
    }

    const [fullMatch, originalHelperName, originalHelperArg] = testResults;
    const { helper, attribute } = getConditionalAttributeHelper(attributeName, originalHelperName, helpersCount + referenceIndex, originalHelperArg, value);
    const replacementReference = {
      helper,
      attribute,
      originalStartIndex: testResults.index as number,
      originalLength: fullMatch.length
    }
    attributesWithConditionalHelpers.push(replacementReference);
  });

  return attributesWithConditionalHelpers;
}

export const replaceBlockStatementsWithinAttributes = (handlebarsTemplate: string, helpersCount: number):PreparedTemplate => {
  const newAttributesWithHelpers = getAttributesContainingBlockStatement(handlebarsTemplate).map((reference, referenceIndex) => rewriteAttributeAsHelper(reference, helpersCount + referenceIndex));
  if (newAttributesWithHelpers.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributesWithHelpers),
    helpers: newAttributesWithHelpers.map(({ helper }) => helper)
  };
};

export const replaceBlockStatementsAroundAttributes = (handlebarsTemplate: string, helpersCount: number):PreparedTemplate => {
  const newAttributesWithHelpers = getAttributesSurroundedByBlockStatement(handlebarsTemplate, helpersCount);
  if (newAttributesWithHelpers.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributesWithHelpers),
    helpers: newAttributesWithHelpers.map(({ helper }) => helper)
  };
};


