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
import { Book } from '../shared/core.js';
import { pageQuestions } from './page-questions.js';

let summary: Book;
let content: HTMLElement;

function navigateCallback(state: any): void {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    const page = query.page ?? 'home';

    // update nav buttons
    for (const button of $$('nav button'))
        (button.id == `button-${page}` ? addClass : removeClass)(button, 'selected');

    // set content
    switch (page) {
        case 'home': return setContent(pageHome());
        case 'explore': return setContent(pageExplore(summary, query));
        case 'data': return setContent(pageData(summary, query))
        case 'example': return setContent(pageExample(summary, query))
        case 'adjective': return setContent(pageAdjective(summary, query))
        case 'theorem': return setContent(pageTheorem(summary, query))
        case 'type': return setContent(pageType(summary, query))
        case 'contribute': return setContent(pageContribute())
        case 'help': return setContent(pageHelp())
        case 'questions': return setContent(pageQuestions(summary))
    }
    setContent(create('div', { class: 'page' }, [
        create('span', { class: 'title' }, '🥺 404 Page Not Found')
    ]));
}

function anchorType(id: string): HTMLElement {
    return create('a', { href: `?page=type&id=${id}`, '@click': function (event: MouseEvent) { event.preventDefault(); navigate(this.href, {}); } }, summary.types[id].name);
}

function anchorAdjective(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=adjective&type=${type}&id=${id}`, '@click': function (event: MouseEvent) { event.preventDefault(); navigate(this.href, {}); } }, summary.adjectives[type][id].name);
}

function anchorExample(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=example&type=${type}&id=${id}`, '@click': function (event: MouseEvent) { event.preventDefault(); navigate(this.href, {}); } }, summary.examples[type][id].name);
}

function anchorTheorem(type: string, id: string): HTMLElement {
    return create('a', { href: `?page=theorem&type=${type}&id=${id}`, '@click': function (event: MouseEvent) { event.preventDefault(); navigate(this.href, {}); } }, summary.theorems[type][id].name);
}

function anchorPage(page: string, text: string) {
    return create('a', { href: `?page=${page}`, '@click': function (event: MouseEvent) { event.preventDefault(); navigate(this.href, {}); } }, text);
}

function init(s: Book, c: HTMLElement): void {
    summary = s;
    content = c;

    window.onpopstate = (event: PopStateEvent) => navigateCallback(event.state);
    navigateCallback({});

    // initialize navigation buttons
    for (const button of $$('nav button')) {
        const match = button.id.match(/^button-(\w+)$/);
        if (match)
            onClick(button, () => navigate(`?page=${match[1]}`, {}));
    }
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
    anchorTheorem,
    anchorPage
};
