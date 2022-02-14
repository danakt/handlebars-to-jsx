interface PreparedTemplate {
  template: string,
  helpers: string[]
};

interface AttributeReference {
  attributeName: string,
  value: string,
  startIndex: number,
  length: number
};

interface ReplacementAttributeReference {
  helper: string,
  attribute: string,
  originalStartIndex: number,
  originalLength: number
};

// Locate attributes including: <div id='id' class="class" text=text data = "data" mustache={{name}} ...etc
const getAllAttributesRegex = /(\w+)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const containsMustacheStatementRegex = /{{\s?(\w*)\s?}}/;
const getDataFromBuiltInHelperRegex = '{{#(if|unless) ([^}]*)}}(.*){{/(if|unless)}}([^{]*)$';

const getHelperAndAttributeWithDependentChild = (attributeName: string, helperName: string, helperArgCondition: string, originalHelperArg: string, dependentChild: string, trailingData: string | null): {
  helper: string,
  attribute: string
} => {
  const helper = `const ${helperName} = (${originalHelperArg}, ${dependentChild}) => ${helperArgCondition} ? \`\$\{${dependentChild}\}${trailingData}\` : '${trailingData}';`;
  const attribute = `${attributeName}="{{${helperName} ${originalHelperArg} ${dependentChild}}}"`;

  return { helper, attribute };
};

const getHelperAndAttribute = (attributeName: string, originalHelperName: string, originalHelperArg: string, helperChild: string, trailingData: string | null): {
  helper: string,
  attribute: string
} => {
  const shouldNegateArgument = originalHelperName === 'unless';
  const helperArgCondition = shouldNegateArgument ? `!${originalHelperArg}` : originalHelperArg;
  const helperName = `${attributeName.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper`;

  const contextDependentChild = helperChild.match(containsMustacheStatementRegex);
  if (contextDependentChild) {
    const [_, dependentChild] = contextDependentChild;
    return getHelperAndAttributeWithDependentChild(attributeName, helperName, helperArgCondition, originalHelperArg, dependentChild, trailingData);
  }

  const ifTrueResult = trailingData ? `${helperChild}${trailingData}` : helperChild;
  const ifFalseResult = trailingData ? trailingData : '';
  const helper = `const ${helperName} = (${originalHelperArg}) => ${helperArgCondition} ? '${ifTrueResult}' : '${ifFalseResult}';`;
  const attribute = `${attributeName}="{{${helperName} ${originalHelperArg}}}"`;

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

export const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):PreparedTemplate => replaceBlockStatementsWithinAttributes(handlebarsTemplate);
