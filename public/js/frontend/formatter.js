import navigation from './navigation.js';
import { create } from './util.js';
export function formatContext(summary, context) {
    const span = create('span');
    const type = Object.keys(context).find(type => Object.keys(context[type]).some(id => id.indexOf('.') == -1));
    if (type === undefined) {
        span.append('the given assumptions');
        return span;
    }
    const id = Object.keys(context[type])[0];
    span.append(`a ${summary.types[type].name}`);
    let first = true;
    if (Object.keys(context[type][id].adjectives).length > 0) {
        span.append(' which ', formatAdjectivesDescription(summary, type, context[type][id].adjectives));
        first = false;
    }
    for (const arg in context[type][id].args) {
        const argId = context[type][id].args[arg];
        const argType = summary.types[type].parameters[arg];
        if (Object.keys(context[argType][argId].adjectives).length > 0) {
            span.append(first ? '' : ', and ', 'whose ', arg, ' ');
            span.append(formatAdjectivesDescription(summary, argType, context[argType][argId].adjectives));
            first = false;
        }
    }
    return span;
}
function formatFromPath(theorem, path) {
    if (path == '')
        return `$${theorem.subject}$`;
    if (!path.startsWith('.'))
        return path;
    const i = path.lastIndexOf('.');
    return `the ${path.substring(i + 1)} of ${formatFromPath(theorem, path.substring(0, i))}`;
}
export function formatProof(type, id, proof, context) {
    if (proof === undefined)
        return null;
    if (typeof proof == 'string')
        return create('span', {}, proof);
    const span = create('span');
    span.append('By ', proof.negated ? 'the negation of ' : '', navigation.anchorTheorem(proof.type, proof.theorem));
    if (proof.type != type || proof.subject != id) {
        span.append(' applied to ');
        span.append((context === undefined)
            ? navigation.anchorExample(proof.type, proof.subject)
            : context[proof.type][proof.subject].name);
    }
    span.append('.');
    return span;
}
export function formatStepByStepProof(steps) {
    const items = [];
    for (const step of steps)
        items.push(['applying ', step.negated ? 'the negation of ' : '', navigation.anchorTheorem(step.type, step.theorem), ' to the ', step.subject]);
    for (let i = 0; i < items.length; ++i)
        items[i].push((i < items.length - 1) ? ',' : '.');
    if (steps.length == 0)
        return create('span', {}, 'assumption.');
    if (steps.length == 1)
        return create('span', {}, items[0]);
    return create('ol', {}, items.map(item => create('li', {}, item)));
}
export function formatAdjectivesDescription(summary, type, adjectives) {
    var _a;
    const span = create('span');
    const total = Object.keys(adjectives).length;
    let count = 0;
    for (const id in adjectives) {
        if (total > 1 && count > 0 && count < total - 1)
            span.append(', ');
        if (total > 1 && count == total - 1)
            span.append(' and ');
        const adjective = summary.adjectives[type][id];
        const value = adjectives[id];
        const verbs = (_a = adjective.verb) !== null && _a !== void 0 ? _a : ['is', 'is not'];
        span.append(value ? verbs[0] : verbs[1], ' ', navigation.anchorAdjective(type, id));
        ++count;
    }
    return span;
}
export function formatTheoremConditions(summary, theorem, conditions) {
    const span = create('span');
    const total = Object.values(conditions).length;
    let count = 0;
    for (const path in conditions) {
        const type = summary.resolvePathType(theorem.type, path);
        if (total > 1 && count > 0)
            span.append((count < total - 1) ? ', ' : ', and ');
        span.append(formatFromPath(theorem, path), ' ');
        span.append(formatAdjectivesDescription(summary, type, conditions[path]));
        ++count;
    }
    return span;
}
export function formatTheoremStatement(summary, theorem) {
    const span = create('span');
    span.append(`Let $${theorem.subject}$ be a `, navigation.anchorType(theorem.type), '. ');
    if (!theorem.converse) {
        span.append('Suppose ', formatTheoremConditions(summary, theorem, theorem.conditions), '. ');
        span.append('Then ', formatTheoremConditions(summary, theorem, theorem.conclusions), '.');
    }
    else {
        span.append('Then ', formatTheoremConditions(summary, theorem, theorem.conditions));
        span.append(' if and only if ', formatTheoremConditions(summary, theorem, theorem.conclusions), '.');
    }
    return span;
}
//# sourceMappingURL=formatter.js.map