"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customToCSS = void 0;
const helpers_1 = require("./helpers");
function customToCSS(node, depth, breaks) {
    var cssString = '';
    if (typeof depth == 'undefined') {
        depth = 0;
    }
    if (typeof breaks == 'undefined') {
        breaks = false;
    }
    if (node.attributes) {
        for (let i in node.attributes) {
            var att = node.attributes[i];
            if (att instanceof Array) {
                for (var j = 0; j < att.length; j++) {
                    cssString += (0, helpers_1.strAttr)(i, att[j], depth);
                }
            }
            else {
                cssString += (0, helpers_1.strAttr)(i, att, depth);
            }
        }
    }
    if (node.children) {
        var first = true;
        for (let i in node.children) {
            if (breaks && !first) {
                cssString += '\n';
            }
            else {
                first = false;
            }
            cssString += (0, helpers_1.strNode)(i, node.children[i], depth);
        }
    }
    return cssString;
}
exports.customToCSS = customToCSS;
;
//# sourceMappingURL=index.js.map