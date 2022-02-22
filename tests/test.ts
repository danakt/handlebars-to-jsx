/* eslint-disable max-len */
import { compile } from '../'
import generate    from '@babel/generator'
import { parse }   from '@babel/parser'

/**
 * Parses js-code to ast and compile again to js. Used to bring in a view that
 * is obtained when compiling ast.
 */
const recompile = (jsCode: string): string =>
  generate(parse(jsCode, { plugins: ['jsx'], sourceType: 'module' }).program).code

describe('elements', () => {
  test('should convert simple div', () => {
    expect(compile('<div></div>', false)).toBe('<div></div>;')
  })

  test('should close self-closing elements', () => {
    expect(compile('<img>', false)).toBe('<img />;')
    expect(compile('<link>', false)).toBe('<link />;')
    expect(compile('<br>', false)).toBe('<br />;')
  })

  test('should wrap multiple elements to fragment', () => {
    expect(compile('<div /><div />', false)).toBe('<React.Fragment><div /><div /></React.Fragment>;')
    expect(compile('Some text <div />', false)).toBe('<React.Fragment>Some text <div /></React.Fragment>;')
    expect(compile('<div /><span></span><div />', false)).toBe(
      '<React.Fragment><div /><span></span><div /></React.Fragment>;'
    )
  })
})

describe('element values', () => {
  test('should create literal value', () => {
    expect(compile('<div>Value</div>', false)).toBe('<div>Value</div>;')
  })

  test('should create value with expression', () => {
    expect(compile('<div>Lorem {{ipsum}} dolor sit amet</div>')).toBe(
      recompile('props => <div>Lorem {props.ipsum} dolor sit amet</div>')
    )
  })

  test('should escape curly braces in handlebars template', () => {
    expect(compile('<div>Lorem {ipsum} dolor sit {amet</div>')).toBe(
      recompile(`props => <div>Lorem {"{"}ipsum{"}"} dolor sit {"{"}amet</div>`)
    )
  })
})

describe('component support', () => {
  test('should return component', () => {
    expect(compile('<div />')).toBe('props => <div />;')
  })

  test("shouldn't return component", () => {
    expect(compile('<div />', false)).toBe('<div />;')
  })

  test('should add "props" prefix to variables in component', () => {
    expect(compile('<div>{{variable}}</div>')).toBe(recompile('props => <div>{props.variable}</div>'))
  })

  test('shouldn\'t add "props" prefix to variables if it\'s not component', () => {
    expect(compile('<div>{{variable}}</div>', false)).toBe('<div>{variable}</div>;')
  })

  test('should export component by default', () => {
    expect(compile('<div>{{variable}}</div>', { isModule: true, isComponent: true })).toBe(
      recompile('export default props => <div>{props.variable}</div>')
    )
  })
})

