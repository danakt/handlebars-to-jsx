import { program } from '@babel/types'
import generate from '@babel/generator';
import { ATTRIBUTE_GENERATOR_HELPER_FUNCTION } from '../src/constants';
import { camelizePropName } from '../src/styles'
import preProcessUnsupportedParserFeatures from '../src/preProcessing/preProcessUnsupportedParserFeatures';

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
        template:'<div id={{#if isTrue}}id{{/if}}></div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"></div>',
        expectedHelpers: [`const idIfHelper = isTrue => isTrue ? "id" : "";`]
      },
      {
        template: '<div id="{{#if isTrue}}id{{/if}}"></div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"></div>',
        expectedHelpers: ['const idIfHelper = isTrue => isTrue ? "id" : "";']
      },
      {
        template: '<div id = "{{#if isTrue}}id{{/if}}"></div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue}}"></div>',
        expectedHelpers: ['const idIfHelper = isTrue => isTrue ? "id" : "";']
      },
      {
        template: '<div class="{{#if isTrue}}is-true{{/if}} other-class"></div>',
        expectedTemplate: '<div class="{{classIfHelper isTrue}}"></div>',
        expectedHelpers: ['const classIfHelper = isTrue => isTrue ? "is-true other-class" : " other-class";']
      },
      {
        template: '<div class="first-class {{#if isTrue}}is-true{{/if}} other-class"></div>',
        expectedTemplate: '<div class="{{classIfHelper isTrue}}"></div>',
        expectedHelpers: ['const classIfHelper = isTrue => isTrue ? "first-class is-true other-class" : "first-class  other-class";']
      },
      {
        template: '<div id="{{#if isTrue}}{{id}}{{/if}}"></div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue id}}"></div>',
        expectedHelpers: ['const idIfHelper = (isTrue, id) => isTrue ? id : "";']
      },
      {
        template: '<div class="{{#unless isTrue}}{{classText}}{{/unless}} other-class"></div>',
        expectedTemplate: '<div class="{{classUnlessHelper isTrue classText}}"></div>',
        expectedHelpers: ['const classUnlessHelper = (isTrue, classText) => !isTrue ? classText + " other-class" : " other-class";']
      },
      {
        template: '<div class="first-class {{#unless isTrue}}{{classText}}{{/unless}} other-class"></div>',
        expectedTemplate: '<div class="{{classUnlessHelper isTrue classText}}"></div>',
        expectedHelpers: ['const classUnlessHelper = (isTrue, classText) => !isTrue ? "first-class " + classText + " other-class" : "first-class  other-class";']
      },
      {
        template: '<div id="{{#if isTrue}}{{id}}{{/if}}" title={{#unless isTrue}}title{{/if}}></div>',
        expectedTemplate: '<div id="{{idIfHelper isTrue id}}" title="{{titleUnlessHelper isTrue}}"></div>',
        expectedHelpers: [
          'const idIfHelper = (isTrue, id) => isTrue ? id : "";',
          'const titleUnlessHelper = isTrue => !isTrue ? "title" : "";'
        ]
      },
      {
        template:'<div>{{#each list}}<div id={{#if isTrue}}id{{/if}}></div>{{/each}}</div>',
        expectedTemplate: '<div>{{#each list}}<div id="{{idIfHelper isTrue}}"></div>{{/each}}</div>',
        expectedHelpers: [`const idIfHelper = isTrue => isTrue ? "id" : "";`]
      }
    ].forEach(({ template, expectedTemplate, expectedHelpers }) => {
      test('should return template with helper functions', () => {
        const { template: templateResult, helpers: helpersResult } = preProcessUnsupportedParserFeatures(template);
        const renderedHelpers = generate(program(helpersResult)).code.split('\n').filter((result) => result);

        expect(templateResult).toEqual(expectedTemplate);
        expect(renderedHelpers).toEqual(expectedHelpers);
      });
    });
  });

  describe('when block statement exists as conditional attribute', () => {
    [
      {
        template:'<div{{#if hasTooltip}} title="{{tooltip}}"{{/if}}></div>',
        expectedTemplate: '<div title="{{titleIfHelper hasTooltip tooltip}}"></div>',
        expectedHelpers: [`const titleIfHelper = (hasTooltip, tooltip) => hasTooltip ? tooltip : undefined;`]
      },
      // { // TODO: support multiple conditional attributes within the same block?
      //   template:'<div{{#if hasTooltip}} title="{{tooltip}}" class="some-class"{{/if}}></div>',
      //   expectedTemplate: '<div title="{{titleIfHelper hasTooltip tooltip}}" class="{{classIfHelper hasTooltip}}"></div>',
      //   expectedHelpers: [
      //     `const titleIfHelper = (hasTooltip, tooltip) => hasTooltip ? tooltip : undefined;`,
      //     `const classIfHelper = hasTooltip => hasTooltip ? 'some-class' : undefined;`
      //   ]
      // }
    ].forEach(({ template, expectedTemplate, expectedHelpers }) => {
      test('should return template with conditional helper functions', () => {
        const { template: templateResult, helpers: helpersResult } = preProcessUnsupportedParserFeatures(template);
        const renderedHelpers = generate(program(helpersResult)).code.split('\n').filter((result) => result);

        expect(templateResult).toEqual(expectedTemplate);
        expect(renderedHelpers).toEqual(expectedHelpers);
      });
    });
  });

  describe('when helper exists as attribute generator', () => {
    [
      {
        template:'<div {{getDataAttributesString data}}></div>',
        expectedTemplate: `<div ${ATTRIBUTE_GENERATOR_HELPER_FUNCTION}="{{getDataAttributesString data}}"></div>`,
        expectedHelpers: []
      },
      // { // TODO: support multiple attribute generator helpers within the same opening tag?
      //   template:'<div {{get data}} {{getMore stuff}}></div>',
      //   expectedTemplate: '',
      //   expectedHelpers: []
      // }
    ].forEach(({ template, expectedTemplate, expectedHelpers }) => {
      test('should rewrite as custom attribute', () => { // NOTE: this attribute will be further converted later
        const { template: templateResult, helpers: helpersResult } = preProcessUnsupportedParserFeatures(template);
        const renderedHelpers = generate(program(helpersResult)).code.split('\n').filter((result) => result);

        expect(templateResult).toEqual(expectedTemplate);
        expect(renderedHelpers).toEqual(expectedHelpers);
      });
    });
  });
});
