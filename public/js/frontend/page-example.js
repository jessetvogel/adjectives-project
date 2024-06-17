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
    // Update subtitle
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
    fetch(`json/examples/${type}/${id}.json`).then(response => response.json()).then(data => {
        var _a, _b, _c;
        // Update name span
        if ('name' in data)
            setText(spanName, data.name);
        katexTypeset(spanName);
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
            const value = (x.value == true) ? 'true' : (x.value == false ? 'false' : 'unknown');
            const adjective = summary.adjectives[type][adjId];
            tableAdjectives.append(create('tr', {}, [
                create('td', {}, navigation.anchorAdjective(adjective.type, adjId)),
                create('td', { class: value }, value),
                create('td', {}, (_c = formatProof(type, id, (_b = data === null || data === void 0 ? void 0 : data.proofs) === null || _b === void 0 ? void 0 : _b[adjId])) !== null && _c !== void 0 ? _c : '')
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
//# sourceMappingURL=page-example.js.map