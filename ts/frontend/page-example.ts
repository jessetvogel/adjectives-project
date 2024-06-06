import { Book, Proof } from '../shared/core.js';
import { create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';

function sentenceFromProof(summary: Book, proof: string | Proof): string {
    if (proof === undefined)
        return '';

    if (typeof proof == 'string')
        return proof;

    return `By ${navigation.anchorTheorem(proof.type, proof.theorem).outerHTML} applied to ${navigation.anchorExample(proof.type, proof.subject).outerHTML}.`;
}

export function pageExample(summary: Book, options: any): HTMLElement {
    const type = options?.type;
    const id = options?.id;

    // TODO: regex check type and id
    const span_name = create('span', {}, '');
    const p_description = create('p', { class: 'description' }, '');
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

        const adjectiveValuePairs: { id: string, name: string, value: boolean | null }[] = []; // sort the adjectives based on name and value
        for (const adjId in summary.adjectives[type])
            adjectiveValuePairs.push({ id: adjId, name: summary.adjectives[type][adjId].name, value: data?.adjectives?.[adjId] });
        adjectiveValuePairs.sort((a, b) => {
            if (a.value == true && b.value != true) return -1;
            if (a.value != true && b.value == true) return 1;
            return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
        });
        for (const x of adjectiveValuePairs) {
            const adjId = x.id;
            const value = x.value;
            const adjective = summary.adjectives[type][adjId];
            table_adjectives.append(create('tr', {}, [
                create('td', {}, navigation.anchorAdjective(adjective.type, adjId)),
                create('td', {}, (value == true) ? 'true' : (value == false ? 'false' : 'unknown')),
                create('td', {}, sentenceFromProof(summary, data?.proofs?.[adjId]))
            ]));
        }
        katexTypeset(table_adjectives);

    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    return create('div', { class: 'page page-example' }, [
        create('span', { class: 'title' }, [
            create('span', {}, `Example `),
            span_name,
            create('span', { class: 'comment' }, ` (${summary.types[type].name})`)
        ]),
        p_description,
        table_adjectives
    ]);
}
