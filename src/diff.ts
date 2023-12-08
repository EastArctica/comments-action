import { toJSON, toCSS, JSONNode, CssAttributes } from 'css-convert-json';
//import { customToCSS } from './cssjson/index.js';

type Change = {
    selector: string,
    type: 'added' | 'removed' | 'changed',
    oldNode?: JSONNode,
    newNode?: JSONNode
};
const semiCss = /(?<![;}])}/g;


// Returns an array of attribute names where the content has changed
function diffAttributes(oldAttributes: CssAttributes, newAttributes: CssAttributes): string[] {
    // We also need to check if the node's attributes are different
    let attributesDiff = Object.keys(oldAttributes).filter((attr) => {
        // attributes can be an array, so we need to check if they're the same
        if (Array.isArray(oldAttributes[attr]) &&
            Array.isArray(newAttributes[attr])) {
            let oldAttr = oldAttributes[attr] as unknown as string[];
            let newAttr = newAttributes[attr] as unknown as string[];
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

        // Workaround a weird discord compilation thing where it randomly decides to use px or rem.
        if (oldAttributes[attr] !== newAttributes[attr]) {
            // TODO: For now we just multiply by the default document size (16px) and determine if they're equal
            if (oldAttributes[attr]?.endsWith('rem') && newAttributes[attr]?.endsWith('px')) {
                // rem -> px
                let remValue = Number(oldAttributes[attr].slice(0, -3));
                let pxValue = Number(newAttributes[attr].slice(0, -2));
                return (remValue * 16) !== pxValue;
            } else if (oldAttributes[attr]?.endsWith('px') && newAttributes[attr]?.endsWith('rem')) {
                // px -> rem
                let remValue = Number(newAttributes[attr].slice(0, -3));
                let pxValue = Number(oldAttributes[attr].slice(0, -2));
                return (remValue * 16) !== pxValue;
            }

            return true;
        }

        return false;
    });
    // Add the rest into the diff
    attributesDiff = attributesDiff.concat(Object.keys(newAttributes).filter((attr) => {
        // attributes can be an array, so we need to check if they're the same
        if (Array.isArray(oldAttributes[attr]) &&
            Array.isArray(newAttributes[attr])) {
            let oldAttr = oldAttributes[attr] as unknown as string[];
            let newAttr = newAttributes[attr] as unknown as string[];
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

        // Workaround a weird discord compilation thing where it randomly decides to use px or rem.
        if (oldAttributes[attr] !== newAttributes[attr]) {
            // TODO: For now we just multiply by the default document size (16px) and determine if they're equal
            if (oldAttributes[attr]?.endsWith('rem') && newAttributes[attr]?.endsWith('px')) {
                // rem -> px
                let remValue = Number(oldAttributes[attr].slice(0, -3));
                let pxValue = Number(newAttributes[attr].slice(0, -2));
                return (remValue * 16) !== pxValue;
            } else if (oldAttributes[attr]?.endsWith('px') && newAttributes[attr]?.endsWith('rem')) {
                // px -> rem
                let remValue = Number(newAttributes[attr].slice(0, -3));
                let pxValue = Number(oldAttributes[attr].slice(0, -2));
                return (remValue * 16) !== pxValue;
            }

            return true;
        }

        return oldAttributes[attr] !== newAttributes[attr];
    }));
    
    // Remove duplicates
    attributesDiff = [...new Set(attributesDiff)];
    
    return attributesDiff;
}

function findChanges(oldNode: JSONNode, newNode: JSONNode): Change[] {
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

            let attributesDiff = diffAttributes(oldNode.children[key].attributes, newNode.children[key].attributes);

            if (attributesDiff.length > 0) {
                // Determine if the only change is 
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

function latexEscape(str: string): string {
    // https://stackoverflow.com/a/1629466
    return str;
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

const ANSI_GREEN = '\u001b[32m';
const ANSI_GREEN_BG = '\u001b[42m';
const ANSI_RED = '\u001b[31m';
const ANSI_RED_BG = '\u001b[41m';
const ANSI_RESET = '\u001b[0m';

export function generateDiff(oldCss: string, newCss: string): string {
    const newNode = toJSON(newCss.replaceAll(semiCss, ';}'));
    const oldNode = toJSON(oldCss.replaceAll(semiCss, ';}'));

    let changes = findChanges(oldNode, newNode);
    let diffStr = '';
    for (const change of changes) {
        switch (change.type) {
            case 'added': {
                if (!change.newNode) {
                    break;
                }

                let fakeNode: JSONNode = {
                    attributes: {},
                    children: {
                        [change.selector]: change.newNode
                    },
                }
                let css = toCSS(fakeNode).trim();
                css.split('\n').forEach(line => {
                    // TODO: This only highlights the attribute's value, but not it's name.
                    diffStr += ANSI_GREEN + ANSI_GREEN_BG + latexEscape(line) + ANSI_RESET + '\n';
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
                    diffStr += ANSI_RED + ANSI_RED_BG +  latexEscape(line) + ANSI_RESET + '\n';
                });
                break;
            }
            case 'changed': {
                if (!change.oldNode || !change.newNode) {
                    break;
                }

                let attributesDiff = diffAttributes(change.oldNode.attributes, change.newNode.attributes)

                let attributesAdded = attributesDiff.filter((attr) => {
                    // new node has it, but old does not
                    return change.oldNode &&
                        change.newNode &&
                        !change.oldNode.attributes.hasOwnProperty(attr) &&
                        change.newNode.attributes.hasOwnProperty(attr);
                });
                let attributesRemoved = attributesDiff.filter((attr) => {
                    // old node has it, but new does not
                    return change.oldNode &&
                        change.newNode &&
                        change.oldNode.attributes.hasOwnProperty(attr) &&
                        !change.newNode.attributes.hasOwnProperty(attr);
                });
                let attributesChanged = attributesDiff.filter((attr) => {
                    // Both nodes have it, but they differ
                    return change.oldNode &&
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
                        for (const val of change.newNode.attributes[attr] as unknown as string[]) {
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
                        for (const val of change.oldNode.attributes[attr] as unknown as string[]) {
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
                        for (let i in change.newNode.attributes[attr] as unknown as string[]) {
                            (change.newNode.attributes[attr] as unknown as string[])[i] += `LATEX-COLOR-GREEN${change.newNode.attributes[attr][i]}LATEX-COLOR-WHITE`;
                        }
                    } else {
                        str = `LATEX-COLOR-GREEN${change.newNode.attributes[attr]}LATEX-COLOR-WHITE`;
                        fakeNode.children[change.selector].attributes[attr] = str;
                    }

                    // Find old
                    if (Array.isArray(change.oldNode.attributes)) {
                        for (let i in change.newNode.attributes[attr] as unknown as string[]) {
                            (change.newNode.attributes[attr] as unknown as string[])[i] += `LATEX-COLOR-GREEN${change.newNode.attributes[attr][i]}LATEX-COLOR-WHITE`;
                        }
                    } else {
                        str += `LATEX-COLOR-RED${change.oldNode.attributes[attr]}LATEX-COLOR-WHITE`;
                        fakeNode.children[change.selector].attributes[attr] = str;
                    }

                }

                let css = toCSS(fakeNode).trim();
                css = latexEscape(css);
                css = css.replaceAll('LATEX-COLOR-GREEN', ANSI_GREEN + ANSI_GREEN_BG);
                css = css.replaceAll('LATEX-COLOR-RED', ANSI_RED + ANSI_RED_BG);
                css = css.replaceAll('LATEX-COLOR-WHITE', ANSI_RESET);
                css.split('\n').forEach(line => {
                    diffStr += `${line}\n`;
                });
                break;
            }
        }
    }

    return diffStr;
}