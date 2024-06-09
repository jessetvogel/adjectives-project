import { Assistant, ContradictionError, Matcher } from '../shared/assistant.js';
import { formatContext } from './formatter.js';
import { create } from './util.js';
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
function questions(summary, type) {
    const adjectives = Object.keys(summary.adjectives[type]);
    const maxAdjectives = 2;
    const assistant = new Assistant(summary);
    const questions = []; // contains the original questions
    const questionsDeduced = []; // contains the deduced contexts
    const id = 'X'; // dummy name
    // GENERATE QUESTIONS
    for (let n = 1; n <= maxAdjectives; ++n) { // loop over number of adjectives
        for (const adjs of combinations(adjectives, n)) { // loop over all combinations of adjectives
            for (const values of product([true, false], n)) { // loop over all values of the adjectives
                const context = summary.createContextFromType(type, id); // create context for type
                for (let i = 0; i < n; ++i) // assign the adjectives their values
                    context[type][id].adjectives[adjs[i]] = values[i];
                const results = assistant.search(context); // search for examples
                let contradiction = false; // deduce on context, and see if there is a contradiction
                const contextClone = structuredClone(context);
                try {
                    assistant.deduce(contextClone);
                }
                catch (err) {
                    if (!(err instanceof ContradictionError))
                        throw err;
                    contradiction = true;
                }
                if (results.length == 0 && !contradiction) { // if there are no results and no contradiction ...
                    questions.push(context); // ... then this is a good question
                    questionsDeduced.push(contextClone);
                }
            }
        }
    }
    // FILTER QUESTIONS (IF A => B, THEN WE MAY AS WELL OMIT B)
    for (let i = 0; i < questions.length; ++i) {
        for (let j = 0; j < questions.length; ++j) {
            if (i == j)
                continue;
            const A = questionsDeduced[i];
            const B = questions[j]; // use this so that we need to check fewer conditions
            const matcher = new Matcher(summary, B, A);
            if (matcher.match(B[type][id], A[type][id])) { // check if A => B
                questions.splice(j, 1); // remove B
                questionsDeduced.splice(j, 1); // remove B
                --j; // shift j one back
                if (i > j)
                    --i; // shift i one back if i > j
            }
        }
    }
    return questions;
}
export function pageQuestions(summary) {
    const page = create('div', { class: 'page page-questions' });
    // title
    page.append(create('span', { class: 'title' }, 'Questions'));
    // description
    page.append(create('p', {}, 'The questions below could not be answered with \'yes\' by the examples, or with \'no\' using the theorems.'));
    // table
    const table = create('table');
    table.append(create('tr', {}, create('th', {}, 'Questions')));
    const qs = [];
    qs.push(...questions(summary, 'scheme'));
    qs.push(...questions(summary, 'morphism'));
    let i = 0;
    const maxQuestions = 20;
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
    page.append(table);
    return page;
}
//# sourceMappingURL=page-questions.js.map