//


const getAllAttributesRegex = /(\w+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';
const containsMustacheStatementRegex = '{{(.*)}}';
const getDataFromBuiltInHelperRegex = '{{#(if|unless) ([^}]*)}}([^{]*){{/(if|unless)}}$';

const replaceBlockStatementsWithinAttributes = (handlebarsTemplate: string):string => {
  const rawAttributes = handlebarsTemplate.match(getAllAttributesRegex)?.filter((rawValue) => rawValue.match(containsMustacheBlockRegex));
  if (!rawAttributes || rawAttributes.length === 0) {
    return handlebarsTemplate;
  }

  const attributeKeyPairs = rawAttributes.map((rawValue) => {
    const keyValueDividerIndex = rawValue.indexOf('=');
    return {
      key: rawValue.substring(0, keyValueDividerIndex).trim(),
      value: rawValue.substring(keyValueDividerIndex + 1).trim()
    };
  });
  
  const helperFunctions = attributeKeyPairs.forEach(({ key, value }) => {
    const data = value.match(getDataFromBuiltInHelperRegex);
    if (!data) {
      throw `Unsupported block statement found in attribute '${key}'': ${value}`;
    }
    const [_, originalHelperName, originalHelperArg, helperChild] = data;

    // TODO: support helperChild being a block statement (use recursion?) or mustache statement
    if (helperChild.match(containsMustacheStatementRegex)) {
        throw `Unsupported block statement child found in attribute '${key}'': ${value}`;
    }
    //'<div id={{idIfHelper isTrue}}><div>'
    const shouldNegateArgument = originalHelperName === 'unless';
    const helperArgCondition = shouldNegateArgument ? `!${originalHelperArg}` : originalHelperArg;
    const helperName = `${lowerCaseFirstLetter(key)}${capitalizeFirstLetter(originalHelperName)}Helper`;
    const helper = `const ${helperName} = (${originalHelperArg}) => ${helperArgCondition} ? ${helperChild} : '';`;
    
    return helper;
  });

  return handlebarsTemplate; // TODO: implement translation into new template and array of helper functions
};

const capitalizeFirstLetter = (input: string):string => input ? `${input[0].toUpperCase()}${input.substring(1)}` : input;

const lowerCaseFirstLetter = (input: string):string => input ? `${input[0].toLowerCase()}${input.substring(1)}` : input;

export const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):string => replaceBlockStatementsWithinAttributes(handlebarsTemplate);
