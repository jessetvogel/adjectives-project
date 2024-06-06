import { create, onInput, $$ } from './util.js';
import { katexTypeset } from './katex-typeset.js';
export function pageData(summary, options) {
    const page = create('div', { class: 'page page-data' });
    const input = create('input', { type: 'text', placeholder: 'Search for example, adjective or theorem ...' });
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
        for (const type in summary[sort]) {
            for (const id in summary[sort][type]) {
                ul.append(create('li', {}, [
                    create('a', { href: `?page=${sort.slice(0, -1)}&type=${type}&id=${id}` }, summary[sort][type][id].name),
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
//# sourceMappingURL=page-data.js.map