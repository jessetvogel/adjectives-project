import { pageExplore } from './page-explore.js';
import { pageHome } from './page-home.js';
import { pageData } from './page-data.js';
import { pageExample } from './page-example.js';
import { pageAdjective } from './page-adjective.js';
import { pageTheorem } from './page-theorem.js';
import { pageType } from './page-type.js';
import { pageContribute } from './page-contribute.js';

import { clear, create } from './util.js';
import { Book } from '../shared/core.js';

let summary: Book;
let content: HTMLElement;

function navigateCallback(state: any): void {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));

    if (!('page' in query) || query.page == 'home') return setContent(pageHome());
    switch (query.page) {
        case 'explore': return setContent(pageExplore(summary, query));
        case 'data': return setContent(pageData(summary, query))
        case 'example': return setContent(pageExample(summary, query))
        case 'adjective': return setContent(pageAdjective(summary, query))
        case 'theorem': return setContent(pageTheorem(summary, query))
        case 'type': return setContent(pageType(summary, query))
        case 'contribute': return setContent(pageContribute())
    }
    setContent(create('div', {}, '404 Page Not Found'));
}

function anchorType(id: string): HTMLElement {
    return create('a', { href: `?page=type&id=${id}` }, summary.types[id].name);
}

function anchorAdjective(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=adjective&type=${type}&id=${id}` }, summary.adjectives[type][id].name);
}

function anchorExample(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=example&type=${type}&id=${id}` }, summary.examples[type][id].name);
}

function anchorTheorem(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=theorem&type=${type}&id=${id}` }, summary.theorems[type][id].name);
}

function init(s: Book, c: HTMLElement): void {
    summary = s;
    content = c;

    window.onpopstate = (event: PopStateEvent) => navigateCallback(event.state);
    navigateCallback({});
}

function navigate(url: string, state: any): void {
    window.history.pushState(state, '', url);
    navigateCallback(state);
}

function setContent(elem: HTMLElement): void {
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
