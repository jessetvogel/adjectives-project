import { Book, Theorem, Example, TheoremConditions } from '../shared/core.js';
import { formatTheoremStatement } from './formatter.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
import { create, setText, hasClass, addClass, removeClass } from './util.js';

// Find examples which satisfy the theorem conclusion, but not the theorem conditions
function counterexamples(summary: Book, theorem: Theorem): [Example, TheoremConditions][] {
    const type = theorem.type;
    const results: [Example, TheoremConditions][] = [];
    loop_examples: for (const id in summary.examples[type]) {
        const values: TheoremConditions = {};
        const subject = summary.examples[type][id];
        for (const path in theorem.conclusions) {
            values[path] = {};
            const object = summary.resolvePath(summary.examples, subject, path);
            if (object == null) throw new Error(`Could not resolve '${path}'`);
            for (const adjective in theorem.conclusions[path]) {
                const value = theorem.conclusions[path][adjective];
                if (!(adjective in object.adjectives) || object.adjectives[adjective] != value)
                    continue loop_examples; // if theorem conclusion does not apply, continue
                values[path][adjective] = value;
            }
        }

        // check theorem conditions
        let hasFalse = false, hasNull = false;
        for (const path in theorem.conditions) {
            const object = summary.resolvePath(summary.examples, subject, path);
            if (object == null) throw new Error(`Could not resolve '${path}'`);
            for (const adjective in theorem.conditions[path]) {
                if (!(path in values)) values[path] = {};
                const value = object?.adjectives?.[adjective] ?? null;
                hasFalse ||= (value == false);
                hasNull ||= (value == null);
                values[path][adjective] = value;
            }
        }
        if (hasFalse && !hasNull)
            results.push([subject, values]);
    }
    return results;
}

export function pageTheorem(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-theorem' });

    const type = options?.type;
    const id = options?.id;
    if (type === undefined || id === undefined || !(type in summary.theorems) || !(id in summary.theorems[type])) {
        page.append(create('span', { class: 'title' }, `🥺 Theorem not found..`));
        return page;
    }

    const theorem = summary.theorems[type][id];

    const spanName = create('span', {}, '');
    const spanSubtitle = create('span', { class: 'subtitle' }, ` (${summary.types[type].name} theorem)`);
    const pStatement = create('p', { class: 'statement' }, formatTheoremStatement(summary, theorem));
    const pDescription = create('p', { class: 'description' }, '');

    katexTypeset(pStatement);

    fetch(`json/theorems/${type}/${id}.json`).then(response => response.json()).then(data => {
        // Update name span
        if ('name' in data) setText(spanName, data.name);
        katexTypeset(spanName);

        // Update description paragraph
        if ('description' in data) setText(pDescription, data.description);
        katexTypeset(pDescription);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    // TABLE OF COUNTEREXAMPLES TO THE CONVERSE OF THE THEOREM
    const divExamples = create('div');
    const tableExamples = create('table', { class: 'hidden' });
    const counterexamples_ = counterexamples(summary, theorem);
    // divExamples.append(create('p', {}, 'The converse statement does not hold, as can be seen from the following counterexamples.'));
    const columns: { path: string, adjective: string }[] = []; // array of adjectives and paths corresponding to the columns of the table
    for (const path in theorem.conclusions)
        for (const adjective in theorem.conclusions[path])
            columns.push({ path, adjective });
    for (const path in theorem.conditions)
        for (const adjective in theorem.conditions[path])
            columns.push({ path, adjective });
    tableExamples.append(create('tr', {}, [
        create('th', {}, 'Counterexample'),
        ...columns.map(x => {
            const adjType = summary.resolvePathType(theorem.type, x.path);
            if (adjType == null) throw new Error(`Could not resolve '${x.path}' on type '${theorem.type}'`);
            const adjName = summary.adjectives[adjType][x.adjective].name;
            return create('th', {}, `${x.path.substring(1)} ${adjName}`);
        })
    ]));
    for (const [example, values] of counterexamples_) {
        tableExamples.append(create('tr', {}, [
            create('td', {}, navigation.anchorExample(example.type, example.id)),
            ...columns.map(x => {
                const value = values[x.path][x.adjective] ? 'true' : 'false';
                return create('td', { class: value }, value);
            })
        ]));
    }
    const buttonExamples = create('button', {
        '@click': () => {
            if (hasClass(tableExamples, 'hidden')) {
                removeClass(tableExamples, 'hidden');
                setText(buttonExamples, 'Hide counterexamples for converse statement');
            }
            else {
                addClass(tableExamples, 'hidden');
                setText(buttonExamples, 'Show counterexamples for converse statement');
            }
        }
    }, 'Show counterexamples for converse statement');
    divExamples.append(create('div', { class: 'row-buttons' }, buttonExamples));
    divExamples.append(tableExamples);
    katexTypeset(tableExamples);

    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pStatement,
        pDescription
    ]);

    if (counterexamples_.length > 0)
        page.append(divExamples);

    return page;
}