describe('element attributes', () => {
  test('should convert simple text attribute', () => {
    expect(compile('<div id="my-id" />', false)).toBe('<div id="my-id" />;')
  })

  test('should remove unsupported attribute', () => {
    expect(compile('<div 2+2="my-id" />', false)).toBe('<div />;')
  })

  test('should convert specific attribute name', () => {
    expect(compile('<div for="my-id" />', false)).toBe('<div htmlFor="my-id" />;')
    expect(compile('<div class="my-class" />', false)).toBe('<div className="my-class" />;')
    expect(compile('<div data-attr="my-data" />', false)).toBe('<div data-attr="my-data" />;')
    expect(compile('<svg xmlns:xlink="http://www.w3.org/1999/xlink" />', false)).toBe(
      '<svg xmlnsXlink="http://www.w3.org/1999/xlink" />;'
    )
  })

  test('should convert attribute with statement', () => {
    expect(compile('<div id={{undefined}} />', false)).toBe('<div id={undefined} />;')
    expect(compile('<div id={{true}} />', false)).toBe('<div id={true} />;')
    expect(compile('<div id={{path.to.variable}} />')).toBe(recompile('props => <div id={props.path.to.variable} />;'))
  })

  xtest('should throw error when used reserved JavaScript words', () => {
    // TODO
  })

  test('should convert attribute with concatenation statement', () => {
    expect(compile('<div id="{{123}}" />', false)).toBe('<div id={123} />;')
    expect(compile('<div id="{{null}}" />', false)).toBe('<div id={null} />;')
    expect(compile('<div id="{{variable}}" />')).toBe(recompile('props => <div id={props.variable} />;'))
    expect(compile('<div id="my {{variable}}" />')).toBe(recompile('props => <div id={"my " + props.variable} />;'))
    expect(compile('<div id="two {{variables}} {{in.one.attribute}}" />')).toBe(
      recompile('props => <div id={"two " + props.variables + " " + props.in.one.attribute} />;')
    )
    expect(compile('<a href="/posts/{{permalink}}#{{id}}">Link</a>', false)).toBe(
      '<a href={"/posts/" + permalink + "#" + id}>Link</a>;'
    )
  })

  test('should convert the "styles" string to stylesObject', () => {
    expect(compile('<div style="background-image: url(\'image.png\'); margin-left: 10px" />', false)).toEqual(`<div style={{ "backgroundImage": "url('image.png')", "marginLeft": "10px" }} />;`)
  })

  test('should convert the "styles" string with variables to stylesObject', () => {
    // Block of styles
    expect(
      compile(
        '<div style="background-image: url(\'{{some.imageSrc}}\'); margin-left: 10px; width: {{some.width}}px; margin-top: 10px; text-align: {{textAlign}}" />',
        false
      )
    ).toEqual(`<div style={{ "backgroundImage": "url('" + some.imageSrc + "')", "marginLeft": "10px", "width": some.width + "px", "marginTop": "10px", "textAlign": textAlign }} />;`)

    // Trailing semicolon
    expect(compile('<div style="background-image: url(\'{{some.imageSrc}}\');" />', false)).toEqual(`<div style={{ "backgroundImage": "url('" + some.imageSrc + "')" }} />;`)

    // Expression in key
    expect(compile('<div style="background-{{image}}: url(\'{{some.imageSrc}}\');" />', false)).toEqual(`<div style={{ ["background-" + image]: "url('" + some.imageSrc + "')" }} />;`)
  })
})

describe('comments', () => {
  test('should convert comment in JSX code', () => {
    const commentText = 'EVEN LONGER COMMENT';
    const expectedJsx = `<div>{ /* ${commentText} */ }</div>;`;

    expect(compile(`<div>{{~! ${commentText} ~}}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div>{{~!-- ${commentText} --~}}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div>{{! ${commentText} ~}}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div>{{!-- ${commentText} --~}}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div>{{~! ${commentText} }}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div>{{~!-- ${commentText} --}}</div>`, false)).toEqual(expectedJsx)
    expect(compile(`<div><!-- ${commentText} --></div>`, false)).toEqual(expectedJsx)
  })

  test("shouldn't convert top-level comment", () => {
    // Not supported currently
    // expect(compile('{{!-- comment --}}')).toBe(recompile('/* comment */'))
    expect(() => compile('{{!-- comment --}}')).toThrowError()
  })
})

