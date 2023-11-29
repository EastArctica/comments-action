(function () { var __webpack_modules__ = { 516: function (e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", { value: true });
        t.strNode = t.strAttr = void 0;
        var l = r(229);
        function strAttr(e, t, r) { return "\t".repeat(r) + e + ": " + t + ";\n"; }
        t.strAttr = strAttr;
        function strNode(e, t, r) { var o = "\t".repeat(r) + e + " {\n"; o += (0, l.customToCSS)(t, r + 1); o += "\t".repeat(r) + "}\n"; return o; }
        t.strNode = strNode;
    }, 229: function (e, t, r) {
        "use strict";
        Object.defineProperty(t, "__esModule", { value: true });
        t.customToCSS = void 0;
        var l = r(516);
        function customToCSS(e, t, r) { var o = ""; if (typeof t == "undefined") {
            t = 0;
        } if (typeof r == "undefined") {
            r = false;
        } if (e.attributes) {
            for (var r_1 in e.attributes) {
                var i = e.attributes[r_1];
                if (i instanceof Array) {
                    for (var s = 0; s < i.length; s++) {
                        o += (0, l.strAttr)(r_1, i[s], t);
                    }
                }
                else {
                    o += (0, l.strAttr)(r_1, i, t);
                }
            }
        } if (e.children) {
            var n = true;
            for (var i_1 in e.children) {
                if (r && !n) {
                    o += "\n";
                }
                else {
                    n = false;
                }
                o += (0, l.strNode)(i_1, e.children[i_1], t);
            }
        } return o; }
        t.customToCSS = customToCSS;
    }, 223: function (module) { module.exports = eval("require")("cssjson"); }, 147: function (e) {
        "use strict";
        e.exports = require("fs");
    } }; var __webpack_module_cache__ = {}; function __nccwpck_require__(e) { var t = __webpack_module_cache__[e]; if (t !== undefined) {
    return t.exports;
} var r = __webpack_module_cache__[e] = { exports: {} }; var l = true; try {
    __webpack_modules__[e](r, r.exports, __nccwpck_require__);
    l = false;
}
finally {
    if (l)
        delete __webpack_module_cache__[e];
} return r.exports; } if (typeof __nccwpck_require__ !== "undefined")
    __nccwpck_require__.ab = __dirname + "/"; var __webpack_exports__ = {}; (function () {
    "use strict";
    var e = __webpack_exports__;
    Object.defineProperty(e, "__esModule", { value: true });
    var t = __nccwpck_require__(223);
    var r = __nccwpck_require__(147);
    var l = __nccwpck_require__(229);
    var o = /(?<![;}])}/g;
    var i = (0, r.readFileSync)("./css/new.app.css", "utf8").replaceAll(o, ";}");
    var s = (0, r.readFileSync)("./css/old.app.css", "utf8").replaceAll(o, ";}");
    var n = (0, t.toJSON)(i);
    var a = (0, t.toJSON)(s);
    function findChanges(e, t) { var r = []; var _loop_2 = function (l_1) {
        if (!e.children.hasOwnProperty(l_1)) {
            r.push({ selector: l_1, type: "added", newNode: t.children[l_1] });
        }
        else {
            var o_1 = findChanges(e.children[l_1], t.children[l_1]);
            if (o_1.length > 0) {
                r.push({ selector: l_1, type: "changed", oldNode: e.children[l_1], newNode: t.children[l_1] });
            }
            var i_2 = Object.keys(e.children[l_1].attributes).filter((function (r) { if (Array.isArray(e.children[l_1].attributes[r]) && Array.isArray(t.children[l_1].attributes[r])) {
                var o_3 = e.children[l_1].attributes[r];
                var i_3 = t.children[l_1].attributes[r];
                if (o_3.length !== i_3.length) {
                    return true;
                }
                for (var _i = 0, o_2 = o_3; _i < o_2.length; _i++) {
                    var e_1 = o_2[_i];
                    if (!o_3.includes(e_1)) {
                        return true;
                    }
                }
                return false;
            } return e.children[l_1].attributes[r] !== t.children[l_1].attributes[r]; }));
            i_2 = i_2.concat(Object.keys(t.children[l_1].attributes).filter((function (r) { if (Array.isArray(e.children[l_1].attributes[r]) && Array.isArray(t.children[l_1].attributes[r])) {
                var o_5 = e.children[l_1].attributes[r];
                var i_4 = t.children[l_1].attributes[r];
                if (o_5.length !== i_4.length) {
                    return true;
                }
                for (var _i = 0, o_4 = o_5; _i < o_4.length; _i++) {
                    var e_2 = o_4[_i];
                    if (!o_5.includes(e_2)) {
                        return true;
                    }
                }
                return false;
            } return e.children[l_1].attributes[r] !== t.children[l_1].attributes[r]; })));
            if (i_2.length > 0) {
                r.push({ selector: l_1, type: "changed", oldNode: e.children[l_1], newNode: t.children[l_1] });
            }
        }
    }; for (var l_1 in t.children) {
        _loop_2(l_1);
    } for (var l_2 in e.children) {
        if (!t.children.hasOwnProperty(l_2)) {
            r.push({ selector: l_2, type: "removed", oldNode: e.children[l_2] });
        }
    } return r; }
    function latexEscape(e) { return e.replaceAll("\\", "\\\\\\").replaceAll("{", "\\\\{").replaceAll("}", "\\\\}").replaceAll("_", "\\\\\\_").replaceAll("^", "\\\\^").replaceAll("#", "\\\\#").replaceAll("&", "\\\\&").replaceAll("$", "\\\\$").replaceAll("%", "\\\\%").replaceAll("~", "\\\\~").replaceAll("*", "\\*").replaceAll("`", "\\`").replaceAll("@", "{@}"); }
    var d = findChanges(a, n);
    (0, r.writeFileSync)("./changes.json", JSON.stringify(d, null, 4), "utf8");
    var c = "";
    var _loop_1 = function (e_3) {
        var _a, _b, _c;
        switch (e_3.type) {
            case "added": {
                if (!e_3.newNode) {
                    break;
                }
                var r_3 = { attributes: {}, children: (_a = {}, _a[e_3.selector] = e_3.newNode, _a) };
                var l_3 = (0, t.toCSS)(r_3).trim();
                l_3.split("\n").forEach((function (e) { c += "$\\texttt{\\color{green}".concat(latexEscape(e), "}$\n"); }));
                break;
            }
            case "removed": {
                if (!e_3.oldNode) {
                    break;
                }
                var r_4 = { attributes: {}, children: (_b = {}, _b[e_3.selector] = e_3.oldNode, _b) };
                var l_4 = (0, t.toCSS)(r_4).trim();
                l_4.split("\n").forEach((function (e) { c += "$\\texttt{\\color{red}".concat(latexEscape(e), "}$\n"); }));
                break;
            }
            case "changed": {
                if (!e_3.oldNode || !e_3.newNode) {
                    break;
                }
                var t_1 = Object.keys(e_3.oldNode.attributes).filter((function (t) { if (!e_3.oldNode || !e_3.newNode) {
                    return false;
                } if (Array.isArray(e_3.oldNode.attributes[t]) && Array.isArray(e_3.newNode.attributes[t])) {
                    var r_6 = e_3.oldNode.attributes[t];
                    var l_5 = e_3.newNode.attributes[t];
                    if (r_6.length !== l_5.length) {
                        return true;
                    }
                    for (var _i = 0, r_5 = r_6; _i < r_5.length; _i++) {
                        var e_4 = r_5[_i];
                        if (!r_6.includes(e_4)) {
                            return true;
                        }
                    }
                    return false;
                } return e_3.oldNode.attributes[t] !== e_3.newNode.attributes[t]; }));
                t_1 = t_1.concat(Object.keys(e_3.newNode.attributes).filter((function (t) { if (!e_3.oldNode || !e_3.newNode) {
                    return false;
                } if (Array.isArray(e_3.oldNode.attributes[t]) && Array.isArray(e_3.newNode.attributes[t])) {
                    var r_8 = e_3.oldNode.attributes[t];
                    var l_6 = e_3.newNode.attributes[t];
                    if (r_8.length !== l_6.length) {
                        return true;
                    }
                    for (var _i = 0, r_7 = r_8; _i < r_7.length; _i++) {
                        var e_5 = r_7[_i];
                        if (!r_8.includes(e_5)) {
                            return true;
                        }
                    }
                    return false;
                } return e_3.oldNode.attributes[t] !== e_3.newNode.attributes[t]; })));
                var r_9 = t_1.filter((function (t) { return e_3.oldNode && e_3.newNode && !e_3.oldNode.attributes.hasOwnProperty(t) && e_3.newNode.attributes.hasOwnProperty(t); }));
                var o_7 = t_1.filter((function (t) { return e_3.oldNode && e_3.newNode && e_3.oldNode.attributes.hasOwnProperty(t) && !e_3.newNode.attributes.hasOwnProperty(t); }));
                var i_6 = t_1.filter((function (t) { return e_3.oldNode && e_3.newNode && e_3.oldNode.attributes.hasOwnProperty(t) && e_3.newNode.attributes.hasOwnProperty(t) && e_3.oldNode.attributes[t] !== e_3.newNode.attributes[t]; }));
                var s_1 = { attributes: {}, children: (_c = {}, _c[e_3.selector] = e_3.newNode, _c) };
                for (var _d = 0, r_2 = r_9; _d < r_2.length; _d++) {
                    var t_2 = r_2[_d];
                    if (Array.isArray(e_3.newNode.attributes)) {
                        var r_10 = "";
                        for (var _e = 0, _f = e_3.newNode.attributes[t_2]; _e < _f.length; _e++) {
                            var l_7 = _f[_e];
                            r_10 += "LATEX-COLOR-GREEN".concat(l_7, "LATEX-COLOR-WHITE, ");
                        }
                        s_1.children[e_3.selector].attributes[t_2] = r_10.slice(0, -2);
                    }
                    else {
                        var r_11 = "LATEX-COLOR-GREEN".concat(e_3.newNode.attributes[t_2], "LATEX-COLOR-WHITE");
                        s_1.children[e_3.selector].attributes[t_2] = r_11;
                    }
                }
                for (var _g = 0, o_6 = o_7; _g < o_6.length; _g++) {
                    var t_3 = o_6[_g];
                    if (Array.isArray(e_3.oldNode.attributes)) {
                        var r_12 = "";
                        for (var _h = 0, _j = e_3.oldNode.attributes[t_3]; _h < _j.length; _h++) {
                            var l_8 = _j[_h];
                            r_12 += "LATEX-COLOR-RED".concat(l_8, "LATEX-COLOR-WHITE, ");
                        }
                        s_1.children[e_3.selector].attributes[t_3] = r_12.slice(0, -2);
                    }
                    else {
                        var r_13 = "LATEX-COLOR-RED".concat(e_3.oldNode.attributes[t_3], "LATEX-COLOR-WHITE");
                        s_1.children[e_3.selector].attributes[t_3] = r_13;
                    }
                }
                for (var _k = 0, i_5 = i_6; _k < i_5.length; _k++) {
                    var t_4 = i_5[_k];
                    var r_14 = "";
                    if (Array.isArray(e_3.newNode.attributes)) {
                        for (var r_15 in e_3.newNode.attributes[t_4]) {
                            e_3.newNode.attributes[t_4][r_15] += "LATEX-COLOR-GREEN".concat(e_3.newNode.attributes[t_4][r_15], "LATEX-COLOR-WHITE");
                        }
                    }
                    else {
                        r_14 = "LATEX-COLOR-GREEN".concat(e_3.newNode.attributes[t_4], "LATEX-COLOR-WHITE");
                        s_1.children[e_3.selector].attributes[t_4] = r_14;
                    }
                    if (Array.isArray(e_3.oldNode.attributes)) {
                        for (var r_16 in e_3.newNode.attributes[t_4]) {
                            e_3.newNode.attributes[t_4][r_16] += "LATEX-COLOR-GREEN".concat(e_3.newNode.attributes[t_4][r_16], "LATEX-COLOR-WHITE");
                        }
                    }
                    else {
                        r_14 += "LATEX-COLOR-RED".concat(e_3.oldNode.attributes[t_4], "LATEX-COLOR-WHITE");
                        s_1.children[e_3.selector].attributes[t_4] = r_14;
                    }
                }
                var n_1 = (0, l.customToCSS)(s_1).trim();
                n_1 = latexEscape(n_1);
                n_1 = n_1.replaceAll("LATEX-COLOR-GREEN", "\\color{green}");
                n_1 = n_1.replaceAll("LATEX-COLOR-RED", "\\color{red}");
                n_1 = n_1.replaceAll("LATEX-COLOR-WHITE", "\\color{white}");
                n_1.split("\n").forEach((function (e) { c += "$\\texttt{".concat(e, "}$\n"); }));
                break;
            }
        }
    };
    for (var _i = 0, d_1 = d; _i < d_1.length; _i++) {
        var e_3 = d_1[_i];
        _loop_1(e_3);
    }
    (0, r.writeFileSync)("./diff.txt", c, "utf8");
})(); module.exports = __webpack_exports__; })();
