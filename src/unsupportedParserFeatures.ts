//


const getAllAttributesRegex = /(\w+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;
const containsMustacheBlockRegex = '{{.*}}.*{{/.*}}';

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
  attributeKeyPairs.forEach(({ key, value }) => {
    throw (`Mustache block statement found in <${key}>: ${value}`);
  });

  return handlebarsTemplate; // TODO: implement translation into new template and array of helper functions
};

export const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):string => replaceBlockStatementsWithinAttributes(handlebarsTemplate);
