import { pageExplore } from './page-explore.js';
import { pageHome } from './page-home.js';
import { pageData } from './page-data.js';
import { pageExample } from './page-example.js';
import { pageAdjective } from './page-adjective.js';
import { pageTheorem } from './page-theorem.js';
import { pageType } from './page-type.js';
import { pageContribute } from './page-contribute.js';
import { pageHelp } from './page-help.js';
import { $$, clear, create, onClick, addClass, removeClass } from './util.js';
import { pageQuestions } from './page-questions.js';
let summary;
let content;
function navigateCallback(state) {
    var _a;
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    const page = (_a = query.page) !== null && _a !== void 0 ? _a : 'home';
    // update nav buttons
    for (const button of $$('nav button'))
        (button.id == `button-${page}` ? addClass : removeClass)(button, 'selected');
    // set content
    switch (page) {
        case 'home': return setContent(pageHome());
        case 'explore': return setContent(pageExplore(summary, query));
        case 'data': return setContent(pageData(summary, query));
        case 'example': return setContent(pageExample(summary, query));
        case 'adjective': return setContent(pageAdjective(summary, query));
        case 'theorem': return setContent(pageTheorem(summary, query));
        case 'type': return setContent(pageType(summary, query));
        case 'contribute': return setContent(pageContribute());
        case 'help': return setContent(pageHelp());
        case 'questions': return setContent(pageQuestions(summary));
    }
    setContent(create('div', { class: 'page' }, [
        create('span', { class: 'title' }, '🥺 Page not found..')
    ]));
}
function anchorType(id) {
    return create('a', { href: `?page=type&id=${id}`, '@click': function (event) { event.preventDefault(); navigate(this.href, {}); } }, summary.types[id].name);
}
function anchorAdjective(type, id) {
    return create('a', { href: `?page=adjective&type=${type}&id=${id}`, '@click': function (event) { event.preventDefault(); navigate(this.href, {}); } }, summary.adjectives[type][id].name);
}
function anchorExample(type, id) {
    return create('a', { href: `?page=example&type=${type}&id=${id}`, '@click': function (event) { event.preventDefault(); navigate(this.href, {}); } }, summary.examples[type][id].name);
}
function anchorTheorem(type, id) {
    return create('a', { href: `?page=theorem&type=${type}&id=${id}`, '@click': function (event) { event.preventDefault(); navigate(this.href, {}); } }, summary.theorems[type][id].name);
}
function anchorPage(page, text) {
    return create('a', { href: `?page=${page}`, '@click': function (event) { event.preventDefault(); navigate(this.href, {}); } }, text);
}
function init(s, c) {
    summary = s;
    content = c;
    window.onpopstate = (event) => navigateCallback(event.state);
    navigateCallback({});
    // initialize navigation buttons
    for (const button of $$('nav button')) {
        const match = button.id.match(/^button-(\w+)$/);
        if (match) {
            const page = match[1];
            onClick(button, () => {
                const query = Object.fromEntries(new URLSearchParams(window.location.search));
                if (!('page' in query) || query.page != page) // prevent going to a page we are already one
                    navigate(`?page=${match[1]}`, {});
            });
        }
    }
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
    anchorTheorem,
    anchorPage
};
//# sourceMappingURL=navigation.js.map