import { Context, Book, Proof, Example } from '../shared/core.js';
import { Assistant, ContradictionError } from '../shared/assistant.js';
import { create, clear, onClick, hasClass, addClass, removeClass, setHTML, onChange } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import { formatContext, formatProof } from './formatter.js';
import navigation from './navigation.js';

export function pageCompare(summary: Book, options: { [k: string]: string }): HTMLElement {
    const pageElem = create('div', { class: 'page page-compare' });

    const type = options?.type;
    const a = options?.a;
    const b = options?.b;

    if (type === undefined || a === undefined || b === undefined || !(type in summary.types) || !(a in summary.adjectives[type]) || !(b in summary.adjectives[type])) {
        pageElem.append(create('span', { class: 'title' }, `🥺 Page not found..`));
        return pageElem;
    }

    // title
    pageElem.append(create('span', { class: 'title' }, `${summary.adjectives[type][a].name} vs ${summary.adjectives[type][b].name}`));

    // contexts
    const id = 'X';
    const contextA = summary.createContextFromType(type, id);
    contextA[type][id].adjectives[a] = true;
    const contextB = summary.createContextFromType(type, id);
    contextB[type][id].adjectives[b] = true;
    const assistant = new Assistant(summary);
    assistant.deduce(contextA);
    assistant.deduce(contextB);


    // implications a => b or b => a
    for (const [u, v, contextU] of [[a, b, contextA], [b, a, contextB]] as [string, string, Context][]) {
        const u_implies_v = (contextU[type][id].adjectives?.[v] === true);

        if (u_implies_v) {
            pageElem.append(create('p', {}, [
                `A ${summary.types[type].name} which is ${u} also is ${v} by`
            ]));
        }
        else {
            pageElem.append(create('p', {}, [
                `A ${summary.types[type].name} which is ${u} is not necessarily ${v}. (TODO: show counterexamples)`
            ]));
        }
    }

    return pageElem;
}

function implies(summary: Book, type: string, a: string, b: string): boolean {
    const id = 'X';
    const context = summary.createContextFromType(type, id);
    context[type][id].adjectives[a] = true;
    const assistant = new Assistant(summary);
    assistant.deduce(context);
    return (context[type][id].adjectives?.[b] === true);
}
