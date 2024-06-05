import { Book } from '../shared/core.js';
import { create, setText } from './util.js';

export function pageAdjective(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id

    const p_description = create('p', { class: 'decsription ' }, '');

    fetch(`json/adjectives/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update description paragraph
        if ('description' in data) setText(p_description, data.description);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    return create('div', { class: 'page-example' }, [
        create('h1', {}, `Adjective ${id} of type ${type}`),
        p_description
    ]);
}
