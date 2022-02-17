import * as Babel from '@babel/types';
import { PreparedTemplate } from './preProcessingTypes';
import { replaceBlockStatementsWithinAttributes, replaceBlockStatementsAroundAttributes } from './blockStatementsWithinNodeTag';

const preProcessSteps = [
  replaceBlockStatementsWithinAttributes,
  replaceBlockStatementsAroundAttributes
];

const preProcessUnsupportedParserFeatures = (handlebarsTemplate: string):PreparedTemplate => {
  let template = handlebarsTemplate;
  let helpers: Babel.VariableDeclaration[] = [];
  preProcessSteps.forEach((preProcess) => {
    const { template: nextTemplate, helpers: nextHelpers } = preProcess(template);
    template = nextTemplate;
    helpers = [...helpers, ...nextHelpers];
  });

  return { template, helpers };
};

export default preProcessUnsupportedParserFeatures;
