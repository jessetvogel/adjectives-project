import { Context, Book } from '../shared/core.js';
import { create, clear, onClick, $$, hasClass, addClass, removeClass, setHTML } from './util.js';

const example_context = {
    morphism: {
        f: { id: 'f', type: 'morphism', name: 'morphism', args: { source: 'X', target: 'Y' }, adjectives: { affine: true }, proofs: {} }
    },
    scheme: {
        X: { id: 'X', type: 'scheme', name: 'source', args: {}, adjectives: {}, proofs: {} },
        Y: { id: 'X', type: 'scheme', name: 'target', args: {}, adjectives: {}, proofs: {} }
    }
};

export function pageExplore(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-explore' });


    // \center I'm looking for a <select>
    // 
    // +--------------------------+
    // | morphism | [x] affine    |
    // | source   | [v] quasi-co. |
    // | target   | [ ] flat      |
    // +--------------------------+


    page.append(create('select', {}, Object.keys(summary.types).map(id => create('option', { value: id }, summary.types[id].name))));

    const div_objects = create('div', { class: 'list-objects' });
    const div_adjectives = create('div', { class: 'list-adjectives' });

    function setDivContext(context: Context) {
        clear(div_objects);
        clear(div_adjectives);
        for (const type in context) {
            for (const id in context[type]) {
                const item = create('div', {}, [
                    create('span', { class: 'type' }, type),
                    create('span', { class: 'id' }, id),
                    create('span', { class: 'name' }, context[type][id].name),
                    create('span', { class: 'adjectives' })
                ]);
                onClick(item, function () {
                    // Update `.selected` class
                    $$('.context .list-objects .selected').forEach(elem => removeClass(elem, 'selected'))
                    addClass(item, 'selected');
                    // Update overview
                    updateDivContext(context);
                });
                div_objects.append(item);
            }
        }
        (div_objects.firstChild as HTMLElement).click();
    }

    function updateDivContext(context: Context) {
        clear(div_adjectives);

        for (const div of div_objects.childNodes as NodeListOf<HTMLElement>) {
            const type = div.querySelector('.type')?.textContent ?? '';
            const id = div.querySelector('.id')?.textContent ?? '';
            const object = context[type][id];

            setHTML(div.querySelector('.adjectives') as HTMLElement, Object
                .keys(object.adjectives)
                .map(adj => create('span', { class: object.adjectives[adj] ? 'yes' : 'no' }, summary.adjectives[type][adj].name))
                .map(elem => elem.outerHTML)
                .join(', ')
            );
        }

        const selected_item = div_objects.querySelector('.selected');
        if (selected_item) {
            const type = selected_item.querySelector('.type')?.textContent ?? '';
            const id = selected_item.querySelector('.id')?.textContent ?? '';
            for (const adj in summary.adjectives[type]) {
                const item_class = (context[type][id].adjectives[adj] == true) ? 'yes' : ((context[type][id].adjectives[adj] == false) ? 'no' : '');
                const item = create('div', { class: item_class }, create('label', {}, summary.adjectives[type][adj].name));
                onClick(item, function () {
                    if (hasClass(item, 'yes')) { // yes -> no
                        removeClass(item, 'yes');
                        addClass(item, 'no');
                        context[type][id].adjectives[adj] = false;
                    }
                    else if (hasClass(item, 'no')) { // no -> _
                        removeClass(item, 'no');
                        delete context[type][id].adjectives[adj];
                    } else { // _ -> yes
                        addClass(item, 'yes');
                        context[type][id].adjectives[adj] = true;
                    }
                    updateDivContext(context);
                });

                div_adjectives.append(item);
            }
        }
    }

    page.append(create('div', { class: 'context' }, [div_objects, div_adjectives]));

    setDivContext(example_context);

    return page;
}
