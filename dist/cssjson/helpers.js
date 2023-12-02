"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strNode = exports.strAttr = void 0;
const _1 = require(".");
function strAttr(name, value, depth) {
    return '\t'.repeat(depth) + name + ': ' + value + ';\n';
}
exports.strAttr = strAttr;
;
function strNode(name, value, depth) {
    var cssString = '\t'.repeat(depth) + name + ' {\n';
    cssString += (0, _1.customToCSS)(value, depth + 1);
    cssString += '\t'.repeat(depth) + '}\n';
    return cssString;
}
exports.strNode = strNode;
;
//# sourceMappingURL=helpers.js.map