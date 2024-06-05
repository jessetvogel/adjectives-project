import { create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';
export function pageExampleUrl(type, id) {
    return `?page=example&type=${type}&id=${id}`;
}
export function pageExample(summary, options) {
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    // TODO: regex check type and id
    const span_name = create('span', {}, '');
    const p_description = create('p', { class: 'decsription ' }, '');
    const table_adjectives = create('table', { class: 'adjectives' }, '');
    fetch(`json/examples/${type}/${id}.json`).then(response => response.json()).then(data => {
        var _a, _b, _c;
        // Update name span
        if ('name' in data)
            setText(span_name, data.name);
        katexTypeset(span_name);
        // Update description paragraph
        if ('description' in data) {
            setText(p_description, data.description);
            katexTypeset(p_description);
        }
        // Update adjectives table
        table_adjectives.append(create('tr', {}, [
            create('th', {}, 'Adjective'),
            create('th', {}, 'Value'),
            create('th', {}, 'Proof')
        ]));
        for (const adj_id in summary.adjectives[type]) {
            const adjective = summary.adjectives[type][adj_id];
            const value = (_a = data === null || data === void 0 ? void 0 : data.adjectives) === null || _a === void 0 ? void 0 : _a[adj_id]; // true, false or undefined
            table_adjectives.append(create('tr', {}, [
                create('td', {}, create('a', { href: `?page=adjective&type=${adjective.type}&id=${adj_id}` }, adjective.name)),
                create('td', {}, (value == true) ? 'true' : (value == false ? 'false' : 'unknown')),
                create('td', {}, (_c = (_b = data === null || data === void 0 ? void 0 : data.proofs) === null || _b === void 0 ? void 0 : _b[adj_id]) !== null && _c !== void 0 ? _c : '')
            ]));
        }
        katexTypeset(table_adjectives);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    return create('div', { class: 'page-example' }, [
        create('span', { class: 'title' }, [create('span', { class: 'tt', style: 'margin-right: 8px;' }, `${type} ${id}`), span_name]),
        p_description,
        table_adjectives
    ]);
}
//# sourceMappingURL=page-example.js.map