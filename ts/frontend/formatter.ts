import { Book, Context, Proof, Theorem, TheoremConditions } from '../shared/core.js';
import navigation from './navigation.js';
import { create } from './util.js';

// e.g. 'the given assumptions'
// e.g. 'a [type] which is [...], and whose source is [...], and whose target is [...]'
export function formatContext(summary: Book, context: Context): HTMLElement {
    const span = create('span');

    // the subject is the object in the context whose id does not contain a period
    const type = Object.keys(context).find(type => Object.keys(context[type]).some(id => id.indexOf('.') == -1));
    if (type === undefined) { // safety sentence, but it should never happen though
        span.append('the given assumptions');
        return span;
    }

    // as there is only one object with this type, its id is simply the first key
    const id = Object.keys(context[type])[0];

    span.append(`a ${summary.types[type].name}`);

    let first = true; // keeps track of whether some adjectives are already written
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

// e.g. '$X$'
// e.g. 'the source of $f$'
function formatFromPath(theorem: Theorem, path: string): string {
    if (path == '') return `$${theorem.subject}$`;
    if (!path.startsWith('.')) return path;

    const i = path.lastIndexOf('.');
    return `the ${path.substring(i + 1)} of ${formatFromPath(theorem, path.substring(0, i))}`;
}

// e.g. '<user-written proof>'
// e.g. 'By (the negation of)? [theorem] (applied to [subject])?.'
export function formatProof(type: string, id: string, proof: string | Proof, context?: Context): HTMLElement | null {
    if (proof === undefined)
        return null;

    if (typeof proof == 'string')
        return create('span', {}, proof);

    const span = create('span');
    span.append('By ', proof.negated ? 'the negation of ' : '', navigation.anchorTheorem(proof.type, proof.theorem));
    if (proof.type != type || proof.subject != id) {
        span.append(' applied to ');
        span.append(
            (context === undefined)
                ? navigation.anchorExample(proof.type, proof.subject)
                : context[proof.type][proof.subject].name
        );
    }
    span.append('.');
    return span;
}

// e.g. 'assumption' 
// e.g. 'applying [...]'
// e.g. '<ol>(<li>applying [...]</li>)+</ol>'
export function formatStepByStepProof(steps: Proof[]): HTMLElement {
    const items: (HTMLElement | string)[][] = [];
    for (const step of steps)
        items.push(['applying ', step.negated ? 'the negation of ' : '', navigation.anchorTheorem(step.type, step.theorem), ' to the ', step.subject]);

    for (let i = 0; i < items.length; ++i) // add puncutation
        items[i].push((i < items.length - 1) ? ',' : '.');

    if (steps.length == 0) return create('span', {}, 'assumption.');
    if (steps.length == 1) return create('span', {}, items[0]);

    return create('ol', {}, items.map(item => create('li', {}, item)));
}

// e.g. 'is a monomorphism, has finite fibers, and is not a closed immersion'
export function formatAdjectivesDescription(summary: Book, type: string, adjectives: { [id: string]: boolean }): HTMLElement {
    const span = create('span');
    const total = Object.keys(adjectives).length;
    let count = 0;
    for (const id in adjectives) {
        if (total > 1 && count > 0 && count < total - 1) span.append(', ');
        if (total > 1 && count == total - 1) span.append(' and ');
        const adjective = summary.adjectives[type][id];
        const value = adjectives[id];
        const verbs = adjective.verb ?? ['is', 'is not'];
        span.append(value ? verbs[0] : verbs[1], ' ', navigation.anchorAdjective(type, id));
        ++count;
    }
    return span;
}

// e.g. '$X$ is reduced and irreducible'
// e.g. 'the source of $f$ is affine, and the target of $f$ is affine'
export function formatTheoremConditions(summary: Book, theorem: Theorem, conditions: TheoremConditions): HTMLElement {
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

// e.g. 'Let $X$ be a scheme. Suppose $X$ is affine. Then $X$ is quasi-compact.'
// e.g. 'Let $X$ be a scheme. Suppose $X$ is integral if and only if $X$ is reduced and is irreducible.'
export function formatTheoremStatement(summary: Book, theorem: Theorem): HTMLElement {
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
