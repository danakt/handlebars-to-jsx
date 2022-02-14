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
        const { template: templateResult, helpers: helpersResult } = preProcessUnsupportedParserFeatures(template);
        expect(templateResult).toEqual(template);
        expect(helpersResult.length).toEqual(0);
      });
    });
  });

  describe('when block statement exists in attributes', () => {
    [
      {
        template:'<div id={{#if isTrue}}id{{/if}}><div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"><div>',
        expectedHelpers: [`const idIfHelper = (isTrue) => isTrue ? 'id' : '';`]
      },
      {
        template: '<div id="{{#if isTrue}}id{{/if}}"><div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"><div>',
        expectedHelpers: [`const idIfHelper = (isTrue) => isTrue ? 'id' : '';`]
      },
      {
        template: '<div id = "{{#if isTrue}}id{{/if}}"><div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"><div>',
        expectedHelpers: [`const idIfHelper = (isTrue) => isTrue ? 'id' : '';`]
      },
      {
        template: '<div class="{{#if isTrue}}is-true{{/if}} other-class"><div>',
        expectedTemplate: '<div class="{{classIfHelper isTrue}}"><div>',
        expectedHelpers: ["const classIfHelper = (isTrue) => isTrue ? 'is-true other-class' : ' other-class';"]
      },
      {
        template: '<div id="{{#if isTrue}}{{id}}{{/if}}"><div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue id}}"><div>',
        expectedHelpers: ["const idIfHelper = (isTrue, id) => isTrue ? `${id}` : '';"]
      },
      {
        template: '<div class="{{#unless isTrue}}{{class}}{{/unless}} other-class"><div>',
        expectedTemplate: '<div class="{{classUnlessHelper isTrue class}}"><div>',
        expectedHelpers: ["const classUnlessHelper = (isTrue, class) => !isTrue ? `${class} other-class` : ' other-class';"]
      },
      {
        template: '<div id="{{#if isTrue}}{{id}}{{/if}}" title={{#unless isTrue}}title{{/if}}><div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue id}}" title="{{titleUnlessHelper isTrue}}"><div>',
        expectedHelpers: [
          "const idIfHelper = (isTrue, id) => isTrue ? `${id}` : '';",
          "const titleUnlessHelper = (isTrue) => !isTrue ? 'title' : '';"
        ]
      }
    ].forEach(({ template, expectedTemplate, expectedHelpers }) => {
      test('should return template with helper functions', () => {
        const { template: templateResult, helpers: helpersResult } = preProcessUnsupportedParserFeatures(template);
        expect(templateResult).toEqual(expectedTemplate);
        expect(helpersResult).toEqual(expectedHelpers);
      });
    });
  });
});
