/* eslint-disable max-len */
import { compile } from '../'
// import { compile } from '../src'
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
    expect(compile('<div style="background-image: url(\'image.png\'); margin-left: 10px" />', false)).toBe(
      recompile('<div style={{ "backgroundImage": "url(\'image.png\')", "marginLeft": "10px" }} />')
    )
  })
})

describe('comments', () => {
  test('should convert comment in JSX code', () => {
    expect(compile('<div>{{~! comment ~}}</div>', false)).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{~!-- long-comment --~}}</div>', false)).toBe(recompile('<div>{/* long-comment */}</div>;'))
    expect(compile('<div>{{! comment ~}}</div>', false)).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{!-- long-comment --~}}</div>', false)).toBe(recompile('<div>{/* long-comment */}</div>;'))
    expect(compile('<div>{{~! comment }}</div>', false)).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{~!-- long-comment --}}</div>', false)).toBe(recompile('<div>{/* long-comment */}</div>;'))
    expect(compile('<div><!-- html comment --></div>', false)).toBe(recompile('<div>{/* html comment */}</div>;'))
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
      expect(compile('<div>{{#each list}}{{#each list.nested}}<div />{{/each}}{{/each}}</div>')).toBe(
        'props => <div>{props.list.map((item, i) => <React.Fragment key={i}>{item.list.nested.map((item, i) => <div key={i} />)}</React.Fragment>)}</div>;'
      )
    })

    test('siblings each block statements with path expression - no component', () => {
      expect(
        compile(
          '<div>{{#each list}}<div>{{name}}</div>{{/each}}{{#each list}}<div>{{name}}</div>{{/each}}</div>',
          false
        )
      ).toBe(
        '<div>{list.map((item, i) => <div key={i}>{item.name}</div>)}{list.map((item, i) => <div key={i}>{item.name}</div>)}</div>;'
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
