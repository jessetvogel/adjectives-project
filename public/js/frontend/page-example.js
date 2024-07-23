import { create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import { formatProof } from './formatter.js';
import navigation from './navigation.js';
export function pageExample(summary, options) {
    const page = create('div', { class: 'page page-example' });
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    if (type === undefined || id === undefined || !(type in summary.examples) || !(id in summary.examples[type])) {
        page.append(create('span', { class: 'title' }, `🥺 Example not found..`));
        return page;
    }
    const spanName = create('span', {});
    const spanSubtitle = create('span', { class: 'subtitle' });
    const pDescription = create('p', { class: 'description' }, '');
    const tableAdjectives = create('table', { class: 'adjectives' }, '');
    spanSubtitle.append(`(${summary.types[type].name}`);
    const args = Object.keys(summary.examples[type][id].args);
    for (let i = 0; i < args.length; ++i) {
        if (i == 0)
            spanSubtitle.append(' with ');
        if (i > 0 && i < args.length - 1)
            spanSubtitle.append(', ');
        if (i > 0 && i == args.length - 1)
            spanSubtitle.append(' and ');
        const arg = args[i];
        spanSubtitle.append(arg, ' ');
        spanSubtitle.append(navigation.anchorExample(summary.types[type].parameters[arg], summary.examples[type][id].args[arg]));
    }
    spanSubtitle.append(')');
    katexTypeset(spanSubtitle);
    fetch(`json/examples/${type}/${id}.json`, { cache: 'reload' }).then(response => response.json()).then(data => {
        var _a, _b, _c, _d;
        if ('name' in data)
            setText(spanName, data.name);
        katexTypeset(spanName);
        if ('description' in data) {
            setText(pDescription, data.description);
            katexTypeset(pDescription);
        }
        tableAdjectives.append(create('tr', {}, [
            create('th', {}, 'Adjective'),
            create('th', {}, 'Value'),
            create('th', {}, 'Proof')
        ]));
        for (const adjId of adjectivesOrder(summary, type, id, data)) {
            const adjective = summary.adjectives[type][adjId];
            const value = ((_b = (_a = data === null || data === void 0 ? void 0 : data.adjectives) === null || _a === void 0 ? void 0 : _a[adjId]) !== null && _b !== void 0 ? _b : 'unknown').toString();
            tableAdjectives.append(create('tr', {}, [
                create('td', {}, navigation.anchorAdjective(adjective.type, adjId)),
                create('td', { class: value }, value),
                create('td', {}, (_d = formatProof(type, id, (_c = data === null || data === void 0 ? void 0 : data.proofs) === null || _c === void 0 ? void 0 : _c[adjId])) !== null && _d !== void 0 ? _d : '')
            ]));
        }
        katexTypeset(tableAdjectives);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pDescription,
        tableAdjectives
    ]);
    return page;
}
function adjectivesOrder(summary, type, id, data) {
    const depths = {};
    function computeDepth(adjective) {
        var _a, _b;
        if (adjective in depths)
            return;
        if (((_a = data === null || data === void 0 ? void 0 : data.adjectives) === null || _a === void 0 ? void 0 : _a[adjective]) === undefined) {
            depths[adjective] = 999999;
            return;
        }
        if (((_b = data === null || data === void 0 ? void 0 : data.proofs) === null || _b === void 0 ? void 0 : _b[adjective]) === undefined) {
            depths[adjective] = 0;
            return;
        }
        const proof = data.proofs[adjective];
        if (typeof proof == 'string') {
            depths[adjective] = 0;
            return;
        }
        const dependencies = summary.traceProofDependencies(summary.examples, summary.examples[type][id], adjective, proof);
        let depth = 1;
        for (const { object: obj, adjective: adj } of dependencies) {
            if (obj.type == type && obj.id == id) {
                computeDepth(adj);
                depth = Math.max(depth, depths[adj] + 1);
            }
        }
        depths[adjective] = depth;
        return;
    }
    const adjectives = Object.keys(summary.adjectives[type]);
    for (const adjective of adjectives)
        computeDepth(adjective);
    adjectives.sort((a, b) => depths[a] - depths[b]);
    return adjectives;
}
