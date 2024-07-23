import { Assistant, ContradictionError, Matcher } from '../shared/assistant.js';
import { formatContext } from './formatter.js';
import { create } from './util.js';
const ADJECTIVES_CONSTRAINTS = {
    'scheme': {
        'cohen-macaulay': [],
        'connected': [true],
        'excellent': [],
        'jacobson': [],
        'reduced': [true],
    },
    'morphism': {}
};
function combinations(array, size) {
    const result = [];
    function p(tuple, i) {
        if (tuple.length === size) {
            result.push(tuple);
            return;
        }
        if (i + 1 > array.length)
            return;
        p(tuple.concat(array[i]), i + 1);
        p(tuple, i + 1);
    }
    p([], 0);
    return result;
}
function product(array, size) {
    if (size == 0)
        return [[]];
    const results = [];
    for (const tuple of product(array, size - 1)) {
        for (const t of array)
            results.push(tuple.concat(t));
    }
    return results;
}
function questions(summary, type, constraints) {
    const adjectives = Object.keys(summary.adjectives[type]);
    const maxAdjectives = 2;
    const assistant = new Assistant(summary);
    const questions = [];
    const questionsDeduced = [];
    const id = 'X';
    for (let n = 1; n <= maxAdjectives; ++n) {
        for (const adjs of combinations(adjectives, n)) {
            for (const values of product([true, false], n)) {
                if (adjs.some((adj, i) => (adj in constraints && !constraints[adj].includes(values[i]))))
                    continue;
                if (!values.some(v => v))
                    continue;
                const context = summary.createContextFromType(type, id);
                for (let i = 0; i < n; ++i)
                    context[type][id].adjectives[adjs[i]] = values[i];
                const results = assistant.search(context);
                let contradiction = false;
                const contextClone = structuredClone(context);
                try {
                    assistant.deduce(contextClone);
                }
                catch (err) {
                    if (!(err instanceof ContradictionError))
                        throw err;
                    contradiction = true;
                }
                if (results.length == 0 && !contradiction) {
                    questions.push(context);
                    questionsDeduced.push(contextClone);
                }
            }
        }
    }
    for (let i = 0; i < questions.length; ++i) {
        for (let j = 0; j < questions.length; ++j) {
            if (i == j)
                continue;
            const A = questionsDeduced[i];
            const B = questions[j];
            const matcher = new Matcher(summary, B, A);
            if (matcher.match(B[type][id], A[type][id])) {
                questions.splice(j, 1);
                questionsDeduced.splice(j, 1);
                --j;
                if (i > j)
                    --i;
            }
        }
    }
    return questions;
}
function shuffle(array) {
    let index = array.length;
    while (index != 0) {
        const i = Math.floor(Math.random() * index);
        index--;
        [array[index], array[i]] = [array[i], array[index]];
    }
}
export function pageQuestions(summary) {
    const page = create('div', { class: 'page page-questions' });
    page.append(create('span', { class: 'title' }, 'Questions'));
    page.append(create('p', {}, 'The questions below could not be answered with \'yes\' by the examples, or with \'no\' using the theorems.'));
    const loading = create('div', { class: 'loading' });
    page.append(loading);
    const table = create('table', { style: 'margin-bottom: 4px;' });
    page.append(table);
    setTimeout(() => {
        table.append(create('tr', {}, create('th', {}, 'Questions')));
        const qs = [];
        for (const type in ADJECTIVES_CONSTRAINTS)
            qs.push(...questions(summary, type, ADJECTIVES_CONSTRAINTS[type]));
        console.log(`#questions = ${qs.length}`);
        shuffle(qs);
        let i = 0;
        const maxQuestions = 25;
        for (const question of qs) {
            if (++i > maxQuestions)
                break;
            table.append(create('tr', {}, [
                create('td', {}, [
                    create('span', {}, [
                        'Does there exist ',
                        formatContext(summary, question),
                        '?'
                    ])
                ])
            ]));
        }
        loading.remove();
    }, 0);
    return page;
}
