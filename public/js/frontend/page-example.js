import { clear, create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
function formatProof(type, id, proof) {
    if (proof === undefined)
        return null;
    if (typeof proof == 'string')
        return create('span', {}, proof);
    const span = create('span', {}, ['By ', navigation.anchorTheorem(proof.type, proof.theorem)]);
    if (proof.type != type || proof.subject != id) {
        span.append(' applied to');
        span.append(navigation.anchorExample(proof.type, proof.subject));
    }
    span.append('.');
    return span;
}
export function pageExample(summary, options) {
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    // TODO: regex check type and id
    const spanName = create('span', {});
    const spanArguments = create('span', { class: 'arguments' });
    const pDescription = create('p', { class: 'description' }, '');
    const tableAdjectives = create('table', { class: 'adjectives' }, '');
    fetch(`json/examples/${type}/${id}.json`).then(response => response.json()).then(data => {
        var _a, _b, _c;
        // Update name span
        if ('name' in data)
            setText(spanName, data.name);
        katexTypeset(spanName);
        // Update arguments span
        console.log(data);
        if ('with' in data) {
            clear(spanArguments);
            const args = Object.keys(data.with);
            for (let i = 0; i < args.length; ++i) {
                if (i == 0)
                    spanArguments.append('with ');
                if (i > 0 && i < args.length - 1)
                    spanArguments.append(', ');
                if (i > 0 && i == args.length - 1)
                    spanArguments.append(' and ');
                const arg = args[i];
                spanArguments.append(arg, ' ');
                spanArguments.append(navigation.anchorExample(summary.types[type].parameters[arg], data.with[arg]));
            }
            katexTypeset(spanArguments);
        }
        // Update description paragraph
        if ('description' in data) {
            setText(pDescription, data.description);
            katexTypeset(pDescription);
        }
        // Update adjectives table
        tableAdjectives.append(create('tr', {}, [
            create('th', {}, 'Adjective'),
            create('th', {}, 'Value'),
            create('th', {}, 'Proof')
        ]));
        const adjectiveValuePairs = []; // sort the adjectives based on name and value
        for (const adjId in summary.adjectives[type])
            adjectiveValuePairs.push({ id: adjId, name: summary.adjectives[type][adjId].name, value: (_a = data === null || data === void 0 ? void 0 : data.adjectives) === null || _a === void 0 ? void 0 : _a[adjId] });
        adjectiveValuePairs.sort((a, b) => {
            if (a.value == true && b.value != true)
                return -1;
            if (a.value != true && b.value == true)
                return 1;
            if (a.value == false && b.value == undefined)
                return -1;
            if (a.value == undefined && b.value == false)
                return 1;
            return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
        });
        for (const x of adjectiveValuePairs) {
            const adjId = x.id;
            const value = x.value;
            const adjective = summary.adjectives[type][adjId];
            tableAdjectives.append(create('tr', {}, [
                create('td', {}, navigation.anchorAdjective(adjective.type, adjId)),
                create('td', {}, (value == true) ? 'true' : (value == false ? 'false' : 'unknown')),
                create('td', {}, (_c = formatProof(type, id, (_b = data === null || data === void 0 ? void 0 : data.proofs) === null || _b === void 0 ? void 0 : _b[adjId])) !== null && _c !== void 0 ? _c : '')
            ]));
        }
        katexTypeset(tableAdjectives);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    return create('div', { class: 'page page-example' }, [
        create('span', { class: 'title' }, [
            // create('span', { class: 'comment' }, `Example `),
            spanName,
            create('span', { class: 'comment' }, ` (${summary.types[type].name} example)`)
        ]),
        spanArguments,
        pDescription,
        tableAdjectives
    ]);
}
//# sourceMappingURL=page-example.js.map