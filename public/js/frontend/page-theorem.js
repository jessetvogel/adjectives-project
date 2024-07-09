import { formatTheoremStatement } from './formatter.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
import { create, setText, hasClass, addClass, removeClass } from './util.js';
function counterexamples(summary, theorem) {
    var _a, _b;
    const type = theorem.type;
    const results = [];
    loop_examples: for (const id in summary.examples[type]) {
        const values = {};
        const subject = summary.examples[type][id];
        for (const path in theorem.conclusions) {
            values[path] = {};
            const object = summary.resolvePath(summary.examples, subject, path);
            for (const adjective in theorem.conclusions[path]) {
                const value = theorem.conclusions[path][adjective];
                if (!(adjective in object.adjectives) || object.adjectives[adjective] != value)
                    continue loop_examples;
                values[path][adjective] = value;
            }
        }
        let hasFalse = false, hasNull = false;
        for (const path in theorem.conditions) {
            const object = summary.resolvePath(summary.examples, subject, path);
            for (const adjective in theorem.conditions[path]) {
                if (!(path in values))
                    values[path] = {};
                const value = (_b = (_a = object === null || object === void 0 ? void 0 : object.adjectives) === null || _a === void 0 ? void 0 : _a[adjective]) !== null && _b !== void 0 ? _b : null;
                hasFalse || (hasFalse = value == false);
                hasNull || (hasNull = value == null);
                values[path][adjective] = value;
            }
        }
        if (hasFalse && !hasNull)
            results.push([subject, values]);
    }
    return results;
}
export function pageTheorem(summary, options) {
    const page = create('div', { class: 'page page-theorem' });
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
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
        if ('name' in data)
            setText(spanName, data.name);
        katexTypeset(spanName);
        if ('description' in data)
            setText(pDescription, data.description);
        katexTypeset(pDescription);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    const divExamples = create('div');
    const tableExamples = create('table', { class: 'hidden' });
    const counterexamples_ = counterexamples(summary, theorem);
    const columns = [];
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
//# sourceMappingURL=page-theorem.js.map