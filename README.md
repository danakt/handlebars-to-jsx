# Handlebars to JSX [![NPM](https://img.shields.io/npm/v/handlebars-to-jsx.svg?style=flat-square)](https://www.npmjs.com/package/handlebars-to-jsx) [![Build Status](https://img.shields.io/travis/danakt/handlebars-to-jsx.svg?style=flat-square)](https://travis-ci.org/danakt/handlebars-to-jsx)

Converts Handlebars template to JSX-component. Uses [Glimmer VM](https://github.com/glimmerjs/glimmer-vm/) to parse Handlebars code to AST and [Babel](https://github.com/babel/babel/) to create JSX AST and generate code.

## Installation

```bash
# via NPM
npm install handlebars-to-jsx

# or Yarn
yarn add handlebars-to-jsx
```

## Usage

The package only has one method `compile`. You can import it the following way:

```js
import { compile } from 'handlebars-to-jsx'
```

The method has the following syntax:

```
compile(input[, options])
```

- `input`  
  The Handlebars template which should be converted to JSX code.
- `options` _Optional_  
  Options is optional and can have the following properties:
  - `isComponent` _Optional_  
    The default is `true`. Should return JSX code wrapped as a function component.
  - `isModule` _Optional_  
    The default is `false`. Should return generated code exported as default.
  - `includeImport` _Optional_  
    The default is `false`. Should return generated code with React import at the top. Requires `isModule` to be true.

Use it for simply converting Handlebars template to JSX code:

```js
compile('<div>{{variable}}</div>')

// Result code
// props => <div>{props.variable}</div>
```

By default the `compile` function returns a function component. You can convert Handlebars templates to JSX without wrapping them as arrow functions. In this variant, `props` is not added to the path of variables.

```js
compile('<div>{{variable}}</div>', { isComponent: false })

// Result
// <div>{variable}</div>
```

Also, you can have the component exported as default:

```js
compile('<div>{{variable}}</div>', { isModule: true })

// Result
// export default props => <div>{props.variable}</div>
```

Also, react can be imported:

```js
compile('<div>{{variable}}</div>', { includeInport: true, isModule: true })

// Result
// import React from "react";
// export default props => <div>{props.variable}</div>
```

## Code formatting

The output code is created from an AST tree, so it's unformatted by default. You can use tools like [Prettier](https://prettier.io/docs/en/api.html) to format the code:

```js
import { compile } from 'handlebars-to-jsx'
import prettier from 'prettier'

// The Handlebars input
const hbsCode = '<div>{{#each list}}<span>{{item}}</span>{{/each}}</div>'

const jsxCode = compile(hbsCode, { isComponent: false })
// <div>{list.map((item, i) => <span key={i}>{item.item}</span>)}</div>;

prettier.format(jsxCode, { parser: 'babylon' })
// <div>
//   {list.map((item, i) => (
//     <span key={i}>{item.item}</span>
//   ))}
// </div>;
```

## Transpilation

If you want to have code lower than ES6, or you want to have the React source JS code without JSX, you can use [babel](https://github.com/babel/babel):

```js
import { compile } from 'handlebars-to-jsx'
import babel from '@babel/core'
import pluginTransformReactJSX from '@babel/plugin-transform-react-jsx'

// The Handlebars input
const hbsCode = '<div>{{variable}}</div>'

const jsxCode = compile(hbsCode, { isComponent: false })
// <div>{variable}</div>;

const { code } = babel.transform(jsxCode, {
  plugins: [pluginTransformReactJSX]
})
// React.createElement("div", null, variable);
```

## License

MIT licensed