describe('block statements', () => {
  describe('condition statement', () => {
    test('should convert condition if-then ', () => {
      expect(compile('<div>{{#if variable}}<div/>{{/if}}</div>')).toBe(
        recompile('props => <div>{Boolean(props.variable) && <div />}</div>;')
      )
    })

    test('should convert condition if-then-else ', () => {
      expect(compile('<div>{{#if variable}}<div/>{{else}}<span/>{{/if}}</div>')).toBe(
        recompile('props => <div>{Boolean(props.variable) ? <div /> : <span />}</div>;')
      )
    })

    test('should convert condition unless-then ', () => {
      expect(compile('<div>{{#unless variable}}<div/>{{/unless}}</div>')).toBe(
        recompile('props => <div>{!Boolean(props.variable) && <div />}</div>;')
      )
    })

    test('should convert condition unless-then-else ', () => {
      expect(compile('<div>{{#unless variable}}<div/>{{else}}<span/>{{/unless}}</div>')).toBe(
        recompile('props => <div>{!Boolean(props.variable) ? <div /> : <span />}</div>;')
      )
    })

    test('should wrap multiple block children into fragment', () => {
      expect(compile('<div>{{#if variable}}<div/><span/>{{/if}}</div>')).toBe(
        recompile('props => <div>{Boolean(props.variable) && <React.Fragment><div /><span /></React.Fragment>}</div>;')
      )
    })

    test('should convert condition statement in root', () => {
      expect(compile('{{#if variable}}<div/>{{else}}<span/>{{/if}}')).toBe(
        recompile('props => Boolean(props.variable) ? <div /> : <span />;')
      )
    })
  })

  describe('each statement', () => {
    test('each block statement', () => {
      expect(compile('<div>{{#each list}}<div id={{this.id}} />{{/each}}</div>')).toBe(
        'props => <div>{props.list.map((item, i) => <div id={item.id} key={i} />)}</div>;'
      )
    })

    test('nested each block statements', () => {
      expect(compile('<div>{{#each list}}{{#each nestedOuter.inner}}<div id={{deeplyNested}} />{{/each}}{{/each}}</div>')).toBe(
        'props => <div>{props.list.map((item, i) => <React.Fragment key={i}>{item.nestedOuter.inner.map((item, i) => <div id={item.deeplyNested} key={i} />)}</React.Fragment>)}</div>;'
      )
    })

    test('siblings each block statements with path expression - no component', () => {
      expect(
        compile(
          '<div>{{#each list}}<div att={{type}}>{{name}}</div>{{/each}}{{#each list}}<div>{{name}}</div>{{/each}}</div>',
          false
        )
      ).toBe(
        '<div>{list.map((item, i) => <div att={item.type} key={i}>{item.name}</div>)}{list.map((item, i) => <div key={i}>{item.name}</div>)}</div>;'
      )
    })

    test('siblings each block statements with path expression', () => {
      expect(
        compile(
          '<div>{{#each list}}<div att={{type}}>{{name}}</div>{{/each}}{{#each list}}<div>{{name}}</div>{{/each}}</div>',
          true
        )
      ).toBe(
        'props => <div>{props.list.map((item, i) => <div att={item.type} key={i}>{item.name}</div>)}{props.list.map((item, i) => <div key={i}>{item.name}</div>)}</div>;'
      )
    })

    test('should wrap multiple block children into fragment with keys', () => {
      expect(compile('<div>{{#each list}}<div /><span /> Text{{/each}}</div>')).toBe(
        'props => <div>{props.list.map((item, i) => <React.Fragment key={i}><div /><span /> Text</React.Fragment>)}</div>;'
      )
    })
  })
})

describe('include react import', () => {
  test('with isModule true', () => {
    expect(compile('<div></div>', { isComponent: true, isModule: true, includeImport: true })).toBe(
      'import React from "react";\nexport default (props => <div></div>);'
    )
  })

  test('with isModule false', () => {
    expect(compile('<div></div>', { isComponent: true, isModule: false, includeImport: true })).toBe(
      'props => <div></div>;'
    )
  })

  test('with isComponent false', () => {
    expect(compile('<div></div>', { isComponent: false, isModule: true, includeImport: true })).toBe(
      'import React from "react";\nexport default <div></div>;'
    )
  })
})

