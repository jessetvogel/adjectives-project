import { Book } from '../shared/core.js';
import { create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';

export function pageExampleUrl(type: string, id: string) {
    return `?page=example&type=${type}&id=${id}`;
}

export function pageExample(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id
    const span_name = create('span', {}, '');
    const p_description = create('p', { class: 'decsription ' }, '');
    const table_adjectives = create('table', { class: 'adjectives' }, '');

    fetch(`json/examples/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data) setText(span_name, data.name);
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
            const value = data?.adjectives?.[adj_id]; // true, false or undefined
            table_adjectives.append(create('tr', {}, [
                create('td', {}, create('a', { href: `?page=adjective&type=${adjective.type}&id=${adj_id}` }, adjective.name)),
                create('td', {}, (value == true) ? 'true' : (value == false ? 'false' : 'unknown')),
                create('td', {}, data?.proofs?.[adj_id] ?? '')
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
