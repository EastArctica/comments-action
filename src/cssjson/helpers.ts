import { customToCSS } from "./index.js";

export function strAttr(name: string, value: string, depth: number) {
    return '\t'.repeat(depth) + name + ': ' + value + ';\n';
};

export function strNode(name: string, value: cssNode, depth: number) {
    var cssString = '\t'.repeat(depth) + name + ' {\n';
    cssString += customToCSS(value, depth + 1);
    cssString += '\t'.repeat(depth) + '}\n';
    return cssString;
};
