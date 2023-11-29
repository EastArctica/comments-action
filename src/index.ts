import { toJSON, toCSS } from 'cssjson';
import { readFileSync, writeFileSync } from 'fs';
import { customToCSS } from './cssjson';

type Change = {
    selector: string,
    type: 'added' | 'removed' | 'changed',
    oldNode?: cssNode,
    newNode?: cssNode
};
const semiCss = /(?<![;}])}/g;

const newCss = readFileSync('./css/new.app.css', 'utf8').replaceAll(semiCss, ';}');
const oldCss = readFileSync('./css/old.app.css', 'utf8').replaceAll(semiCss, ';}');
const newNode = toJSON(newCss);
const oldNode = toJSON(oldCss);

// Find everything in newJson that's not in oldJson
function findChanges(oldNode: cssNode, newNode: cssNode): Change[] {
    let changes: Change[] = [];

    // If A doesn't have B's node, The node must've been added
    for (let key in newNode.children) {
        if (!oldNode.children.hasOwnProperty(key)) {
            changes.push({
                selector: key,
                type: 'added',
                newNode: newNode.children[key]
            });
        } else {
            // This node exists in both A and B, but it might have changed
            // Check if the node's children are different
            let childrenDiff = findChanges(oldNode.children[key], newNode.children[key]);
            if (childrenDiff.length > 0) {
                changes.push({
                    selector: key,
                    type: 'changed',
                    oldNode: oldNode.children[key],
                    newNode: newNode.children[key]
                });
            }

            // We also need to check if the node's attributes are different
        
            let attributesDiff = Object.keys(oldNode.children[key].attributes).filter((attr) => {
                // attributes can be an array, so we need to check if they're the same
                if (Array.isArray(oldNode.children[key].attributes[attr]) && 
                    Array.isArray(newNode.children[key].attributes[attr])) {
                    let oldAttr = oldNode.children[key].attributes[attr] as string[];
                    let newAttr = newNode.children[key].attributes[attr] as string[];
                    if (oldAttr.length !== newAttr.length) {
                        return true;
                    }

                    for (const attr of oldAttr) {
                        if (!oldAttr.includes(attr)) {
                            return true;
                        }
                    }
                    return false;
                }

                return oldNode.children[key].attributes[attr] !== newNode.children[key].attributes[attr];
            });
            // Add the rest into the diff
            attributesDiff = attributesDiff.concat(Object.keys(newNode.children[key].attributes).filter((attr) => {
                // attributes can be an array, so we need to check if they're the same
                if (Array.isArray(oldNode.children[key].attributes[attr]) && 
                    Array.isArray(newNode.children[key].attributes[attr])) {
                    let oldAttr = oldNode.children[key].attributes[attr] as string[];
                    let newAttr = newNode.children[key].attributes[attr] as string[];
                    if (oldAttr.length !== newAttr.length) {
                        return true;
                    }

                    for (const attr of oldAttr) {
                        if (!oldAttr.includes(attr)) {
                            return true;
                        }
                    }
                    return false;
                }

                return oldNode.children[key].attributes[attr] !== newNode.children[key].attributes[attr];
            }));

            if (attributesDiff.length > 0) {
                changes.push({
                    selector: key,
                    type: 'changed',
                    oldNode: oldNode.children[key],
                    newNode: newNode.children[key]
                });
            }
        }
    }

    // If B doesn't have A's node, The node must've been removed
    for (let key in oldNode.children) {
        if (!newNode.children.hasOwnProperty(key)) {
            changes.push({
                selector: key,
                type: 'removed',
                oldNode: oldNode.children[key]
            });
        }
    }

    return changes;
}

