import { customToCSS } from "./index.js";
export function strAttr(name, value, depth) {
    return '\t'.repeat(depth) + name + ': ' + value + ';\n';
}
;
export function strNode(name, value, depth) {
    var cssString = '\t'.repeat(depth) + name + ' {\n';
    cssString += customToCSS(value, depth + 1);
    cssString += '\t'.repeat(depth) + '}\n';
    return cssString;
}
;
