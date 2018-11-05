import { compile } from '../src'
import generate    from '@babel/generator'
import { parse }   from '@babel/parser'

/** Parses js-code to ast and compile again to js */
const recompile = (jsCode: string) => generate(parse(jsCode, { plugins: ['jsx'] }).program).code

describe('elements', () => {
  test('should convert simple div', () => {
    expect(compile('<div></div>')).toBe('<div></div>;')
  })

  test('should close self-closing elements', () => {
    expect(compile('<img>')).toBe('<img />;')
    expect(compile('<link>')).toBe('<link />;')
    expect(compile('<br>')).toBe('<br />;')
  })

  test('should wrap multiple elements to fragment', () => {
    expect(compile('<div /><div />')).toBe('<><div /><div /></>;')
    expect(compile('<div /><span></span><div />')).toBe('<><div /><span></span><div /></>;')
  })
})

describe('element values', () => {
  test('should create literal value', () => {
    expect(compile('<div>Value</div>')).toBe('<div>Value</div>;')
  })

  test('should create value with expression', () => {
    expect(compile('<div>Lorem {{ipsum}} dolor sit amet</div>')).toBe('<div>Lorem {ipsum} dolor sit amet</div>;')
  })
})

describe('element attributes', () => {
  test('should convert simple text attribute', () => {
    expect(compile('<div id="my-id" />')).toBe('<div id="my-id" />;')
  })

  test('should remove unsupported attribute', () => {
    expect(compile('<div 2+2="my-id" />')).toBe('<div />;')
  })

  test('should convert react attribute name', () => {
    expect(compile('<div for="my-id" />')).toBe('<div htmlFor="my-id" />;')
    expect(compile('<div class="my-class" />')).toBe('<div className="my-class" />;')
    expect(compile('<div data-attr="my-data" />')).toBe('<div data-attr="my-data" />;')
  })

  test('should convert attribute with statement', () => {
    expect(compile('<div id={{undefined}} />')).toBe('<div id={undefined} />;')
    expect(compile('<div id={{true}} />')).toBe('<div id={true} />;')
    expect(compile('<div id={{path.to.variable}} />')).toBe('<div id={path.to.variable} />;')
  })

  test('should convert attribute with concatenation statement', () => {
    expect(compile('<div id="{{123}}" />')).toBe('<div id={123} />;')
    expect(compile('<div id="{{null}}" />')).toBe('<div id={null} />;')
    expect(compile('<div id="{{variable}}" />')).toBe('<div id={variable} />;')
    expect(compile('<div id="my {{variable}}" />')).toBe('<div id={"my " + variable} />;')
    expect(compile('<div id="two {{variables}} {{in.one.attribute}}" />')).toBe(
      '<div id={"two " + variables + " " + in.one.attribute} />;'
    )
  })
})

describe('comments', () => {
  test('should convert comment in JSX code', () => {
    expect(compile('<div>{{~! comment ~}}</div>')).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{~!-- long-comment --~}}</div>')).toBe(recompile('<div>{/* long-comment */}</div>;'))
    expect(compile('<div>{{! comment ~}}</div>')).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{!-- long-comment --~}}</div>')).toBe(recompile('<div>{/* long-comment */}</div>;'))
    expect(compile('<div>{{~! comment }}</div>')).toBe(recompile('<div>{/* comment */}</div>;'))
    expect(compile('<div>{{~!-- long-comment --}}</div>')).toBe(recompile('<div>{/* long-comment */}</div>;'))
  })

  test("shouldn't convert top-level comment", () => {
    // Not supported currently
    // expect(compile('{{!-- comment --}}')).toBe(recompile('/* comment */'))
    expect(() => compile('{{!-- comment --}}')).toThrowError()
  })
})

describe('block statements', () => {
  test('should convert condition if-then ', () => {
    expect(compile('<div>{{#if variable}}<div/>{{/if}}</div>')).toBe('<div>{Boolean(variable) && <div />}</div>;')
  })

  test('should convert condition if-then-else ', () => {
    expect(compile('<div>{{#if variable}}<div/>{{else}}<span/>{{/if}}</div>')).toBe(
      '<div>{Boolean(variable) ? <div /> : <span />}</div>;'
    )
  })

  test('should wrap multiple block children into fragment', () => {
    expect(compile('<div>{{#if variable}}<div/><span/>{{/if}}</div>')).toBe(
      '<div>{Boolean(variable) && <><div /><span /></>}</div>;'
    )
  })

  test('should convert condition statement in root', () => {
    expect(compile('{{#if variable}}<div/>{{else}}<span/>{{/if}}')).toBe('Boolean(variable) ? <div /> : <span />;')
  })

  // test('each bock statement', () => {
  //   expect(compile('<div>{{#each list}}<div id={{this.id}} />{{/each}}</div>')).toBe(
  //     '<div>{list.map(item => <div id={item.id} />)</div>;'
  //   )
  // })
})
