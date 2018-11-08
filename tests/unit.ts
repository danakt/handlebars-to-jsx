import { camelizePropName, createStyleObject, parseStyleString } from '../src/styles'

const mockStyles
  // eslint-disable-next-line
  = "background-image: url('https://example.com/image.png'); margin-left: 10px;   -webit-transition: opacity 1s ease-out;"

describe('styles', () => {
  test('should convert style prop name to camel case', () => {
    expect(camelizePropName('class-name')).toBe('className')
    expect(camelizePropName('background-image')).toBe('backgroundImage')
    expect(camelizePropName('-webit-transition')).toBe('WebitTransition')
  })

  test('should create style object from style string', () => {
    expect(createStyleObject(mockStyles)).toEqual({
      backgroundImage: "url('https://example.com/image.png')",
      marginLeft:      '10px',
      WebitTransition: 'opacity 1s ease-out'
    })
  })

  test('should create ast tree of style object from style string', () => {
    expect(parseStyleString(mockStyles)).toMatchSnapshot()
  })
})
