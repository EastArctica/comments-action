import { strAttr, strNode } from "./helpers";

export function customToCSS(node: cssNode, depth?: number, breaks?: boolean) {
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
                    cssString += strAttr(i, att[j], depth);
                }
            } else {
                cssString += strAttr(i, att, depth);
            }
        }
    }
    if (node.children) {
        var first = true;
        for (let i in node.children) {
            if (breaks && !first) {
                cssString += '\n';
            } else {
                first = false;
            }
            cssString += strNode(i, node.children[i], depth);
        }
    }
    return cssString;
};
