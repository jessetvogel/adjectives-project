import { Book } from '../shared/core.js';
import { katexTypeset } from './katex-typeset.js';
import { create, setText } from './util.js';

export function pageAdjective(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id

    const span_name = create('span', {}, '');
    const p_description = create('p', { class: 'description' }, '');

    fetch(`json/adjectives/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data) setText(span_name, data.name);
        katexTypeset(span_name);

        // Update description paragraph
        if ('description' in data) setText(p_description, data.description);
        katexTypeset(p_description);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    return create('div', { class: 'page page-adjective' }, [
        create('span', { class: 'title' }, [
            create('span', {}, `Adjective `),
            span_name,
            create('span', { class: 'comment' }, ` (${summary.types[type].name})`)
        ]),
        p_description
    ]);
}
