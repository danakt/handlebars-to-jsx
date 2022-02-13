const lineBreaksRegex = /(\r\n|\n|\r)/;
const importLineRegex = /import.*/;

const removeLineBreaks = (text: string):string => {
    const outputLines = [];
    let buffer = ''; // NOTE: just assume the buffer is the final (output) line, post-imports
    text.split(lineBreaksRegex).forEach((line) => {
        const trimmedLine = line.trimStart();
        if (trimmedLine.match(importLineRegex)) {
            outputLines.push(trimmedLine);
        }
        else if (trimmedLine !== '') {
            buffer = buffer.concat(` ${trimmedLine}`);
        }
    });
    outputLines.push(buffer.trimStart());

    return outputLines.join('\n');
};

// TODO: fix this hack
// Instead of forcing formatting here, fix whatever is causing certain expressions to print with pre- or post- line breaks
// A quick search through forked-glimmer-vm (aka glimmer-engine) didn't show anything apparent in the generator/printer
export const print = (text: string): string => removeLineBreaks(text);
