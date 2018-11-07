# Handlebars to JSX

Converts Handlebars to JSX-component. Uses [Glimmer VM](https://github.com/glimmerjs/glimmer-vm/) to parse Handlebars code to AST and [Babel](https://github.com/babel/babel/) to create JSX AST and generate code.

## Installation

```bash
# via NPM
npm install handlebars-to-jsx

# or Yarn
yarn add handlebars-to-jsx
```

## Usage

The package has only one method `compile`. You can import it by following way:

```js
import { compile } from 'handlebars-to-jsx'
```

The method has following syntax:

```
compile(input[, options])
```

- `input`  
  The Handlebars template which should be converted to JSX code.
- `options` _Optional_  
  Options is an optional argument and can has the following properties:
  - `isComponent` _Optional_  
    The default is `true`. Should return JSX code wrapped to a function component.
  - `isModule` _Optional_  
    The default is `false`. Should return generated code exported by default.
    <!-- Should be compiled as  -->

Use it for simple converting Handlebars template to JSX code:

```js
compile('<div>{{variable}}</div>')

// Result code
// props => <div>{props.variable}</div>
```

By default the `compile` function returns function component. You can convert Handlebars template to JSX without wrapping to arrow function. In this variant, `props` is not added to the path of variables.

```js
compile('<div>{{variable}}</div>', { isComponent: false })

// Result
// <div>{variable}</div>
```

Also, you can get exported by default component:

```js
compile('<div>{{variable}}</div>', { isModule: true })

// Result
// export default props => <div>{props.variable}</div>
```

## Code formatting

The output code creates from AST tree, so it's unformatted by default. You can use tools like [Prettier](https://prettier.io/docs/en/api.html) to format code:

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

## License

MIT licensed
