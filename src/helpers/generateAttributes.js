const getAllAttributesFromHtmlRegex = /([\w|'|"]*\s*=\s*[\w|'|"]*)/g;

const generateAttributes = (dataString) => [...dataString.matchAll(getAllAttributesFromHtmlRegex)].reduce((aggregate, [_, match]) => {
    const [key, value] = match.replace(`'`, '').replace(`"`).split('=');
    aggregate[key] = value;
}, {});

export default generateAttributes;