function latexEscape(str: string) {
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

let changes = findChanges(oldNode, newNode);
writeFileSync('./changes.json', JSON.stringify(changes, null, 4), 'utf8');
let diffStr = '';
for (const change of changes) {
    switch (change.type) {
    case 'added': {
        if (!change.newNode) {
            break;
        }

        let fakeNode: cssNode = {
            attributes: {},
            children: {
                [change.selector]: change.newNode
            },
        }
        let css = toCSS(fakeNode).trim();
        css.split('\n').forEach(line => {
            // TODO: This only highlights the attribute's value, but not it's name.
            diffStr += `$\\texttt{\\color{green}${latexEscape(line)}}$\n`;
        });
        break;
    }
    case 'removed': {
        if (!change.oldNode) {
            break;
        }

        let fakeNode = {
            attributes: {},
            children: {
                [change.selector]: change.oldNode
            },
        }
        let css = toCSS(fakeNode).trim();
        css.split('\n').forEach(line => {
            // TODO: This only highlights the attribute's value, but not it's name.
            diffStr += `$\\texttt{\\color{red}${latexEscape(line)}}$\n`;
        });
        break;
    }
    case 'changed': {
        if (!change.oldNode || !change.newNode) {
            break;
        }

        // Determine which attributes were added/changed/removed
        let attributesDiff = Object.keys(change.oldNode.attributes).filter(attr => {
            if (!change.oldNode || !change.newNode) {
                return false;
            }

            // If we have multiple of this attribute, we need to verify that they're all the same
            if (Array.isArray(change.oldNode.attributes[attr]) && 
                Array.isArray(change.newNode.attributes[attr])) {
                let oldAttr = change.oldNode.attributes[attr] as string[];
                let newAttr = change.newNode.attributes[attr] as string[];
                if (oldAttr.length !== newAttr.length) {
                    return true;
                }

                for (const attr of oldAttr) {
                    if (!oldAttr.includes(attr)) {
                        return true;
                    }
                }
                return false;
            }

            return change.oldNode.attributes[attr] !== change.newNode.attributes[attr];
        });

        // Add the rest into the diff
        attributesDiff = attributesDiff.concat(Object.keys(change.newNode.attributes).filter((attr) => {
            if (!change.oldNode || !change.newNode) {
                return false;
            }

            // If we have multiple of this attribute, we need to verify that they're all the same
            if (Array.isArray(change.oldNode.attributes[attr]) && 
                Array.isArray(change.newNode.attributes[attr])) {
                let oldAttr = change.oldNode.attributes[attr] as string[];
                let newAttr = change.newNode.attributes[attr] as string[];
                if (oldAttr.length !== newAttr.length) {
                    return true;
                }

                for (const attr of oldAttr) {
                    if (!oldAttr.includes(attr)) {
                        return true;
                    }
                }
                return false;
            }

            return change.oldNode.attributes[attr] !== change.newNode.attributes[attr];
        }));

        let attributesAdded = attributesDiff.filter((attr) => {
            // new node has it, but old does not
            return  change.oldNode &&
                    change.newNode &&
                    !change.oldNode.attributes.hasOwnProperty(attr) &&
                    change.newNode.attributes.hasOwnProperty(attr);
        });
        let attributesRemoved = attributesDiff.filter((attr) => {
            // old node has it, but new does not
            return  change.oldNode &&
                    change.newNode &&
                    change.oldNode.attributes.hasOwnProperty(attr) &&
                    !change.newNode.attributes.hasOwnProperty(attr);
        });
        let attributesChanged = attributesDiff.filter((attr) => {
            // Both nodes have it, but they differ
            return  change.oldNode &&
                    change.newNode &&
                    change.oldNode.attributes.hasOwnProperty(attr) &&
                    change.newNode.attributes.hasOwnProperty(attr) &&
                    change.oldNode.attributes[attr] !== change.newNode.attributes[attr];
        });

        // Add css block and attributes to diffStr
        let fakeNode = {
            attributes: {},
            children: {
                [change.selector]: change.newNode
            },
        }

        for (const attr of attributesAdded) {
            if (Array.isArray(change.newNode.attributes)) {
                let str = '';
                for (const val of change.newNode.attributes[attr] as string[]) {
                    str += `LATEX-COLOR-GREEN${val}LATEX-COLOR-WHITE, `;
                }
                fakeNode.children[change.selector].attributes[attr] = str.slice(0, -2);
            } else {
                let str = `LATEX-COLOR-GREEN${change.newNode.attributes[attr]}LATEX-COLOR-WHITE`;
                fakeNode.children[change.selector].attributes[attr] = str;
            }
        }
        for (const attr of attributesRemoved) {
            if (Array.isArray(change.oldNode.attributes)) {
                let str = '';
                for (const val of change.oldNode.attributes[attr] as string[]) {
                    str += `LATEX-COLOR-RED${val}LATEX-COLOR-WHITE, `;
                }
                fakeNode.children[change.selector].attributes[attr] = str.slice(0, -2);
            } else {
                let str = `LATEX-COLOR-RED${change.oldNode.attributes[attr]}LATEX-COLOR-WHITE`;
                fakeNode.children[change.selector].attributes[attr] = str;
            }
        }
        for (const attr of attributesChanged) {
            let str = '';
            // Find new
            if (Array.isArray(change.newNode.attributes)) {
                for (let i in change.newNode.attributes[attr] as string[]) {
                    (change.newNode.attributes[attr] as string[])[i] += `LATEX-COLOR-GREEN${change.newNode.attributes[attr][i]}LATEX-COLOR-WHITE`;
                }
            } else {
                str = `LATEX-COLOR-GREEN${change.newNode.attributes[attr]}LATEX-COLOR-WHITE`;
                fakeNode.children[change.selector].attributes[attr] = str;
            }

            // Find old
            if (Array.isArray(change.oldNode.attributes)) {
                for (let i in change.newNode.attributes[attr] as string[]) {
                    (change.newNode.attributes[attr] as string[])[i] += `LATEX-COLOR-GREEN${change.newNode.attributes[attr][i]}LATEX-COLOR-WHITE`;
                }
            } else {
                str += `LATEX-COLOR-RED${change.oldNode.attributes[attr]}LATEX-COLOR-WHITE`;
                fakeNode.children[change.selector].attributes[attr] = str;
            }

        }

        let css = customToCSS(fakeNode).trim();
        css = latexEscape(css);
        css = css.replaceAll('LATEX-COLOR-GREEN', '\\color{green}');
        css = css.replaceAll('LATEX-COLOR-RED', '\\color{red}');
        css = css.replaceAll('LATEX-COLOR-WHITE', '\\color{white}');
        css.split('\n').forEach(line => {
            diffStr += `$\\texttt{${line}}$\n`;
        });
        break;
    }
    }
}

writeFileSync('./diff.txt', diffStr, 'utf8');
