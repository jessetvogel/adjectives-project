import { Book } from '../shared/core.js';
import { katexTypeset } from './katex-typeset.js';
import { create, setText } from './util.js';

export function pageType(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-type' });

    const id = options?.id;
    if (!(id in summary.types)) {
        page.append(create('span', { class: 'title' }, `🥺 Type not found..`));
        return page;
    }

    const spanName = create('span', {}, summary.types[id].name);
    const spanSubtitle = create('span', { class: 'subtitle' }, ` (type)`);
    const pDescription = create('p', { class: 'description' }, '');

    // FETCH DATA
    fetch(`json/types/${id}.json`).then(response => response.json()).then(data => {
        // update name span
        if ('name' in data) setText(spanName, data.name);
        katexTypeset(spanName);

        // update description paragraph
        if ('description' in data) {
            setText(pDescription, data.description);
            katexTypeset(pDescription);
        }
    }).catch((error: any) => {
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