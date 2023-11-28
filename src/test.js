const fs = require('fs');
const { diffCss } = require('diff');
const { css_beautify } = require('js-beautify');

let old_file = fs.readFileSync('old.app.css', 'utf-8');
let new_file = fs.readFileSync('new.app.css', 'utf-8');

old_file = css_beautify(old_file, { indent_size: 2 });
new_file = css_beautify(new_file, { indent_size: 2 });

// Custom diff
let diff = diffCss(old_file, new_file);
let semiFinalStr = '';

diff.forEach((part) => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? 'green' :
        part.removed ? 'red' : false;

    // Every line needs to be wrapped in `$\texttt{`
    part.value.split('\n').forEach((val, i, arr) => {
        // Every space at the beginning
        let totalSpaces = 0;
        while (val.slice(0, 1) == ' ') {
            totalSpaces++;
            val = val.slice(1);
        }
        if (totalSpaces > 0) {
            semiFinalStr += `\\hspace\\{${(totalSpaces / 2)}em\\}`;
        }

        if (color) {
            semiFinalStr += `\\color{${color}}`
        }

        semiFinalStr += latexEscape(val);

        // The last item doesn't need a new line
        if (i !== arr.length - 1) {
            semiFinalStr += '\n';
        }
    })
});

let finalStr = ''
semiFinalStr.split('\n').forEach(line => {
    finalStr += `$\\texttt{${line}}$\n`;
});

console.log(finalStr);

function latexEscape(str) {
    // https://stackoverflow.com/a/1629466
    return str
        .replaceAll('\\', '\\\\\\')
        .replaceAll('{', '\\\\{')
        .replaceAll('}', '\\\\}')
        .replaceAll('_', '\\\\_')
        .replaceAll('^', '\\\\^')
        .replaceAll('#', '\\\\#')
        .replaceAll('&', '\\\\&')
        .replaceAll('$', '\\\\$')
        .replaceAll('%', '\\\\%')
        .replaceAll('~', '\\\\~');
}
