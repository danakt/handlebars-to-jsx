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

Use it for simple converting a Handlebars code to JSX:

```js
compile('<div>{{variable}}</div>')

// Result code
// props => <div>{props.variable}</div>
```

By default the `compile` function returns function components. You can convert Handlebars template to JSX without wrapping to arrow function. In this variant, `props` is not added to the path of variables.

```js
compile('<div>{{variable}}</div>', { isComponent: false })

// Result
<div>{variable}</div>
```

Also, you can get exported by default component:

```js
compile('<div>{{variable}}</div>', { isModule: true })

// Result
export default props => <div>{props.variable}</div>
```
