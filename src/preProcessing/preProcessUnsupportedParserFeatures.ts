import * as Babel from '@babel/types';
import { PreparedTemplate } from './preProcessingTypes';
import { replaceBlockStatementsWithinAttributes, replaceBlockStatementsAroundAttributes } from './blockStatementsWithinNodeTag';
import replaceAttributeGeneratingHelpers from './replaceAttributeGeneratingHelpers';

const preProcessSteps = [
  replaceBlockStatementsWithinAttributes,
  replaceBlockStatementsAroundAttributes,
  replaceAttributeGeneratingHelpers, // NOTE: this preprocessor has a dependency on having already converted attributes that contain helpers within or around their value
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
