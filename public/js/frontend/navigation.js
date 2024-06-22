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
import { pageGraph } from './page-graph.js';
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
        case 'graph': return setContent(pageGraph(summary, query));
    }
    setContent(create('div', { class: 'page' }, [
        create('span', { class: 'title' }, '🥺 Page not found..')
    ]));
}
function anchorWrapper(a) {
    onClick(a, function (event) {
        event.preventDefault();
        const href = this.href;
        if (event.metaKey)
            window.open(href, '_blank');
        else
            navigate(href, {});
    });
    return a;
}
function anchorType(id) {
    var _a, _b, _c;
    return anchorWrapper(create('a', { href: `?page=type&id=${id}` }, (_c = (_b = (_a = summary === null || summary === void 0 ? void 0 : summary.types) === null || _a === void 0 ? void 0 : _a[id]) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : create('span', { class: 'invalid tt' }, id)));
}
function anchorAdjective(type, id) {
    var _a, _b, _c, _d;
    return anchorWrapper(create('a', { href: `?page=adjective&type=${type}&id=${id}` }, (_d = (_c = (_b = (_a = summary.adjectives) === null || _a === void 0 ? void 0 : _a[type]) === null || _b === void 0 ? void 0 : _b[id]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : create('span', { class: 'invalid tt' }, id)));
}
function anchorExample(type, id) {
    var _a, _b, _c, _d;
    return anchorWrapper(create('a', { href: `?page=example&type=${type}&id=${id}` }, (_d = (_c = (_b = (_a = summary.examples) === null || _a === void 0 ? void 0 : _a[type]) === null || _b === void 0 ? void 0 : _b[id]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : create('span', { class: 'invalid tt' }, id)));
}
function anchorTheorem(type, id) {
    var _a, _b, _c, _d;
    return anchorWrapper(create('a', { href: `?page=theorem&type=${type}&id=${id}` }, (_d = (_c = (_b = (_a = summary.theorems) === null || _a === void 0 ? void 0 : _a[type]) === null || _b === void 0 ? void 0 : _b[id]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : create('span', { class: 'invalid tt' }, id)));
}
function anchorPage(page, text) {
    return anchorWrapper(create('a', { href: `?page=${page}` }, text));
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
    window.history.pushState(state, document.title, url);
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