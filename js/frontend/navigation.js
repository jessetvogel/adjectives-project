import { pageExplore } from './page-explore.js';
import { pageHome } from './page-home.js';
import { pageData } from './page-data.js';
import { pageExample } from './page-example.js';
import { pageAdjective } from './page-adjective.js';
import { pageTheorem } from './page-theorem.js';
import { pageType } from './page-type.js';
import { pageContribute } from './page-contribute.js';
import { clear, create } from './util.js';
let summary;
let content;
function navigateCallback(state) {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    if (!('page' in query) || query.page == 'home')
        return setContent(pageHome());
    switch (query.page) {
        case 'explore': return setContent(pageExplore(summary, query));
        case 'data': return setContent(pageData(summary, query));
        case 'example': return setContent(pageExample(summary, query));
        case 'adjective': return setContent(pageAdjective(summary, query));
        case 'theorem': return setContent(pageTheorem(summary, query));
        case 'type': return setContent(pageType(summary, query));
        case 'contribute': return setContent(pageContribute());
    }
    setContent(create('div', {}, '404 Page Not Found'));
}
function anchorType(id) {
    return create('a', { href: `?page=type&id=${id}` }, summary.types[id].name);
}
function anchorAdjective(type, id) {
    return create('a', { href: `?page=adjective&type=${type}&id=${id}` }, summary.adjectives[type][id].name);
}
function anchorExample(type, id) {
    return create('a', { href: `?page=example&type=${type}&id=${id}` }, summary.examples[type][id].name);
}
function anchorTheorem(type, id) {
    return create('a', { href: `?page=theorem&type=${type}&id=${id}` }, summary.theorems[type][id].name);
}
function init(s, c) {
    summary = s;
    content = c;
    window.onpopstate = (event) => navigateCallback(event.state);
    navigateCallback({});
}
function navigate(url, state) {
    window.history.pushState(state, '', url);
    navigateCallback(state);
}
function setContent(elem) {
    if (!content)
        throw new Error(`[ERROR] Content not found`);
    clear(content); // clear content
    content.append(elem); // set content
}
export default {
    init,
    navigate,
    anchorType,
    anchorAdjective,
    anchorExample,
    anchorTheorem
};
//# sourceMappingURL=navigation.js.map