// TODO: support desired conversion of helper function usages -- NOTE: we can't distinguish between a function with no arguments & a regular mustache statement without additional context
describe('transformation of helper invocations', () => {
  test('should include helper invocation from node child', () => {
    const jsx = compile('<div>{{helperFunction data}}</div>', true);
    const expectedResult = 'props => <div>{helperFunction(props.data)}</div>;';
    expect(jsx).toEqual(expectedResult);
  });

  test('should include helper invocation from within each block', () => {
    const jsx = compile('<div>{{#each list}}{{helperFunction data}}{{/each}}</div>', true);
    const expectedResult = 'props => <div>{props.list.map((item, i) => <React.Fragment key={i}>{helperFunction(item.data)}</React.Fragment>)}</div>;';
    expect(jsx).toEqual(expectedResult);
  });
  
  test('should include helper invocation from attribute', () => {
    const jsx = compile('<div title={{helperFunction data}}></div>', true);
    const expectedResult = 'props => <div title={helperFunction(props.data)}></div>;';
    expect(jsx).toEqual(expectedResult);
  });

  test('should include import of helper function when includeImport is true', () => {
    const jsx = compile('<div>{{helperFunction data}}</div>', { isComponent: true, isModule: true, includeImport: true });
    const jsxLines = jsx.split('\n');
    const expectedLines = [
      'import React from "react";',
      'import helperFunction from "./helperFunction";',
      'export default (props => <div>{helperFunction(props.data)}</div>);'
    ];
    expect(jsxLines).toEqual(expectedLines);
  });

  test('should include helper with custom attribute', () => {
    const jsx = compile('<div>{{helperFunction data otherData="some text"}}</div>', true);
    const expectedResult = 'props => <div>{helperFunction(props.data, { hash: { otherData: "some text" } })}</div>;';
    expect(jsx).toEqual(expectedResult);
  });

  // NOTE: a helper function generating attributes in this manner MUST return an object with key/value pairs being the attribute names & values
  // TODO: add option to toggle the custom helper the custom helper being inline vs external (default)?
  describe('helper functions generating attributes', () => {
    const options = { isComponent: true, isModule: true, includeImport: true, includeExperimentalFeatures: true };

    [
      {
        template: '<div {{getAttributesString innerContext}}></div>',
        expectedLines: [
          'import React from "react";',
          'import generateAttributes from "./generateAttributes";',
          'import getAttributesString from "./getAttributesString";',
          'export default (props => <div {...generateAttributes(getAttributesString(props.innerContext))}></div>);'
        ]
      },
      {
        template: '<div {{getAttributesString innerContext}} class="{{#if hasClass}}some-class{{/if}}"></div>',
        expectedLines: [
          'import React from "react";',
          'import generateAttributes from "./generateAttributes";',
          'import getAttributesString from "./getAttributesString";',
          'const classIfHelper = hasClass => hasClass ? "some-class" : ""; export default (props => <div {...generateAttributes(getAttributesString(props.innerContext))} className={classIfHelper(props.hasClass)}></div>);'
        ]
      },
      {
        template: '<div title="{{title}}" {{getAttributesString innerContext}}></div>',
        expectedLines: [
          'import React from "react";',
          'import generateAttributes from "./generateAttributes";',
          'import getAttributesString from "./getAttributesString";',
          'export default (props => <div title={props.title} {...generateAttributes(getAttributesString(props.innerContext))}></div>);'
        ]
      },
      {
        template: '<div title="{{title}}" {{getAttributesString innerContext}} class="{{#if hasClass}}some-class{{/if}}"></div>',
        expectedLines: [
          'import React from "react";',
          'import generateAttributes from "./generateAttributes";',
          'import getAttributesString from "./getAttributesString";',
          'const classIfHelper = hasClass => hasClass ? "some-class" : ""; export default (props => <div title={props.title} {...generateAttributes(getAttributesString(props.innerContext))} className={classIfHelper(props.hasClass)}></div>);'
        ]
      },
      {
        template: '<div {{getAttributesString innerContext prefix="data-"}}></div>',
        expectedLines: [
          'import React from "react";',
          'import generateAttributes from "./generateAttributes";',
          'import getAttributesString from "./getAttributesString";',
          'export default (props => <div {...generateAttributes(getAttributesString(props.innerContext, { hash: { prefix: "data-" } }))}></div>);'
        ]
      }
    ].forEach(({ template, expectedLines }) => {
      test('should include custom helper to convert original helper result into a compatible form', () => {
        const jsx = compile(template, options);
        const jsxLines = jsx.split('\n');
        expect(jsxLines).toEqual(expectedLines);
      });
    });
  });
});

// NOTE: custom helpers within an opening tag are not (currently) compatible with the preprocessor that rewrites attribute generating helpers (i.e. no mixing with experimental features)...
describe('custom helper within attribute value', () => {
  const defaultOptions = { isComponent: true, isModule: false, includeImport: false, includeExperimentalFeatures: false };

  test('custom helper within class attribute, includeExperimentalFeatures false', () => {
    const jsx = compile('<div class="first-class {{someHelper hasData data}} other-class"></div>', { ...defaultOptions, includeExperimentalFeatures: false });
    const expectedJsx = 'props => <div className={"first-class " + someHelper(props.hasData, props.data) + " other-class"}></div>;';
    expect(jsx).toEqual(expectedJsx);
  });

  test('custom helper within class attribute, includeExperimentalFeatures true', () => {
    const testDelegate = () => compile('<div class="first-class {{someHelper hasData data}} other-class"></div>', { ...defaultOptions, includeExperimentalFeatures: true });
    expect(testDelegate).toThrow();
  });
});

