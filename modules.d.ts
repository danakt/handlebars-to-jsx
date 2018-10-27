declare module 'unified'
declare module 'rehype-parse'

declare module 'is-self-closing' {
  type SelfClosingElement
    = | 'circle'
    | 'ellipse'
    | 'line'
    | 'path'
    | 'polygon'
    | 'polyline'
    | 'rect'
    | 'stop'
    | 'use'
    | 'area'
    | 'base'
    | 'br'
    | 'col'
    | 'command'
    | 'embed'
    | 'hr'
    | 'img'
    | 'input'
    | 'keygen'
    | 'link'
    | 'meta'
    | 'param'
    | 'source'
    | 'track'
    | 'wbr'

  function isSelfClosing(tagName: string): boolean
  function isSelfClosing(tagName: SelfClosingElement): true

  namespace isSelfClosing {

  }

  export = isSelfClosing
}
