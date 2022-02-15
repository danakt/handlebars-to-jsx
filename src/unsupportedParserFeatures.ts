import * as Babel from '@babel/types';

interface PreparedTemplate {
  template: string,
  helpers: Babel.VariableDeclaration[]
};

interface AttributeReference {
  attributeName: string,
  value: string,
  startIndex: number,
  length: number
};

interface ReplacementAttributeReference {
  helper: Babel.VariableDeclaration,
  attribute: string,
  originalStartIndex: number,
  originalLength: number
};

// Locate attributes including: <div id='id' class="class" text=text data = "data" mustache={{name}} ...etc
const getAllAttributesRegex = /(\w+)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const containsMustacheStatementRegex = /{{\s?(\w*)\s?}}/;
const getDataFromBuiltInHelperRegex = '{{#(if|unless) ([^}]*)}}(.*){{/(if|unless)}}([^{]*)$';

// TODO: add support for leadingData as well...
const getIfTrueResultForLiteralChild = (helperChild: string, trailingData: string | null) => {
  return Babel.stringLiteral(trailingData ? `${helperChild}${trailingData}` : helperChild);
};

// TODO: add support for leadingData as well...
const getIfTrueResultForDependentChild = (helperChild: Babel.Identifier, trailingData: string | null) => {
  return trailingData ? Babel.binaryExpression('+', helperChild, Babel.stringLiteral(trailingData as string)) : helperChild;
};

const getHelperAndAttribute = (attributeName: string, originalHelperName: string, originalHelperArg: string, helperChild: string, trailingData: string | null): {
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
  const ifTrueResult = childIdentifier ? getIfTrueResultForDependentChild(childIdentifier, trailingData) : getIfTrueResultForLiteralChild(helperChild, trailingData);
  const ifFalseResult = Babel.stringLiteral(trailingData ? trailingData : '');
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

    const [_, originalHelperName, originalHelperArg, helperChild, __, trailingData] = attributeValueData;
    if (helperChild.match(containsMustacheBlockRegex)) { // TODO: support helperChild being a block statement (use recursion?)
        throw `Unsupported block statement as child found in attribute '${attributeName}': ${helperChild}`;
    }

    const { helper, attribute } = getHelperAndAttribute(attributeName, originalHelperName, originalHelperArg, helperChild, trailingData);
    
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

const buildNewTemplate = (originalTemplate: string, replacementAttributes: ReplacementAttributeReference[]): string => {
  let template = '';
  let currentIndexInOriginal = 0;
  replacementAttributes.forEach(({ attribute, originalStartIndex, originalLength }) => {
    const portionBeforeAttribute = originalTemplate.substring(currentIndexInOriginal, originalStartIndex);
    template += `${portionBeforeAttribute}${attribute}`;
    currentIndexInOriginal = originalStartIndex + originalLength;
  });
  template += originalTemplate.substring(currentIndexInOriginal);

  return template;
}

const replaceBlockStatementsWithinAttributes = (handlebarsTemplate: string):PreparedTemplate => {
  const newAttributesWithHelpers = getAttributesContainingBlockStatement(handlebarsTemplate).map(rewriteAttributeAsHelper);
  if (newAttributesWithHelpers.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributesWithHelpers),
    helpers: newAttributesWithHelpers.map(({ helper }) => helper)
  };
};

const capitalizeFirstLetter = (input: string):string => input ? `${input[0].toUpperCase()}${input.substring(1)}` : input;

const lowercaseFirstLetter = (input: string):string => input ? `${input[0].toLowerCase()}${input.substring(1)}` : input;

export const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):PreparedTemplate => replaceBlockStatementsWithinAttributes(handlebarsTemplate);
