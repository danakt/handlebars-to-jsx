import { camelizePropName } from '../src/styles'
import { preProcessUnsupportedParserFeatures } from '../src/unsupportedParserFeatures';

const mockStyles
  // eslint-disable-next-line
  = "background-image: url('https://example.com/image.png'); margin-left: 10px;   -webit-transition: opacity 1s ease-out;"

describe('styles', () => {
  test('should convert style prop name to camel case', () => {
    expect(camelizePropName('class-name')).toBe('className')
    expect(camelizePropName('background-image')).toBe('backgroundImage')
    expect(camelizePropName('-webit-transition')).toBe('WebitTransition')
  })
})

describe('preProcessUnsupportedParserFeatures', () => {
  describe('when no block statement exists in attributes', () => {
    [
      '<div><div>',
      '<div>{{name}}<div>',
      '<div>{{#if isTrue}}text{{/if}}<div>',
      '<div>{{#if isTrue}}{{name}}{{/if}}<div>',
      '<div id={{id}}><div>',
      '<div id="{{id}}"><div>'
    ].forEach((template) => {
      test('should return template unchanged', () => {
        const result = preProcessUnsupportedParserFeatures(template);
        expect(result).toEqual(template);
      });
    });
  });
});
