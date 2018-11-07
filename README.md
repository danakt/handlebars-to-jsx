# Handlebars to JSX

Converts Handlebars to JSX-component. Uses [Glimmer VM](https://github.com/glimmerjs/glimmer-vm/) to parse Handlebars code to AST and [Babel](https://github.com/babel/babel/) to create JSX AST and generate code.

## Install

```bash
# via NPM
npm install handlebars-to-jsx

# or Yarn
yarn add handlebars-to-jsx
```

## Usage

```js
import { compile } from 'handlebars-to-jsx';

const hbsCode = '<div>{{variable}}</div>';

const jsxCode = compile(hbsCode, { isComponent: true, isModule: true });
// export default props => <div>{props.variable}</div>
```

## Conversion example

Source code

```hbs
<h1>Comments</h1>

<div id="comments">
  {{#each comments}}
    <h2>
      <a href="/posts/{{permalink}}#{{id}}">{{title}}</a>
    </h2>

    <div>{{body}}</div>
  {{/each}}
</div>
```

Result code (prettified)

```jsx
<React.Fragment>
  <h1>Comments</h1>

  <div id="comments">
    {props.comments.map((item, i) => (
      <React.Fragment key={i}>
        <h2>
          <a href={'/posts/' + item.permalink + '#' + item.id}>{item.title}</a>
        </h2>

        <div>{item.body}</div>
      </React.Fragment>
    ))}
  </div>
</React.Fragment>
```
