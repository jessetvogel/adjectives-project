import { Book, Context, Proof, Theorem, TheoremConditions } from '../shared/core.js';
import navigation from './navigation.js';
import { create } from './util.js';

export function formatContext(summary: Book, context: Context): HTMLElement {
    // {{a ${type} which is [...], and whose source is [...], and whose target is [...]}}    
    const span = create('span');

    // The subject is the object in the context whose id does not contain a period
    const type = Object.keys(context).find(type => Object.keys(context[type]).some(id => id.indexOf('.') == -1));
    if (type === undefined) { // safety sentence, but it should never happen though
        span.append('the given assumptions');
        return span;
    }
    const id = Object.keys(context[type])[0]; // right ?!

    span.append(`a ${summary.types[type].name}`);

    function addAdjectives(prefix: string, type: string, id: string): boolean {
        if (!('adjectives' in context[type][id]) || Object.keys(context[type][id].adjectives).length == 0)
            return false;
        span.append(prefix);
        const adjectivesTotal = Object.keys(context[type][id].adjectives).length;
        let adjectivesCount = 0;
        for (const adj in context[type][id].adjectives) {
            if (adjectivesTotal > 1 && adjectivesCount > 0 && adjectivesCount < adjectivesTotal - 1)
                span.append(', ');
            if (adjectivesTotal > 1 && adjectivesCount == adjectivesTotal - 1)
                span.append(' and ');
            if (!context[type][id].adjectives[adj])
                span.append('not ');
            span.append(navigation.anchorAdjective(type, adj));
            ++adjectivesCount;
        }
        return true;
    }

    let first = true; // keeps track of whether some adjectives are already written
    if (addAdjectives(' which is ', type, id))  // subject
        first = false;

    if ('args' in context[type][id] && Object.keys(context[type][id].args).length > 0) { // arguments / parameters
        for (const arg in context[type][id].args) {
            if (addAdjectives(`${first ? ' ' : ', and '}whose ${arg} is `, summary.types[type].parameters[arg], `${id}.${arg}`))
                first = false;
        }
    }

    return span;
}

function formatFromPath(theorem: Theorem, path: string): string {
    if (path == '') return `$${theorem.subject}$`;
    if (!path.startsWith('.')) return path;

    const i = path.lastIndexOf('.');
    return `the ${path.substring(i + 1)} of ${formatFromPath(theorem, path.substring(0, i))}`;
}

export function formatConditions(summary: Book, theorem: Theorem, conditions: TheoremConditions): HTMLElement {
    const span = create('span');
    const numberOfConditions = Object.values(conditions).map(adj => Object.keys(adj).length).reduce((partial, n) => partial + n);
    let conditionsCount = 0;
    for (const path in conditions) {
        for (const adj in conditions[path]) {
            const conditionObjectType = summary.resolvePathType(theorem.type, path);
            if (conditionObjectType == null)
                throw new Error(`Could not resolve path '${path}' starting from type '${theorem.type}'`);
            const value = conditions[path][adj];

            if (numberOfConditions > 1 && conditionsCount > 0 && conditionsCount < numberOfConditions - 1)
                span.append(', ');
            if (numberOfConditions > 1 && conditionsCount == numberOfConditions - 1)
                span.append(' and ');
            span.append(`${formatFromPath(theorem, path)} ${value ? 'is' : 'is not'} `, navigation.anchorAdjective(conditionObjectType, adj));
            ++conditionsCount;
        }
    }
    return span;
}

export function formatProof(type: string, id: string, proof: string | Proof, context?: Context): HTMLElement | null {
    if (proof === undefined)
        return null;

    if (typeof proof == 'string')
        return create('span', {}, proof);

    const span = create('span', {}, ['By ', navigation.anchorTheorem(proof.type, proof.theorem)]);
    if (proof.type != type || proof.subject != id) {
        span.append(' applied to ');
        if (context === undefined)
            span.append(navigation.anchorExample(proof.type, proof.subject));
        else
            span.append(context[proof.type][proof.subject].name);
    }
    span.append('.');
    return span;
}

export function formatTheoremStatement(summary: Book, theorem: Theorem): HTMLElement {
    const span = create('span');

    span.append(`Let $${theorem.subject}$ be a `, navigation.anchorType(theorem.type), '. ');
    span.append('Suppose ', formatConditions(summary, theorem, theorem.conditions), '. ');
    span.append('Then ', formatConditions(summary, theorem, theorem.conclusions), '.');
    
    return span;
}
