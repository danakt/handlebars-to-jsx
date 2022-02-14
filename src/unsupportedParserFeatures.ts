//


// Locate attributes including: <div id='id' class="class" text=text data = "data" ...etc
const getAllAttributesRegex = /(\w+)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const containsMustacheStatementRegex = '{{(.*)}}';
const getDataFromBuiltInHelperRegex = '{{#(if|unless) ([^}]*)}}([^{]*){{/(if|unless)}}$';

interface PreparedTemplate {
  template: string,
  helpers: string[]
};

const replaceBlockStatementsWithinAttributes = (handlebarsTemplate: string):PreparedTemplate => {
  const attributesWithBlockStatement = [...handlebarsTemplate.matchAll(getAllAttributesRegex)].filter(([fullMatch]) => fullMatch.match(containsMustacheBlockRegex));
  if (attributesWithBlockStatement.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  const newAttributeDataList = attributesWithBlockStatement.map((attributeData) => {
    const [ originalAttribute, key, value ] = attributeData;
    const attributeValueData = value.match(getDataFromBuiltInHelperRegex);
    if (!attributeValueData) {
      throw `Unsupported block statement found in attribute '${key}'': ${value}`;
    }
    const [_, originalHelperName, originalHelperArg, helperChild] = attributeValueData;

    // TODO: support helperChild being a block statement (use recursion?) or mustache statement
    if (helperChild.match(containsMustacheStatementRegex)) {
        throw `Unsupported block statement child found in attribute '${key}'': ${value}`;
    }

    const shouldNegateArgument = originalHelperName === 'unless';
    const helperArgCondition = shouldNegateArgument ? `!${originalHelperArg}` : originalHelperArg;
    const helperName = `${key.toLowerCase()}${capitalizeFirstLetter(originalHelperName)}Helper`;
    const helper = `const ${helperName} = (${originalHelperArg}) => ${helperArgCondition} ? '${helperChild}' : '';`;
    const newAttribute = `${key}="{{${helperName} ${originalHelperArg}}}"`;
    const originalStartIndex = attributeData.index as number;
    const originalLength = originalAttribute.length as number;
    
    return { helper, newAttribute, originalStartIndex, originalLength };
  });

  const helpers = newAttributeDataList.map(({ helper }) => helper);
  let template = '';
  let currentIndexInOriginal = 0;
  newAttributeDataList.forEach(({ newAttribute, originalStartIndex, originalLength }) => {
    const portionBeforeAttribute = handlebarsTemplate.substring(currentIndexInOriginal, originalStartIndex - currentIndexInOriginal);
    template += `${portionBeforeAttribute}${newAttribute}`;
    currentIndexInOriginal += originalStartIndex + originalLength;
  });
  template += handlebarsTemplate.substring(currentIndexInOriginal);

  return { template, helpers };
};

const capitalizeFirstLetter = (input: string):string => input ? `${input[0].toUpperCase()}${input.substring(1)}` : input;

const lowerCaseFirstLetter = (input: string):string => input ? `${input[0].toLowerCase()}${input.substring(1)}` : input;

export const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):PreparedTemplate => replaceBlockStatementsWithinAttributes(handlebarsTemplate);
