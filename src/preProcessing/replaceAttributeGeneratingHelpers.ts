import { ReplacementAttributeReference, PreparedTemplate } from './preProcessingTypes';
import { ATTRIBUTE_GENERATOR_PLACEHOLDER } from '../constants';
import buildNewTemplate from './buildNewTemplate';

const getAllOpeningTagDataRegex = /<([^>]*)\/?>/g; // TODO: use to only look within opening tag
const getAllAttributeGeneratingHelperStatementsRegex = /{{((?:[\w|\s])+)}}/g;

const getAttributeGeneratorAttributes = (handlebarsTemplate: string):ReplacementAttributeReference[] =>
    [...handlebarsTemplate.matchAll(getAllAttributeGeneratingHelperStatementsRegex)].map((matchResult) => {
        const [ statement, innerData ] = matchResult;
        const [ helperName, ...helperArgs ] = innerData.split(' ').map((item) => item.trim());

        return {
            helper: null,
            attribute: `${ATTRIBUTE_GENERATOR_PLACEHOLDER}="{{${helperName} ${helperArgs.join(' ')}}}"`,
            originalStartIndex: matchResult.index as number,
            originalLength: statement.length
        };
    });

const replaceAttributeGeneratingHelpers = (handlebarsTemplate: string):PreparedTemplate => {
  const newAttributes = getAttributeGeneratorAttributes(handlebarsTemplate);
  if (newAttributes.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributes),
    helpers: []
  };
};

export default replaceAttributeGeneratingHelpers;
