import { formatTheoremStatement } from './formatter.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
import { create, setText } from './util.js';
// Find examples which satisfy the theorem conclusion, but not the theorem conditions
function counterexamples(summary, theorem) {
    var _a, _b;
    const type = theorem.type;
    const results = [];
    for (const id in summary.examples[type]) {
        const subject = summary.examples[type][id];
        const object = summary.resolvePath(summary.examples, subject, theorem.conclusion.path);
        if (object == null)
            throw new Error(`Could not resolve '${theorem.conclusion.path}'`);
        if (!(theorem.conclusion.adjective in object.adjectives) || object.adjectives[theorem.conclusion.adjective] != theorem.conclusion.value)
            continue; // if theorem conclusion does not apply, continue
        // Check theorem conditions
        let hasFalse = false, hasNull = false;
        const values = {};
        values[theorem.conclusion.path] = { [theorem.conclusion.adjective]: theorem.conclusion.value };
        for (const path in theorem.conditions) {
            const object = summary.resolvePath(summary.examples, subject, path);
            if (object == null)
                throw new Error(`Could not resolve '${path}'`);
            for (const adj in theorem.conditions[path]) {
                if (!(path in values))
                    values[path] = {};
                const value = (_b = (_a = object === null || object === void 0 ? void 0 : object.adjectives) === null || _a === void 0 ? void 0 : _a[adj]) !== null && _b !== void 0 ? _b : null;
                hasFalse || (hasFalse = value == false);
                hasNull || (hasNull = value == null);
                values[path][adj] = value;
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
        // Update name span
        if ('name' in data)
            setText(spanName, data.name);
        katexTypeset(spanName);
        // Update description paragraph
        if ('description' in data)
            setText(pDescription, data.description);
        katexTypeset(pDescription);
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
    // TABLE OF THEOREMS TO PROVE THE CONVERSE OF THE THEOREM
    // TODO
    // TABLE OF COUNTEREXAMPLES TO THE CONVERSE OF THE THEOREM
    const divCounterexamples = create('div', { class: 'counterexamples' });
    const counterexamples_ = counterexamples(summary, theorem);
    if (counterexamples_.length > 0) {
        divCounterexamples.append(create('p', {}, 'The converse statement does not hold, as can be seen from the following counterexamples.'));
        const tableCounterexamples = create('table');
        const columns = []; // array of adjectives and paths corresponding to the columns of the table
        columns.push({ path: theorem.conclusion.path, adjective: theorem.conclusion.adjective });
        for (const path in theorem.conditions)
            for (const adjective in theorem.conditions[path])
                columns.push({ path, adjective });
        tableCounterexamples.append(create('tr', {}, [
            create('th', {}, 'Counterexample'),
            ...columns.map(x => {
                const adjType = summary.resolvePathType(theorem.type, x.path);
                if (adjType == null)
                    throw new Error(`Could not resolve '${x.path}' on type '${theorem.type}'`);
                const adjName = summary.adjectives[adjType][x.adjective].name;
                return create('th', {}, `${x.path.substring(1)} ${adjName}`);
            })
        ]));
        for (const [example, values] of counterexamples_) {
            tableCounterexamples.append(create('tr', {}, [
                create('td', {}, navigation.anchorExample(example.type, example.id)),
                ...columns.map(x => create('td', {}, values[x.path][x.adjective] ? 'true' : 'false'))
            ]));
        }
        divCounterexamples.append(tableCounterexamples);
        katexTypeset(tableCounterexamples);
    }
    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pStatement,
        pDescription,
        divCounterexamples
    ]);
    return page;
}
//# sourceMappingURL=page-theorem.js.map