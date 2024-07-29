import { Assistant, ContradictionError } from '../shared/assistant.js';
import { create, clear, onClick, hasClass, addClass, removeClass, setHTML, onChange } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import { formatContext, formatProof, formatStepByStepProof, formatAdjectivesDescription } from './formatter.js';
import navigation from './navigation.js';
export function pageExplore(summary, options) {
    const pageElem = create('div', { class: 'page page-explore' });
    const defaultOption = 'scheme';
    const selectElem = create('select', {}, Object.keys(summary.types).map(id => {
        const name = summary.types[id].name;
        const attr = (id == defaultOption) ? { value: id, selected: true } : { value: id };
        return create('option', attr, name);
    }));
    const aHelp = navigation.anchorPage('help', 'Help');
    aHelp.target = '_blank';
    addClass(aHelp, 'help');
    pageElem.append(create('div', { class: 'type-selection' }, [
        create('span', {}, 'I am looking for a '),
        create('label', {}, selectElem),
        aHelp
    ]));
    const objectsElem = create('div', { class: 'column-objects' });
    const adjectivesElem = create('div', { class: 'column-adjectives' });
    pageElem.append(create('div', { class: 'context' }, [objectsElem, adjectivesElem,]));
    function initializeWithContext(context) {
        clear(objectsElem);
        clear(adjectivesElem);
        for (const type in context) {
            for (const id in context[type]) {
                const item = create('div', {}, [
                    create('span', { class: 'type' }, type),
                    create('span', { class: 'id' }, id),
                    create('span', { class: 'name' }, context[type][id].name),
                    create('span', { class: 'adjectives' })
                ]);
                onClick(item, function () {
                    objectsElem.querySelectorAll('.selected').forEach(elem => removeClass(elem, 'selected'));
                    addClass(item, 'selected');
                    updateWithContext(context);
                });
                objectsElem.append(item);
            }
        }
        objectsElem.firstChild.click();
        searchButtonElem.onclick = function () { updateHistory(context, 'search'); search(summary, context, resultsElem); };
        deduceButtonElem.onclick = function () { updateHistory(context, 'deduce'); deduce(summary, context, resultsElem); };
    }
    function updateWithContext(context) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        clear(adjectivesElem);
        for (const div of objectsElem.childNodes) {
            const type = (_b = (_a = div.querySelector('.type')) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : '';
            const id = (_d = (_c = div.querySelector('.id')) === null || _c === void 0 ? void 0 : _c.textContent) !== null && _d !== void 0 ? _d : '';
            const object = context[type][id];
            setHTML(div.querySelector('.adjectives'), Object.keys(object.adjectives)
                .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
                .map(adj => create('span', { class: object.adjectives[adj] ? 'yes' : 'no' }, summary.adjectives[type][adj].name))
                .map(elem => elem.outerHTML)
                .join(', '));
        }
        katexTypeset(objectsElem);
        const selectedElem = objectsElem.querySelector('.selected');
        if (selectedElem) {
            const type = (_f = (_e = selectedElem.querySelector('.type')) === null || _e === void 0 ? void 0 : _e.textContent) !== null && _f !== void 0 ? _f : '';
            const id = (_h = (_g = selectedElem.querySelector('.id')) === null || _g === void 0 ? void 0 : _g.textContent) !== null && _h !== void 0 ? _h : '';
            const adjs = Object.keys(summary.adjectives[type]).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
            for (const adj of adjs) {
                const itemClass = (context[type][id].adjectives[adj] == true) ? 'yes' : ((context[type][id].adjectives[adj] == false) ? 'no' : '');
                const itemElem = create('div', { class: itemClass }, create('label', {}, summary.adjectives[type][adj].name));
                onClick(itemElem, function () {
                    if (hasClass(itemElem, 'yes')) {
                        removeClass(itemElem, 'yes');
                        addClass(itemElem, 'no');
                        context[type][id].adjectives[adj] = false;
                    }
                    else if (hasClass(itemElem, 'no')) {
                        removeClass(itemElem, 'no');
                        delete context[type][id].adjectives[adj];
                    }
                    else {
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
    const searchButtonElem = create('button', {}, 'Search');
    const deduceButtonElem = create('button', {}, 'Deduce');
    pageElem.append(create('div', { class: 'row-buttons' }, [
        searchButtonElem,
        deduceButtonElem
    ]));
    const resultsElem = create('div', { class: 'results' });
    pageElem.append(resultsElem);
    onChange(selectElem, function () {
        const type = selectElem.value;
        const context = summary.createContextFromType(type, type);
        initializeWithContext(context);
    });
    selectElem.dispatchEvent(new Event('change'));
    if ('q' in options) {
        const x = deserializeContext(summary, options.q);
        if (x != null) {
            const [type, context] = x;
            selectElem.value = type;
            initializeWithContext(context);
        }
    }
    if ('action' in options) {
        if (options.action == 'search')
            searchButtonElem.click();
        if (options.action == 'deduce')
            deduceButtonElem.click();
    }
    return pageElem;
}
function serializeContext(context) {
    const data = {};
    data.type = Object.keys(context).find(type => Object.keys(context[type]).some(id => id.indexOf('.') == -1));
    for (const type in context) {
        for (const id in context[type]) {
            const path = id.substring(data.type.length);
            for (const adj in context[type][id].adjectives)
                data[`${path} ${adj}`] = context[type][id].adjectives[adj];
        }
    }
    return btoa(JSON.stringify(data));
}
function deserializeContext(summary, str) {
    try {
        const data = JSON.parse(atob(str));
        const type = data.type;
        delete data.type;
        const context = summary.createContextFromType(type, type);
        const subject = context[type][type];
        for (const key in data) {
            const parts = key.split(' ');
            if (parts.length != 2)
                throw new Error(`Invalid key '${key}'`);
            const [path, adj] = parts;
            const object = summary.resolvePath(context, subject, path);
            if (typeof data[key] != 'boolean')
                throw new Error(`Invalid value for '${path}'`);
            object.adjectives[adj] = data[key];
        }
        return [type, context];
    }
    catch (err) {
        console.log(err.toString());
        return null;
    }
}
function search(summary, context, resultsElem) {
    clear(resultsElem);
    const assistant = new Assistant(summary);
    const results = assistant.search(context);
    if (results.length == 0) {
        resultsElem.append(create('p', { class: 'center' }, [
            'No examples found of ',
            formatContext(summary, context),
            '.'
        ]));
        deduce(summary, context, resultsElem, true);
    }
    else {
        resultsElem.append(create('p', { class: 'center' }, [
            'The following are examples of ',
            formatContext(summary, context),
            '.'
        ]));
        const tableElem = create('table');
        {
            const trElem = create('tr');
            for (const type in context) {
                for (const id in context[type])
                    trElem.append(create('th', {}, context[type][id].name));
            }
            tableElem.append(trElem);
        }
        for (const result of results) {
            const trElem = create('tr', {});
            for (const type in context) {
                for (const id in context[type])
                    trElem.append(create('td', {}, navigation.anchorExample(type, result[type][id].id)));
            }
            tableElem.append(trElem);
        }
        const divTableWrapper = create('div', { class: 'table-scroll-wrapper' }, tableElem);
        resultsElem.append(divTableWrapper);
    }
    katexTypeset(resultsElem);
    setTimeout(() => resultsElem.scrollIntoView({ behavior: 'smooth' }), 0);
}
function deduce(summary, context, resultsElem, onlySearchForContradiction = false) {
    var _a;
    clear(resultsElem);
    const contextCopy = structuredClone(context);
    try {
        const assistant = new Assistant(summary);
        const conclusions = assistant.deduce(contextCopy);
        if (onlySearchForContradiction)
            return;
        if (conclusions.length == 0) {
            resultsElem.append(create('p', { class: 'center' }, 'No new conclusions could be made.'));
        }
        else {
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
                    create('td', {}, (_a = formatProof(conclusion.object.type, conclusion.object.id, conclusion.object.proofs[conclusion.adjective], contextCopy)) !== null && _a !== void 0 ? _a : '')
                ]));
            }
            resultsElem.append(tableElem);
        }
    }
    catch (err) {
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
    setTimeout(() => resultsElem.scrollIntoView({ behavior: 'smooth' }), 0);
}
function updateHistory(context, action = null) {
    const url = `?page=explore&q=${serializeContext(context)}${action != null ? '&action=' + action : ''}`;
    window.history.replaceState({}, '', url);
}
