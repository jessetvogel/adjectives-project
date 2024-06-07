import { Assistant, ContradictionError } from '../shared/assistant.js';
import { create, clear, onClick, hasClass, addClass, removeClass, setHTML, onChange } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
function formatProof(summary, context, proof) {
    if (proof === undefined)
        return null;
    if (typeof proof == 'string')
        return create('span', {}, proof);
    return create('span', {}, [
        'By ',
        navigation.anchorTheorem(proof.type, proof.theorem),
        ' applied to ',
        context[proof.type][proof.subject].name,
        '.'
    ]);
}
function search(summary, context, resultsElem) {
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
            const trElem = create('tr', {});
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
function deduce(summary, context, resultsElem) {
    var _a;
    clear(resultsElem);
    try {
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
                    create('td', {}, (_a = formatProof(summary, context, conclusion.object.proofs[conclusion.adjective])) !== null && _a !== void 0 ? _a : '')
                ]));
            }
            resultsElem.append(tableElem);
        }
    }
    catch (err) {
        if (err instanceof ContradictionError) {
            resultsElem.append(create('span', { class: 'title' }, 'Contradiction!'));
            resultsElem.append(create('p', {}, 'A contradiction follows from your assumptions. (TODO: give some details)'));
        }
    }
    // scroll into view
    resultsElem.scrollIntoView({ behavior: 'smooth' });
}
export function pageExplore(summary, options) {
    const pageElem = create('div', { class: 'page page-explore' });
    // "I am looking for a <select>"
    const defaultOption = 'scheme';
    const selectElem = create('select', {}, Object.keys(summary.types).map(id => {
        const name = summary.types[id].name;
        const attr = (id == defaultOption) ? { value: id, selected: true } : { value: id };
        return create('option', attr, name);
    }));
    pageElem.append(create('div', { class: 'type-selection' }, [
        create('span', {}, 'I am looking for a '),
        selectElem,
        create('a', { class: 'help' }, 'Help')
    ]));
    // Column of objects and column of adjectives
    const objectsElem = create('div', { class: 'column-objects' });
    const adjectivesElem = create('div', { class: 'column-adjectives' });
    pageElem.append(create('div', { class: 'context' }, [objectsElem, adjectivesElem,]));
    function initializeWithContext(context) {
        clear(objectsElem);
        clear(adjectivesElem);
        for (const type in context) { // TODO: fix order (do not rely on browser specifications..)
            for (const id in context[type]) {
                const item = create('div', {}, [
                    create('span', { class: 'type' }, type),
                    create('span', { class: 'id' }, id),
                    create('span', { class: 'name' }, context[type][id].name),
                    create('span', { class: 'adjectives' })
                ]);
                onClick(item, function () {
                    // Update `.selected` class
                    objectsElem.querySelectorAll('.selected').forEach(elem => removeClass(elem, 'selected'));
                    addClass(item, 'selected');
                    // Update overview
                    updateWithContext(context);
                });
                objectsElem.append(item);
            }
        }
        objectsElem.firstChild.click(); // select the first object
    }
    function updateWithContext(context) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        clear(adjectivesElem);
        // Update adjective list after object name
        for (const div of objectsElem.childNodes) {
            const type = (_b = (_a = div.querySelector('.type')) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : '';
            const id = (_d = (_c = div.querySelector('.id')) === null || _c === void 0 ? void 0 : _c.textContent) !== null && _d !== void 0 ? _d : '';
            const object = context[type][id];
            setHTML(div.querySelector('.adjectives'), Object
                .keys(object.adjectives)
                .map(adj => create('span', { class: object.adjectives[adj] ? 'yes' : 'no' }, summary.adjectives[type][adj].name))
                .map(elem => elem.outerHTML)
                .join(', '));
        }
        // Update adjectives column
        const selectedElem = objectsElem.querySelector('.selected');
        if (selectedElem) {
            const type = (_f = (_e = selectedElem.querySelector('.type')) === null || _e === void 0 ? void 0 : _e.textContent) !== null && _f !== void 0 ? _f : '';
            const id = (_h = (_g = selectedElem.querySelector('.id')) === null || _g === void 0 ? void 0 : _g.textContent) !== null && _h !== void 0 ? _h : '';
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
                    }
                    else { // _ -> yes
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
        deduceButtonElem
    ]));
    // Append div for results
    const resultsElem = create('div', { class: 'results' });
    pageElem.append(resultsElem);
    // Search functionality
    onChange(selectElem, function () {
        const type = selectElem.value;
        const context = summary.createContextFromType(type, type); // simply use id equal to type
        initializeWithContext(context);
        searchButtonElem.onclick = function () { search(summary, context, resultsElem); };
        deduceButtonElem.onclick = function () { deduce(summary, context, resultsElem); };
    });
    selectElem.dispatchEvent(new Event('change')); // to initialize the view
    return pageElem;
}
//# sourceMappingURL=page-explore.js.map