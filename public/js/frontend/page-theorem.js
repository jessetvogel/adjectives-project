import { create, setText } from './util.js';
export function pageTheorem(summary, options) {
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    // TODO: regex check type and id
    const p_description = create('p', { class: 'decsription ' }, '');
    fetch(`json/theorems/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update description paragraph
        if ('description' in data)
            setText(p_description, data.description);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    return create('div', { class: 'page-example' }, [
        create('h1', {}, `Theorem ${id} of type ${type}`),
        p_description
    ]);
}
//# sourceMappingURL=page-theorem.js.map