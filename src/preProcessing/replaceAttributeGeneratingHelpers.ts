import { ReplacementAttributeReference, PreparedTemplate } from './preProcessingTypes';
import { ATTRIBUTE_GENERATOR_PLACEHOLDER } from '../constants';
import buildNewTemplate from './buildNewTemplate';

const getAllOpeningTagDataRegex = /<([^>]*)\/?>/g;

// NOTE: this regex will identify all explicit helper calls (i.e. a mustache statement with multiple arguments)
// NOTE: this will not locate helper's that take 0 args since they cannot be distiniguished from basic mustache statements without additional context
// NOTE: this will conflict with (valid) helper calls within an attribute's value
// NOTE: to better distinguish helpers that generate attributes & those that generate part of an attributes' value, build this functionality within the parser itself
const getAllAttributeGeneratingHelperStatementsRegex = /[^="]\s?{{\s*([\w|\.]+\s+(?:[\w|\.]+\s?)+)}}/g;

const getAttributeGeneratorStatements = (handlebarsTemplate: string) => [...handlebarsTemplate.matchAll(getAllOpeningTagDataRegex)].flatMap((matchResult) =>
    getAttributeGeneratorStatementsFromTag(matchResult[0]).map((reference) => ({
        ...reference,
        originalStartIndex: reference.originalStartIndex + (matchResult.index as number)
    })));

const getAttributeGeneratorStatementsFromTag = (htmlOpeningTag: string):ReplacementAttributeReference[] =>
    [...htmlOpeningTag.matchAll(getAllAttributeGeneratingHelperStatementsRegex)].map((matchResult) => {
        const [ statement, innerData ] = matchResult;
        const [ helperName, ...helperArgs ] = innerData.split(' ').map((item) => item.trim());

        const statementOffsetFromMatchStart = statement.indexOf('{');
        const originalStartIndex = (matchResult.index as number) + statementOffsetFromMatchStart;
        const originalLength = statement.length - statementOffsetFromMatchStart;

        return {
            helper: null,
            attribute: `${ATTRIBUTE_GENERATOR_PLACEHOLDER}="{{${helperName} ${helperArgs.join(' ')}}}"`,
            originalStartIndex,
            originalLength
        };
    });

const replaceAttributeGeneratingHelpers = (handlebarsTemplate: string):PreparedTemplate => {
  const newAttributes = getAttributeGeneratorStatements(handlebarsTemplate);
  if (newAttributes.length === 0) {
    return { template: handlebarsTemplate, helpers: [] };
  }

  return {
    template: buildNewTemplate(handlebarsTemplate, newAttributes),
    helpers: []
  };
};

export default replaceAttributeGeneratingHelpers;
