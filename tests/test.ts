import { compile } from '../src'

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

describe('attributes', () => {
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
