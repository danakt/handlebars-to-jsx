import { ReplacementAttributeReference } from './preProcessingTypes';

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

export default buildNewTemplate;
