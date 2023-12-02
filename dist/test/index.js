import { generateDiffCustom } from "../diff.js";
import { readFileSync, writeFileSync } from "fs";
import ansiToSvg from 'ansi-to-svg';
const oldContent = readFileSync('./css/old.app.css', 'utf8');
const newContent = readFileSync('./css/new.app.css', 'utf8');
const diff = generateDiffCustom(oldContent, newContent).trim();
let svg = ansiToSvg(diff, {
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
        // Standard markdown diff colors
        white: 'rgb(230, 237, 243)',
        red: 'rgb(255, 220, 215)',
        green: 'rgb(175, 245, 180)',
        bgGreen: 'rgb(3, 58, 22)',
        bgRed: 'rgb(103, 6, 12)',
        backgroundColor: 'rgb(22, 27, 34)',
        // Vibrant colors
        // red: '#ff0000',
        // green: '#008000',
        // backgroundColor: '#0d1117'
    }
}).replace('SauceCodePro Nerd Font, Source Code Pro, Courier', 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace');
writeFileSync('./css/diff.svg', svg, 'utf8');
