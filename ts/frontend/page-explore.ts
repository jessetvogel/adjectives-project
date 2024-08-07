import { Context, Book } from '../shared/core.js';
import { Assistant, ContradictionError } from '../shared/assistant.js';
import { create, clear, onClick, hasClass, addClass, removeClass, setHTML, onChange } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import { formatContext, formatProof, formatStepByStepProof, formatAdjectivesDescription } from './formatter.js';
import navigation from './navigation.js';

export function pageExplore(summary: Book, options: any): HTMLElement {
    const pageElem = create('div', { class: 'page page-explore' });

    // "I am looking for a <select>"
    const defaultOption = 'scheme';
    const selectElem = create('select', {}, Object.keys(summary.types).map(id => {
        const name = summary.types[id].name;
        const attr = (id == defaultOption) ? { value: id, selected: true } : { value: id };
        return create('option', attr, name);
    })) as HTMLSelectElement;
    const aHelp = navigation.anchorPage('help', 'Help') as HTMLAnchorElement;
    aHelp.target = '_blank';
    addClass(aHelp, 'help');
    pageElem.append(create('div', { class: 'type-selection' }, [
        create('span', {}, 'I am looking for a '),
        create('label', {}, selectElem),
        aHelp // .outerHTML // removes onclick
    ]));

    // column of objects and column of adjectives
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
                    // update `.selected` class
                    objectsElem.querySelectorAll('.selected').forEach(elem => removeClass(elem as HTMLElement, 'selected'))
                    addClass(item, 'selected');
                    // update overview
                    updateWithContext(context);
                });
                objectsElem.append(item);
            }
        }
        (objectsElem.firstChild as HTMLElement).click(); // select the first object

        // search and Deduce onclick handlers
        searchButtonElem.onclick = function () { updateHistory(context, 'search'); search(summary, context, resultsElem); };
        deduceButtonElem.onclick = function () { updateHistory(context, 'deduce'); deduce(summary, context, resultsElem); };
    }

    function updateWithContext(context: Context) {
        clear(adjectivesElem);

        // update adjective list after object name
        for (const div of objectsElem.childNodes as NodeListOf<HTMLElement>) {
            const type = div.querySelector('.type')?.textContent ?? '';
            const id = div.querySelector('.id')?.textContent ?? '';
            const object = context[type][id];
            setHTML(div.querySelector('.adjectives') as HTMLElement,
                Object.keys(object.adjectives)
                    .sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
                    .map(adj => create('span', { class: object.adjectives[adj] ? 'yes' : 'no' }, summary.adjectives[type][adj].name))
                    .map(elem => elem.outerHTML)
                    .join(', ')
            );
        }
        katexTypeset(objectsElem);

        // update adjectives column
        const selectedElem = objectsElem.querySelector('.selected');
        if (selectedElem) {
            const type = selectedElem.querySelector('.type')?.textContent ?? '';
            const id = selectedElem.querySelector('.id')?.textContent ?? '';
            const adjs = Object.keys(summary.adjectives[type]).sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' })); // alphabetically
            for (const adj of adjs) {
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
            katexTypeset(adjectivesElem);
        }
        updateHistory(context);
    }

    // append row of buttons and help link: " [Search] [Deduce] _Help_ "
    const searchButtonElem = create('button', {}, 'Search');
    const deduceButtonElem = create('button', {}, 'Deduce');
    pageElem.append(create('div', { class: 'row-buttons' }, [
        searchButtonElem,
        deduceButtonElem
    ]));

    // append div for results
    const resultsElem = create('div', { class: 'results' });
    pageElem.append(resultsElem);

    // if select value changes, re-initialize the context
    onChange(selectElem, function () {
        const type = selectElem.value;
        const context = summary.createContextFromType(type, type) // simply use id equal to type
        initializeWithContext(context);

    });
    selectElem.dispatchEvent(new Event('change')); // trigger initalization

    if ('q' in options) {
        const x = deserializeContext(summary, options.q);
        if (x != null) {
            const [type, context] = x;
            selectElem.value = type;
            initializeWithContext(context);
        }
    }

    if ('action' in options) {
        if (options.action == 'search') searchButtonElem.click();
        if (options.action == 'deduce') deduceButtonElem.click();
    }

    return pageElem;
}

function serializeContext(context: Context): string {
    const data: any = {};
    /* 
     * {
     *   type: "morphism",
     *   " affine": true,
     *   ".source affine": false
     * }
     */

    data.type = Object.keys(context).find(type => Object.keys(context[type]).some(id => id.indexOf('.') == -1)); // subject is the object in the context whose id does not contain a period
    for (const type in context) {
        for (const id in context[type]) {
            const path = id.substring(data.type.length);
            for (const adj in context[type][id].adjectives)
                data[`${path} ${adj}`] = context[type][id].adjectives[adj];
        }
    }

    return btoa(JSON.stringify(data));
}

