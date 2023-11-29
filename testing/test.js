const fs = require('fs');
const { diffCss } = require('diff');
const { css_beautify } = require('js-beautify');
const sourceMapRegex = /\/\*# sourceMappingURL=.*?\.map\*\//g;

let old_file = fs.readFileSync('old.app.css', 'utf-8');
let new_file = fs.readFileSync('new.app.css', 'utf-8');

// Custom diff
function generateDiff(oldCss, newCss) {
    // Beautify & skip source mapping
    let oldBeautified = css_beautify(oldCss, { indent_size: 2 }).replaceAll(sourceMapRegex, '');
    let newBeautified = css_beautify(newCss, { indent_size: 2 }).replaceAll(sourceMapRegex, '');
    let changes = diffCss(oldBeautified, newBeautified);

    let latexedChanges = [];
    changes.forEach((change) => {
        // green for additions, red for deletions
        // grey for common parts
        const color = change.added ? 'green' : change.removed ? 'red' : false;

        let latexedChange = {
            change,
            str: ''
        };

        change.value.split('\n').forEach((val, i, arr) => {
            // Github/markdown by default won't render spaces at the beginning of lines. This fixes that.
            let totalSpaces = 0;
            while (val.slice(0, 1) == ' ') {
                totalSpaces++;
                val = val.slice(1);
            }

            // Minor optimization to prevent an hspace with 0em size
            if (totalSpaces > 0) {
                latexedChange.str += `\\hspace\\{${(totalSpaces / 2)}em\\}`;
            }

            // Minor optimization, only add color if we need
            if (color) {
                latexedChange.str += `\\color{${color}}`
            }

            latexedChange.str += latexEscape(val);

            // The last item doesn't need a new line
            if (i !== arr.length - 1) {
                latexedChange.str += '\n';
            }
        });

        latexedChanges.push(latexedChange);
    });


    // Finalize the latex
    latexedChanges.forEach((change, i) => {
        let newStr = '';
        change.str.split('\n').forEach(line => {
            // Every line needs to be wrapped in latex to maintain monospace font throughout the comment.
            newStr += `$\\texttt{${line}}$\n`;
        });
        latexedChanges[i].str = newStr;
    });

    let diff = '';
    // Only keep 5 lines around modifications
    latexedChanges.forEach((change, i) => {
        // If nothing happened in this change, skip it
        if (!change.change.added && !change.change.removed) {
            return;
        }

        // Add header
        diff += `\n@@ -some_line,${change.change.value.length} @@\n`;

        if (latexedChanges[i - 1]) {
            // If we have a previous change, add the last 5 lines from it
            latexedChanges[i - 1].str.split('\n').slice(-5).forEach(line => {
                diff += `${line}\n`;
            });
        }
    
        // Add the changes themselves
        diff += change.str;

        if (latexedChanges[i + 1]) {
            // If we have a future change, add the first 5 lines from it
            latexedChanges[i + 1].str.split('\n').slice(0, 5).forEach(line => {
                diff += `${line}\n`;
            });
        }
    });
    
    fs.writeFileSync('test.tex', diff);

    return diff;
}

let diff = generateDiff(old_file, new_file);
//console.log(diff);

function latexEscape(str) {
    // https://stackoverflow.com/a/1629466
    return str
        .replaceAll('\\', '\\\\\\')
        .replaceAll('{', '\\\\{')
        .replaceAll('}', '\\\\}')
        .replaceAll('_', '\\\\\\_') // I have no clue why this needs 3
        .replaceAll('^', '\\\\^')
        .replaceAll('#', '\\\\#')
        .replaceAll('&', '\\\\&')
        .replaceAll('$', '\\\\$')
        .replaceAll('%', '\\\\%')
        .replaceAll('~', '\\\\~')
        .replaceAll('*', '\\*')
        .replaceAll('`', '\\`')
        .replaceAll('@', '{@}'); // This makes no sense but you need it
}
