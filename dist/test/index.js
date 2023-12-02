"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("../diff");
const fs_1 = require("fs");
const ansi_to_svg_1 = __importDefault(require("ansi-to-svg"));
const oldContent = (0, fs_1.readFileSync)('./css/old.app.css', 'utf8');
const newContent = (0, fs_1.readFileSync)('./css/new.app.css', 'utf8');
const diff = (0, diff_1.generateDiffCustom)(oldContent, newContent).trim();
let svg = (0, ansi_to_svg_1.default)(diff, {
    // Defaults to  2x for Retina compatibility
    scale: 2,
    // This doesn't work. I don't know why.
    // fontFace: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    // fontSize: 12,
    lineHeight: 16,
    // Padding
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    // Or override the default colors
    // (all defaults shown here)
    colors: {
        white: 'rgb(230, 237, 243)',
        red: 'rgb(255, 220, 215)',
        green: 'rgb(175, 245, 180)',
        bgGreen: 'rgb(3, 58, 22)',
        bgRed: 'rgb(103, 6, 12)',
        backgroundColor: 'rgb(22, 27, 34)',
        // Old
        // red: '#ff0000',
        // green: '#008000',
        // backgroundColor: '#0d1117'
    }
}).replace('SauceCodePro Nerd Font, Source Code Pro, Courier', 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace');
(0, fs_1.writeFileSync)('./css/diff.svg', svg, 'utf8');
//# sourceMappingURL=index.js.map