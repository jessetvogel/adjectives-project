import { katexTypeset } from './katex-typeset.js';
import { create, setText } from './util.js';
export function pageAdjectiveUrl(type, id) {
    return `?page=adjective&type=${type}&id=${id}`;
}
export function pageAdjective(summary, options) {
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    // TODO: regex check type and id
    const span_name = create('span', {}, '');
    const p_description = create('p', { class: 'decsription ' }, '');
    fetch(`json/adjectives/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data)
            setText(span_name, data.name);
        katexTypeset(span_name);
        // Update description paragraph
        if ('description' in data)
            setText(p_description, data.description);
        katexTypeset(p_description);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    return create('div', { class: 'page-adjective' }, [
        create('span', { class: 'title' }, [create('span', { class: 'tt', style: 'margin-right: 8px;' }, `${type} ${id}`), span_name]),
        p_description
    ]);
}
//# sourceMappingURL=page-adjective.js.map