import * as Babel from '@babel/types';
import { AttributeReference, ReplacementAttributeReference, PreparedTemplate } from './preProcessingTypes';
import { lowercaseFirstLetter, capitalizeFirstLetter, escapeRegexCharacters } from './utilities';

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

const getHelperAndAttribute = (attributeName: string, originalHelperName: string, originalHelperArg: string, helperChild: string, leadingData: string | null, trailingData: string | null): {
  helper: Babel.VariableDeclaration,
  attribute: string
} => {
  const contextDependentChild = helperChild.match(containsMustacheStatementRegex);
  const childIdentifier = contextDependentChild ? Babel.identifier(lowercaseFirstLetter(contextDependentChild[1])) : null;
  const helperName = `${attributeName.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper`;
  const shouldNegateArgument = originalHelperName === 'unless';
  const variableName = Babel.identifier(helperName);
  const variableFunctionArgumentFromOriginal = Babel.identifier(lowercaseFirstLetter(originalHelperArg));
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

const rewriteAttributeAsHelper = ({ attributeName, value, startIndex: originalStartIndex, length: originalLength }: AttributeReference): ReplacementAttributeReference => {
    const attributeValueData = value.match(getDataFromBuiltInHelperRegex);
    if (!attributeValueData) {
      throw `Unsupported block statement found in attribute '${attributeName}'': ${value}`;
    }

    const [_, leadingData, originalHelperName, originalHelperArg, helperChild, __, trailingData] = attributeValueData;
    if (helperChild.match(containsMustacheBlockRegex)) { // TODO: support helperChild being a block statement (use recursion?)
        throw `Unsupported block statement as child found in attribute '${attributeName}': ${helperChild}`;
    }

    const { helper, attribute } = getHelperAndAttribute(attributeName, originalHelperName, originalHelperArg, helperChild, leadingData, trailingData);
    
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

const getConditionalAttributeHelper = (attributeName: string, originalHelperName: string, originalHelperArg: string, helperChild: string): {
  helper: Babel.VariableDeclaration,
  attribute: string
} => {
  const contextDependentChild = helperChild.match(containsMustacheStatementRegex);
  const childIdentifier = contextDependentChild ? Babel.identifier(lowercaseFirstLetter(contextDependentChild[1])) : null;
  const helperName = `${attributeName.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper`;
  const shouldNegateArgument = originalHelperName === 'unless';
  const variableName = Babel.identifier(helperName);
  const variableFunctionArgumentFromOriginal = Babel.identifier(lowercaseFirstLetter(originalHelperArg));
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

const getAttributesSurroundedByBlockStatement = (handlebarsTemplate: string):ReplacementAttributeReference[] => {
  const attributesWithConditionalHelpers:ReplacementAttributeReference[] = [];
  [...handlebarsTemplate.matchAll(getAllAttributesRegex)].forEach(([originalAttribute, attributeName, value]) => {
    // TODO: support multiple conditional attributes within the same block
    const testRegex = `{{#(if|unless) ([^}]*)}} *${escapeRegexCharacters(originalAttribute)} *{{/(if|unless)}}`;
    const testResults = handlebarsTemplate.match(testRegex);
    if (!testResults) {
      return;
    }

    const [fullMatch, originalHelperName, originalHelperArg] = testResults;
    const { helper, attribute } = getConditionalAttributeHelper(attributeName, originalHelperName, originalHelperArg, value);
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

const buildNewTemplate = (originalTemplate: string, replacementAttributes: ReplacementAttributeReference[]): string => {
  let template = '';
  let currentIndexInOriginal = 0;
  replacementAttributes.forEach(({ attribute, originalStartIndex, originalLength }) => {
    const portionBeforeAttribute = originalTemplate.substring(currentIndexInOriginal, originalStartIndex);
    const shouldIncludeSpace = originalStartIndex > 0 && portionBeforeAttribute.charAt(portionBeforeAttribute.length - 1) !== ' ';
 
    template += `${portionBeforeAttribute}${shouldIncludeSpace ? ' ' : ''}${attribute}`;
    currentIndexInOriginal = originalStartIndex + originalLength;
  });
  template += originalTemplate.substring(currentIndexInOriginal);

  return template;
}

export const replaceBlockStatementsWithinAttributes = (handlebarsTemplate: string):PreparedTemplate => {
  const newAttributesWithHelpers = getAttributesContainingBlockStatement(handlebarsTemplate).map(rewriteAttributeAsHelper);
  if (newAttributesWithHelpers.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributesWithHelpers),
    helpers: newAttributesWithHelpers.map(({ helper }) => helper)
  };
};

export const replaceBlockStatementsAroundAttributes = (handlebarsTemplate: string):PreparedTemplate => {
    const newAttributesWithHelpers = getAttributesSurroundedByBlockStatement(handlebarsTemplate);
    if (newAttributesWithHelpers.length === 0) {
      return { template: handlebarsTemplate, helpers: [] };
    }
  
    return {
      template: buildNewTemplate(handlebarsTemplate, newAttributesWithHelpers),
      helpers: newAttributesWithHelpers.map(({ helper }) => helper)
    };
  };