describe('block statement in opening tag', () => {
  const defaultOptions = { isComponent: true, isModule: false, includeImport: false, includeExperimentalFeatures: true };

  describe('within attribute value', () => {
    test('unless helper within class attribute', () => {
      const jsx = compile('<div class="{{#unless CanEdit}}is-disabled{{/unless}}"></div>', defaultOptions);
      const expectedLines = [
        'const classUnlessHelper = canEdit => !canEdit ? "is-disabled" : "";',
        'props => <div className={classUnlessHelper(props.CanEdit)}></div>;'
      ];
      expect(jsx).toEqual(expectedLines.join(' '));
    });
  
    test('if helper within class attribute', () => {
      const jsx = compile('<div class="{{#if CanEdit}}is-disabled{{/if}} other-class"></div>', defaultOptions);
      const expectedLines = [
        'const classIfHelper = canEdit => canEdit ? "is-disabled other-class" : " other-class";',
        'props => <div className={classIfHelper(props.CanEdit)}></div>;'
      ];
      expect(jsx).toEqual(expectedLines.join(' '));
    });
  
    test('if helper within class attribute and custom helper in body', () => {
      const jsx = compile('<div class="{{#if canEdit}}is-disabled{{/if}}">{{someHelper hasData data}}</div>', defaultOptions);
      const expectedLines = [
        'const classIfHelper = canEdit => canEdit ? "is-disabled" : "";',
        'props => <div className={classIfHelper(props.canEdit)}>{someHelper(props.hasData, props.data)}</div>;'
      ];
      expect(jsx).toEqual(expectedLines.join(' '));
    });
  
    test('if helper within class attribute and custom helper in body, includeImport true', () => {
      const jsx = compile('<div class="{{#if canEdit}}is-disabled{{/if}}">{{someHelper hasData data}}</div>', { ...defaultOptions, isModule: true, includeImport: true });
      const jsxLines = jsx.split('\n');
      const expectedLines = [
        'import React from "react";',
        'import someHelper from "./someHelper";',
        'const classIfHelper = canEdit => canEdit ? "is-disabled" : ""; export default (props => <div className={classIfHelper(props.canEdit)}>{someHelper(props.hasData, props.data)}</div>);'
      ];
      expect(jsxLines).toEqual(expectedLines);
    });
  });

  describe('as conditional attribute', () => {
    test('around single attribute', () => {
      const jsx = compile('<div{{#if hasTooltip}} title="{{tooltip}}"{{/if}}></div>', defaultOptions);
      const expectedLines = [
        'const titleIfHelper = (hasTooltip, tooltip) => hasTooltip ? tooltip : undefined;',
        'props => <div title={titleIfHelper(props.hasTooltip, props.tooltip)}></div>;'
      ];
      expect(jsx).toEqual(expectedLines.join(' '));
    });
  });
});

describe('context references within partial template', () => {
  [true, false].forEach((alwaysIncludeContext) => {
    test('direct context reference, context is contained within props', () => {
      const jsx = compile('{{#if .}}<div>{{#each .}}<span>{{Name}}</span>{{/each}}</div>{{/if}}', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext });
      const expectedResult = 'props => Boolean(props.context) && <div>{props.context.map((item, i) => <span key={i}>{item.Name}</span>)}</div>;';
      expect(jsx).toEqual(expectedResult);
    });
  });

  describe('indirect context reference', () => {
    test('with alwaysIncludeContext false, leaves props as the context', () => {
      const jsx = compile('{{#if Items}}<div>{{#each Items}}<span>{{Name}}</span>{{/each}}</div>{{/if}}', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: false });
      const expectedResult = 'props => Boolean(props.Items) && <div>{props.Items.map((item, i) => <span key={i}>{item.Name}</span>)}</div>;';
      expect(jsx).toEqual(expectedResult);
    });
  
    test('with alwaysIncludeContext true, context is contained within props', () => {
      const jsx = compile('{{#if Items}}<div>{{#each Items}}<span>{{Name}}</span>{{/each}}</div>{{/if}}', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: true });
      const expectedResult = 'props => Boolean(props.context.Items) && <div>{props.context.Items.map((item, i) => <span key={i}>{item.Name}</span>)}</div>;';
      expect(jsx).toEqual(expectedResult);
    });
  })
});

