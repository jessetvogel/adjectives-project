import { Book } from '../shared/core.js';
import { katexTypeset } from './katex-typeset.js';
import { create, setText } from './util.js';

export function pageAdjective(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-adjective' });

    const type = options?.type;
    const id = options?.id;
    if (type === undefined || id === undefined || !(type in summary.adjectives) || !(id in summary.adjectives[type])) {
        page.append(create('span', { class: 'title' }, `🥺 Adjective not found..`));
        return page;
    }

    const spanName = create('span', {}, '');
    const spanSubtitle = create('span', { class: 'subtitle' }, ` (${summary.types[type].name} adjective)`);
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


    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pDescription
    ]);

    return page;
}
