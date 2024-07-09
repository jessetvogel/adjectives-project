import { Assistant } from '../shared/assistant.js';
import { create } from './util.js';
export function pageCompare(summary, options) {
    var _a;
    const pageElem = create('div', { class: 'page page-compare' });
    const type = options === null || options === void 0 ? void 0 : options.type;
    const a = options === null || options === void 0 ? void 0 : options.a;
    const b = options === null || options === void 0 ? void 0 : options.b;
    if (type === undefined || a === undefined || b === undefined || !(type in summary.types) || !(a in summary.adjectives[type]) || !(b in summary.adjectives[type])) {
        pageElem.append(create('span', { class: 'title' }, `🥺 Page not found..`));
        return pageElem;
    }
    pageElem.append(create('span', { class: 'title' }, `${summary.adjectives[type][a].name} vs ${summary.adjectives[type][b].name}`));
    const id = 'X';
    const contextA = summary.createContextFromType(type, id);
    contextA[type][id].adjectives[a] = true;
    const contextB = summary.createContextFromType(type, id);
    contextB[type][id].adjectives[b] = true;
    const assistant = new Assistant(summary);
    assistant.deduce(contextA);
    assistant.deduce(contextB);
    for (const [u, v, contextU] of [[a, b, contextA], [b, a, contextB]]) {
        const u_implies_v = (((_a = contextU[type][id].adjectives) === null || _a === void 0 ? void 0 : _a[v]) === true);
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
function implies(summary, type, a, b) {
    var _a;
    const id = 'X';
    const context = summary.createContextFromType(type, id);
    context[type][id].adjectives[a] = true;
    const assistant = new Assistant(summary);
    assistant.deduce(context);
    return (((_a = context[type][id].adjectives) === null || _a === void 0 ? void 0 : _a[b]) === true);
}
//# sourceMappingURL=page-compare.js.map