function deserializeContext(summary: Book, str: string): [string, Context] | null {
    try {
        const data: any = JSON.parse(atob(str));
        const type = data.type;
        delete data.type; // for convenience
        const context = summary.createContextFromType(type, type);
        const subject = context[type][type];
        for (const key in data) {
            const parts = key.split(' ');
            if (parts.length != 2) throw new Error(`Invalid key '${key}'`);
            const [path, adj] = parts;
            const object = summary.resolvePath(context, subject, path);
            if (typeof data[key] != 'boolean') throw new Error(`Invalid value for '${path}'`);
            object.adjectives[adj] = data[key];
        }
        return [type, context];
    } catch (err: any) {
        console.log(`${err}`);
        return null;
    }
}

function search(summary: Book, context: Context, resultsElem: HTMLElement): void {
    clear(resultsElem);
    const assistant = new Assistant(summary);
    const results = assistant.search(context);

    if (results.length == 0) {
        resultsElem.append(create('p', { class: 'center' }, [
            'No examples found of ',
            formatContext(summary, context),
            '.'
        ]));

        // look for contradiction and overwrite resultsElem if there is one
        deduce(summary, context, resultsElem, true);
    }
    else {
        // the following are examples of {{ a ${type} which is [...], and whose source is [...], and whose target is [...] }}.
        resultsElem.append(create('p', { class: 'center' }, [
            'The following are examples of ',
            formatContext(summary, context),
            '.'
        ]));

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
        const divTableWrapper = create('div', { class: 'table-scroll-wrapper' }, tableElem); // wrap table so that we can scroll horizontally if needed
        resultsElem.append(divTableWrapper);
    }

    katexTypeset(resultsElem);

    // scroll into view
    setTimeout(() => resultsElem.scrollIntoView({ behavior: 'smooth' }), 0);
}

function deduce(summary: Book, context: Context, resultsElem: HTMLElement, onlySearchForContradiction: boolean = false): void {
    clear(resultsElem);

    const contextCopy = structuredClone(context); // NOTE: the conclusions must not pollute the original context
    try {
        const assistant = new Assistant(summary);
        const conclusions = assistant.deduce(contextCopy);

        if (onlySearchForContradiction) return;

        if (conclusions.length == 0) {
            resultsElem.append(create('p', { class: 'center' }, 'No new conclusions could be made.'));
        }
        else {
            // given {{a ${type} which is [...], and whose source is [...], and whose target is [...]}}, the following conclusions hold.
            resultsElem.append(create('p', { class: 'center' }, [
                'The following conclusions follow from ',
                formatContext(summary, context),
                '.'
            ]));

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
                    create('td', {}, formatProof(conclusion.object.type, conclusion.object.id, conclusion.object.proofs[conclusion.adjective], contextCopy) ?? '')
                ]));
            }
            resultsElem.append(tableElem);
        }
    }
    catch (err: any) {
        if (err instanceof ContradictionError) {
            resultsElem.append(create('span', { class: 'title' }, 'Contradiction!'));
            resultsElem.append(create('p', { class: 'center' }, [
                'There does not exist ',
                formatContext(summary, context),
                ', because of the following contradictory facts:'
            ]));
            const object = err.conclusion.object;
            resultsElem.append(create('div', { style: 'max-width: 800px;' }, [
                create('ol', {}, [
                    create('li', {}, [
                        'Such a ', object.name, ' ',
                        formatAdjectivesDescription(summary, object.type, { [err.conclusion.adjective]: object.adjectives[err.conclusion.adjective] }),
                        ' by ',
                        formatStepByStepProof(summary.traceProof(contextCopy, object, err.conclusion.adjective))
                    ]),
                    create('li', {}, [
                        'Such a ', object.name, ' ',
                        formatAdjectivesDescription(summary, object.type, { [err.conclusion.adjective]: !object.adjectives[err.conclusion.adjective] }),
                        ' by ',
                        formatStepByStepProof(summary.traceProof(contextCopy, object, err.conclusion.adjective, err.proof))
                    ])
                ])
            ]));
        }
    }

    katexTypeset(resultsElem);

    // scroll into view
    setTimeout(() => resultsElem.scrollIntoView({ behavior: 'smooth' }), 0);
}

function updateHistory(context: Context, action: 'search' | 'deduce' | null = null): void {
    const url = `?page=explore&q=${serializeContext(context)}${action != null ? '&action=' + action : ''}`;
    window.history.replaceState({}, '', url);
}
