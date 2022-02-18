/*
* To be included alongside any JSX generated from a Handlebars template that conditionally renders attributes from it's own helper function
* e.g. '<div {{getAttributesString innerContext}}></div>' becomes 'props => <div {...generateAttributes(getAttributesString(props.innerContext))}></div>'
*/

const getAllAttributesFromHtmlRegex = /([\w|'|"]*\s*=\s*[\w|'|"]*)/g;

const generateAttributes = (dataString) => [...dataString.matchAll(getAllAttributesFromHtmlRegex)].reduce((aggregate, [_, match]) => {
    const [key, value] = match.replace(`'`, '').replace(`"`).split('=');
    aggregate[key] = value;
}, {});

export default generateAttributes;
