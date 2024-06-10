import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
import { create, setText } from './util.js';
function formatTheoremStatement(summary, theorem) {
    const statement = [];
    // given
    statement.push(`Let $${theorem.subject}$ be a `, navigation.anchorType(theorem.type), '. ');
    function wordFromPath(path) {
        if (path == '')
            return `$${theorem.subject}$`;
        if (!path.startsWith('.'))
            return path;
        const i = path.lastIndexOf('.');
        return `the ${path.substring(i + 1)} of ${wordFromPath(path.substring(0, i))}`;
    }
    // conditions
    const numberOfConditions = Object.values(theorem.conditions).map(adj => Object.keys(adj).length).reduce((partial, n) => partial + n);
    let conditionsCount = 0;
    statement.push('Suppose that ');
    for (const path in theorem.conditions) {
        for (const adj in theorem.conditions[path]) {
            const conditionObjectType = summary.resolvePathType(theorem.type, path);
            if (conditionObjectType == null)
                throw new Error(`Could not resolve path '${path}' starting from type '${theorem.type}'`);
            const value = theorem.conditions[path][adj];
            if (numberOfConditions > 1 && conditionsCount > 0 && conditionsCount < numberOfConditions - 1)
                statement.push(', ');
            if (numberOfConditions > 1 && conditionsCount == numberOfConditions - 1)
                statement.push(' and that ');
            statement.push(`${wordFromPath(path)} ${value ? 'is' : 'is not'} `, navigation.anchorAdjective(conditionObjectType, adj));
            ++conditionsCount;
        }
    }
    statement.push('. ');
    // conclusion
    const conclusionObjectType = summary.resolvePathType(theorem.type, theorem.conclusion.path);
    if (conclusionObjectType == null)
        throw new Error(`Could not resolve path '${theorem.conclusion.path}' starting from type '${theorem.type}'`);
    statement.push(`Then ${wordFromPath(theorem.conclusion.path)} ${theorem.conclusion.value ? 'is' : 'is not'} `, navigation.anchorAdjective(conclusionObjectType, theorem.conclusion.adjective), '.');
    return create('span', {}, statement);
}
export function pageTheorem(summary, options) {
    const page = create('div', { class: 'page page-theorem' });
    const type = options === null || options === void 0 ? void 0 : options.type;
    const id = options === null || options === void 0 ? void 0 : options.id;
    if (type === undefined || id === undefined || !(type in summary.theorems) || !(id in summary.theorems[type])) {
        page.append(create('span', { class: 'title' }, `🥺 Theorem not found..`));
        return page;
    }
    const spanName = create('span', {}, '');
    const spanSubtitle = create('span', { class: 'subtitle' }, ` (${summary.types[type].name} theorem)`);
    const pStatement = create('p', { class: 'statement' }, formatTheoremStatement(summary, summary.theorems[type][id]));
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
    page.append(...[
        create('span', { class: 'title' }, [
            // create('span', { class: 'comment' }, `Theorem `),
            spanName,
            spanSubtitle
        ]),
        pStatement,
        pDescription
    ]);
    return page;
}
//# sourceMappingURL=page-theorem.js.map