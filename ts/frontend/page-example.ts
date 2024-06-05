import { Book } from '../shared/core.js';
import { create, setText } from './util.js';

export function pageExample(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id

    const p_description = create('p', { class: 'decsription ' }, '');
    const table_adjectives = create('table', { class: 'adjectives' }, '');

    fetch(`json/examples/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update description paragraph
        if ('description' in data) setText(p_description, data.description);

        // Update adjectives table
        for (const adj_id in summary.adjectives[type]) {
            const adjective = summary.adjectives[type][adj_id];
            const value = data?.adjectives?.[adj_id]; // true, false or undefined
            table_adjectives.append(create('tr', {}, [
                create('td', {}, adjective.name),
                create('td', {}, (value == true) ? 'true' : (value == false ? 'false' : 'unknown')),
                create('td', {}, data?.proofs?.[adj_id] ?? create('span', { class: 'comment' }, '(empty)'))
            ]));
        }
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    return create('div', { class: 'page-example' }, [
        create('h1', {}, `Example ${id} of type ${type}`),
        p_description,
        table_adjectives
    ]);
}
