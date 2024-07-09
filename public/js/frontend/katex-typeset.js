const options = {
    macros: {
        "\\id": "\\text{id}",
        "\\Hom": "\\text{Hom}",
        "\\ZZ": "\\mathbb{Z}",
        "\\QQ": "\\mathbb{Q}",
        "\\CC": "\\mathbb{C}",
        "\\RR": "\\mathbb{R}",
        "\\NN": "\\mathbb{N}",
        "\\PP": "\\mathbb{P}",
        "\\AA": "\\mathbb{A}",
        "\\FF": "\\mathbb{F}",
        "\\textup": "\\text{#1}",
        "\\im": "\\operatorname{im}",
        "\\colim": "\\mathop{\\operatorname{colim}}\\limits",
        "\\coker": "\\operatorname{coker}",
        "\\tr": "\\operatorname{tr}",
        "\\bdot": "\\bullet",
        "\\Spec": "\\operatorname{Spec}",
        "\\Proj": "\\operatorname{Proj}",
        "\\norm": "{\\left\\|#1\\right\\|}",
        "\\sslash": "\\mathbin{/\\mkern-6mu/}",
        "\\mod": "\\text{ mod }",
        "\\mapsfrom": "\\leftarrow\\mathrel{\\mkern-3.2mu\\raisebox{.7mu}{$\\shortmid$}}",
        "\\isom": "\\cong",
        "\\Stacks": "\\href{https://stacks.math.columbia.edu/tag/#1}{\\text{Stacks Project #1}}"
    },
    delimiters: [
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true }
    ],
    trust: true
};
export function katexTypeset(elem) {
    if (!('renderMathInElement' in window))
        throw new Error(`Missing function 'renderMathInElement'`);
    window.renderMathInElement(elem, options);
}
//# sourceMappingURL=katex-typeset.js.map