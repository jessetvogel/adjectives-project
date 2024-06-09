import { Book } from '../shared/core.js';
import { katexTypeset } from './katex-typeset.js';
import { create, setText } from './util.js';

export function pageAdjective(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id

    const spanName = create('span', {}, '');
    const pDescription = create('p', { class: 'description' }, '');

    fetch(`json/adjectives/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data) setText(spanName, data.name);
        katexTypeset(spanName);

        // Update description paragraph
        if ('description' in data) setText(pDescription, data.description);
        katexTypeset(pDescription);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    return create('div', { class: 'page page-adjective' }, [
        create('span', { class: 'title' }, [
            // create('span', { class: 'comment' }, `Adjective `),
            spanName,
            create('span', { class: 'comment' }, ` (${summary.types[type].name} adjective)`)
        ]),
        pDescription
    ]);
}
