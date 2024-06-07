import { create, onInput, $$ } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';

export function pageData(summary: any, options: any): HTMLElement {
    const page = create('div', { class: 'page page-data' });

    const input = create('input', { type: 'text', placeholder: 'Search for example, adjective or theorem ...' }) as HTMLInputElement;

    onInput(input, function () {
        const value = input.value;
        for (const li of $$('li')) {
            const show = (value == '' || li.innerText.includes(value));
            li.style.display = show ? 'list-item' : 'none';
        }
    });

    page.append(create('div', { class: 'search-bar' }, input));

    for (const sort of ['examples', 'adjectives', 'theorems']) {
        const div = create('div');
        div.append(create('span', { class: 'title', style: 'text-align: left;' }, sort.charAt(0).toUpperCase() + sort.slice(1)));
        const ul = create('ul');
        div.append(ul);
        const anchor = (sort == 'examples' ? navigation.anchorExample : (sort == 'adjectives' ? navigation.anchorAdjective : navigation.anchorTheorem));
        for (const type in summary[sort]) {
            for (const id in summary[sort][type]) {
                ul.append(create('li', {}, [
                    anchor(type, id),
                    create('span', {}, ' '),
                    create('span', { class: 'comment' }, `(${summary.types[type].name})`)
                ]));
            }
        }
        page.append(div);
    }
    katexTypeset(page);

    return page;
}