describe('with handlebars partial statement', () => {
  test('with isModule false', () => {
    const jsx = compile('<div><div>{{title}}</div>{{#if inEstate.any}}{{>SomePartial inEstate.assets}}{{/if}}</div>', { isComponent: true, isModule: false, includeImport: true });
    const expectedResult = 'props => <div><div>{props.title}</div>{Boolean(props.inEstate.any) && <SomePartial {...props.inEstate.assets} />}</div>;';
    expect(jsx).toEqual(expectedResult);
  });

  describe('with includeImport, isComponent, and isModule true', () => {
    test('with single partial', () => {
      const jsx = compile('<div><div>{{title}}</div>{{#if inEstate.any}}{{>SomePartial inEstate.assets}}{{/if}}</div>', { isComponent: true, isModule: true, includeImport: true });
      const expectedResult = 'import React from "react";\nimport SomePartial from "./SomePartial";\nexport default (props => <div><div>{props.title}</div>{Boolean(props.inEstate.any) && <SomePartial {...props.inEstate.assets} />}</div>);';
      expect(jsx).toEqual(expectedResult);
    });

    test('with multiple of the same partial', () => {
      const jsx = compile('<div>{{>Partial assets}}{{>Partial assets}}</div>', { isComponent: true, isModule: true, includeImport: true });
      const expectedResult = 'import React from "react";\nimport Partial from "./Partial";\nexport default (props => <div><Partial {...props.assets} /><Partial {...props.assets} /></div>);';
      expect(jsx).toEqual(expectedResult);
    });

    test('with multiple of the same partial, different props reference', () => {
      const jsx = compile('<div>{{>Partial assets}}{{>Partial liabilites}}</div>', { isComponent: true, isModule: true, includeImport: true });
      const expectedResult = 'import React from "react";\nimport Partial from "./Partial";\nexport default (props => <div><Partial {...props.assets} /><Partial {...props.liabilites} /></div>);';
      expect(jsx).toEqual(expectedResult);
    });

    test('with multiple differing partials', () => {
      const jsx = compile('<div>{{>FirstPartial assets}}{{>SecondPartial liabilites}}</div>', { isComponent: true, isModule: true, includeImport: true });
      const expectedResult = 'import React from "react";\nimport FirstPartial from "./FirstPartial";\nimport SecondPartial from "./SecondPartial";\nexport default (props => <div><FirstPartial {...props.assets} /><SecondPartial {...props.liabilites} /></div>);';
      expect(jsx).toEqual(expectedResult);
    });
  });

  test('alwaysIncludeContext false, should spread context as props', () => {
    const jsx = compile('<div>{{firstname}} {{lastname}}{{>SomePartial innerContext}}</div>', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: false });
    const expectedResult = 'props => <div>{props.firstname} {props.lastname}<SomePartial {...props.innerContext} /></div>;';
    expect(jsx).toEqual(expectedResult);
  })

  test('alwaysIncludeContext true, should include single context property', () => {
    const jsx = compile('<div>{{firstname}} {{lastname}}{{>SomePartial innerContext}}</div>', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: true });
    const expectedResult = 'props => <div>{props.context.firstname} {props.context.lastname}<SomePartial context={props.context.innerContext} /></div>;';
    expect(jsx).toEqual(expectedResult);
  })

  describe('custom attribute on partial statement', () => {
    test('alwaysIncludeContext false, should specify props individually', () => {
      const jsx = compile('<div>{{firstname}} {{lastname}}{{>SomePartial innerContext otherData=firstname}}</div>', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: false });
      const expectedResult = 'props => <div>{props.firstname} {props.lastname}<SomePartial {...props.innerContext} otherData={props.firstname} /></div>;';
      expect(jsx).toEqual(expectedResult);
    })
  
    test('alwaysIncludeContext true, should include custom attributes in context property', () => {
      const jsx = compile('<div>{{firstname}} {{lastname}}{{>SomePartial innerContext otherData=firstname}}</div>', { isComponent: true, isModule: false, includeImport: true, alwaysIncludeContext: true });
      const expectedResult = 'props => <div>{props.context.firstname} {props.context.lastname}<SomePartial context={{ ...props.context.innerContext, otherData: props.context.firstname }} /></div>;';
      expect(jsx).toEqual(expectedResult);
    })
  })
});
