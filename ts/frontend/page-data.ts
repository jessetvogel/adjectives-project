import { Book } from '../shared/core.js';
import { create } from './util.js';
import { pageExampleUrl } from './page-example.js';
import { pageAdjectiveUrl } from './page-adjective.js';
import { pageTheoremUrl } from './page-theorem.js';
import { katexTypeset } from './katex-typeset.js';

export function pageData(summary: Book, options: any): HTMLElement {
    console.log(summary);

    const page = create('div');

    for (const sort of ['examples', 'adjectives', 'theorems']) {
        const div = create('div');
        div.append(create('span', { class: 'title' }, sort.charAt(0).toUpperCase() + sort.slice(1)));
        const ul = create('ul');
        div.append(ul);
        for (const type in summary[sort]) {
            for (const id in summary[sort][type]) {
                ul.append(create('li', {}, create('a', { href: `?page=${sort.slice(0, -1)}&type=${type}&id=${id}` }, [
                    create('span', { class: 'tt' }, `${type} ${id}`),
                    create('span', {}, summary[sort][type][id].name)
                ])));
            }
        }
        page.append(div);
    }
    katexTypeset(page);

    return page;
}
