import { camelizePropName } from '../src/styles'
import { preProcessUnsupportedParserFeatures } from '../src/unsupportedParserFeatures';

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
      '<div id="{{id}}"><div>',
      '<div id="{{id}}" data="{{data}}"><div>'
    ].forEach((template) => {
      test('should return template unchanged', () => {
        const result = preProcessUnsupportedParserFeatures(template);
        expect(result).toEqual(template);
      });
    });
  });

  describe('when block statement exists in attributes', () => {
    [
      {
        template:'<div id={{#if isTrue}}id{{/if}}><div>',
        expectedTemplate: '<div id={{idIfHelper isTrue}}><div>',
        expectedHelpers: [`const idIfHelper = (isTrue) => isTrue ? 'id' : '';`]
      },
      // {
      //   template: '<div id="{{#if isTrue}}id{{/if}}"><div>',
      //   expectedTemplate: '<div id={{idIfHelper isTrue}}><div>',
      //   expectedHelpers: [`const idIfHelper = (isTrue) => isTrue ? 'id' : '';`]
      // },
      // {
      //   template: '<div class="{{#if isTrue}}is-true{{/if}} other-class"><div>',
      //   expectedTemplate: '<div class={{classIfHelper isTrue}}><div>',
      //   expectedHelpers: ["const classIfHelper = (isTrue) => { const leading = ''; const trailing = ' other-class'; return isTrue ? `${leading}id${trailing}` : `${leading}${trailing};"]
      // },
      // {
      //   template: '<div id="{{#if isTrue}}{{id}}{{/if}}"><div>',
      //   expectedTemplate: '<div id={{idIfHelper isTrue id}}><div>',
      //   expectedHelpers: ["const idIfHelper = (isTrue, id) => isTrue ? `${id}` : '';"]
      // },
      // {
      //   template: '<div id="{{#if isTrue}}{{id}}{{/if}}" title={{#unless isTrue}}title{{/if}}><div>',
      //   expectedTemplate: '<div id={{idIfHelper isTrue id}} title={{titleUnlessHelper isTrue}}><div>',
      //   expectedHelpers: [
      //     "const idIfHelper = (isTrue, id) => isTrue ? `${id}` : '';",
      //     "const titleUnlessHelper = (isTrue) => isTrue ? 'title' : '';"
      //   ]
      // }
    ].forEach(({ template, expectedTemplate, expectedHelpers }) => {
      test('should return template with helper functions', () => {
        const result = preProcessUnsupportedParserFeatures(template);
        expect(result).toEqual(expectedTemplate);
        // expect(result).toEqual(expectedHelpers);
      });
    });
  });
});
