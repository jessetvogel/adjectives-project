import { Context, Book, Proof } from '../shared/core.js';
import { Assistant } from '../shared/assistant.js';
import { create, clear, onClick, $$, hasClass, addClass, removeClass, setHTML, onChange } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';

function sentenceFromProof(summary: Book, context: Context, proof: string | Proof): string {
    if (proof === undefined)
        return '';

    if (typeof proof == 'string')
        return proof;

    return `By ${navigation.anchorTheorem(proof.type, proof.theorem).outerHTML} applied to ${context[proof.type][proof.subject].name}.`;
}

function contextFromType(summary: Book, type: string): Context {
    const context: Context = {};
    function addType(type: string, id: string, name: string): void {
        if (!(type in context)) context[type] = {};
        const args: { [id: string]: string } = {};
        for (const [arg, argType] of Object.entries(summary.types[type].parameters)) {
            const argId = id + '.' + arg;
            addType(argType, argId, arg);
            args[arg] = argId;
        }
        context[type][id] = { id, type, name, args, adjectives: {}, proofs: {} };
    }
    addType(type, type, summary.types[type].name);
    return context;
}

function search(summary: Book, context: Context, resultsElem: HTMLElement): void {
    clear(resultsElem);
    const assistant = new Assistant(summary);
    const results = assistant.search(context);

    if (results.length == 0) {
        resultsElem.append(create('p', {}, 'No results found.'));
    }
    else {
        resultsElem.append(create('p', {}, 'The following examples match your assumptions (TODO: spell out what they satisfy).'));

        const tableElem = create('table');
        { // table header
            const trElem = create('tr');
            for (const type in context) {
                for (const id in context[type])
                    trElem.append(create('th', {}, context[type][id].name));
            }
            tableElem.append(trElem);
        }
        for (const result of results) { // table rows
            const trElem = create('tr', {},);
            for (const type in context) {
                for (const id in context[type])
                    trElem.append(create('td', {}, navigation.anchorExample(type, result[type][id].id)));
            }
            tableElem.append(trElem);
        }
        resultsElem.append(tableElem);

        katexTypeset(resultsElem);
    }

    // scroll into view
    resultsElem.scrollIntoView({ behavior: 'smooth' });
}

function deduce(summary: Book, context: Context, resultsElem: HTMLElement): void {
    clear(resultsElem);

    const assistant = new Assistant(summary);
    const conclusions = assistant.deduce(context);

    if (conclusions.length == 0) {
        resultsElem.append(create('p', {}, 'No new conclusions could be made.'));
    }
    else {
        resultsElem.append(create('p', {}, 'The following conclusions follow from your assumptions. (TODO: spell out what they satisfy)'));

        const tableElem = create('table');
        tableElem.append(create('tr', {}, [
            create('th', {}, 'Conclusion'),
            create('th', {}, 'Proof')
        ]));
        for (const conclusion of conclusions) {
            tableElem.append(create('tr', {}, [
                create('td', {}, [
                    `${conclusion.object.name} ${conclusion.value ? 'is' : 'is not'} `,
                    navigation.anchorAdjective(conclusion.object.type, conclusion.adjective)
                ]),
                create('td', {}, sentenceFromProof(summary, context, conclusion.object.proofs[conclusion.adjective]))
            ]));
        }
        resultsElem.append(tableElem);
    }

    // scroll into view
    resultsElem.scrollIntoView({ behavior: 'smooth' });
}


export function pageExplore(summary: Book, options: any): HTMLElement {
    const pageElem = create('div', { class: 'page page-explore' });

    // "I am looking for a <select>"
    const selectElem = create('select', {}, Object.keys(summary.types).map(id => create('option', { value: id }, summary.types[id].name))) as HTMLSelectElement;
    pageElem.append(create('div', { class: 'type-selection' }, [
        create('span', {}, 'I am looking for a '),
        selectElem
    ]));

    // Column of objects and column of adjectives
    const objectsElem = create('div', { class: 'column-objects' });
    const adjectivesElem = create('div', { class: 'column-adjectives' });
    pageElem.append(create('div', { class: 'context' }, [objectsElem, adjectivesElem,]));

    function initializeWithContext(context: Context) {
        clear(objectsElem);
        clear(adjectivesElem);
        for (const type in context) { // TODO: fix order (do not rely on browser specifications..)
            for (const id in context[type]) {
                const item = create('div', {}, [
                    create('span', { class: 'type' }, type), // NOTE: has display:hidden
                    create('span', { class: 'id' }, id), // NOTE: has display:hidden
                    create('span', { class: 'name' }, context[type][id].name),
                    create('span', { class: 'adjectives' })
                ]);
                onClick(item, function () {
                    // Update `.selected` class
                    objectsElem.querySelectorAll('.selected').forEach(elem => removeClass(elem as HTMLElement, 'selected'))
                    addClass(item, 'selected');
                    // Update overview
                    updateWithContext(context);
                });
                objectsElem.append(item);
            }
        }
        (objectsElem.firstChild as HTMLElement).click(); // select the first object
    }

    function updateWithContext(context: Context) {
        clear(adjectivesElem);

        // Update adjective list after object name
        for (const div of objectsElem.childNodes as NodeListOf<HTMLElement>) {
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

        // Update adjectives column
        const selectedElem = objectsElem.querySelector('.selected');
        if (selectedElem) {
            const type = selectedElem.querySelector('.type')?.textContent ?? '';
            const id = selectedElem.querySelector('.id')?.textContent ?? '';
            for (const adj in summary.adjectives[type]) {
                const itemClass = (context[type][id].adjectives[adj] == true) ? 'yes' : ((context[type][id].adjectives[adj] == false) ? 'no' : '');
                const itemElem = create('div', { class: itemClass }, create('label', {}, summary.adjectives[type][adj].name));
                onClick(itemElem, function () {
                    if (hasClass(itemElem, 'yes')) { // yes -> no
                        removeClass(itemElem, 'yes');
                        addClass(itemElem, 'no');
                        context[type][id].adjectives[adj] = false;
                    }
                    else if (hasClass(itemElem, 'no')) { // no -> _
                        removeClass(itemElem, 'no');
                        delete context[type][id].adjectives[adj];
                    } else { // _ -> yes
                        addClass(itemElem, 'yes');
                        context[type][id].adjectives[adj] = true;
                    }
                    updateWithContext(context);
                });
                adjectivesElem.append(itemElem);
            }
        }
    }

    // Append row of buttons and help link: " [Search] [Deduce] _Help_ "
    const searchButtonElem = create('button', {}, 'Search');
    const deduceButtonElem = create('button', {}, 'Deduce');
    pageElem.append(create('div', { class: 'row-buttons' }, [
        searchButtonElem,
        deduceButtonElem,
        create('a', {}, 'Help (TODO)')
    ]));

    // Append div for results
    const resultsElem = create('div', { class: 'results' });
    pageElem.append(resultsElem);

    // Search functionality
    onChange(selectElem, function () {
        const context = contextFromType(summary, selectElem.value)
        initializeWithContext(context);
        searchButtonElem.onclick = function () { search(summary, context, resultsElem); };
        deduceButtonElem.onclick = function () { deduce(summary, context, resultsElem); };
    });

    selectElem.dispatchEvent(new Event('change')); // to initialize the view

    return pageElem;
}
