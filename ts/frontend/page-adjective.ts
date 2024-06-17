import { Book } from '../shared/core.js';
import { katexTypeset } from './katex-typeset.js';
import { create, hasClass, addClass, removeClass, setText } from './util.js';
import navigation from './navigation.js';

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

    // CREATE TABLE WITH EXAMPLES
    const divExamples = create('div');
    const tableExamples = create('table', { class: 'hidden' });
    tableExamples.append(create('tr', {}, [
        create('th', {}, 'Example'),
        create('th', {}, summary.adjectives[type][id].name)
    ]));
    const rows: { id: string, value: boolean | null }[] = [];
    for (const exampleId in summary.examples[type])
        rows.push({ id: exampleId, value: summary.examples[type][exampleId]?.adjectives?.[id] ?? null });
    for (const row of rows) {
        const value = (row.value == true) ? 'true' : ((row.value === false ? 'false' : 'unknown'));
        tableExamples.append(create('tr', {}, [
            create('td', {}, navigation.anchorExample(type, row.id)),
            create('td', { class: value }, value)
        ]));
    }
    const buttonExamples = create('button', {
        '@click': () => {
            if (hasClass(tableExamples, 'hidden')) {
                removeClass(tableExamples, 'hidden');
                setText(buttonExamples, 'Hide examples');
            }
            else {
                addClass(tableExamples, 'hidden');
                setText(buttonExamples, 'Show examples');
            }
        }
    }, 'Show examples');
    divExamples.append(create('div', { class: 'row-buttons' }, buttonExamples))
    divExamples.append(tableExamples);
    katexTypeset(divExamples);

    // FETCH DATA
    fetch(`json/adjectives/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data) setText(spanName, data.name);
        katexTypeset(spanName);

        // Update description paragraph
        if ('description' in data) {
            setText(pDescription, data.description);
            katexTypeset(pDescription);
        }
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });


    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pDescription,
        divExamples
    ]);

    return page;
}
