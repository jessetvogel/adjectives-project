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
import { pageGraph } from './page-graph.js';
import { pageCompare } from './page-compare.js';

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
        case 'graph': return setContent(pageGraph(summary, query))
        case 'compare': return setContent(pageCompare(summary, query))
    }
    setContent(create('div', { class: 'page' }, [
        create('span', { class: 'title' }, '🥺 Page not found..')
    ]));
}

function anchorWrapper(a: HTMLAnchorElement): HTMLAnchorElement {
    onClick(a, function (event: MouseEvent) {
        event.preventDefault();
        const href = (this as HTMLAnchorElement).href;
        if (event.metaKey)
            window.open(href, '_blank');
        else
            navigate(href, {});
    });
    return a;
}

function anchorType(id: string): HTMLAnchorElement {
    return anchorWrapper(create('a', { href: `?page=type&id=${id}` }, summary?.types?.[id]?.name ?? create('span', { class: 'invalid tt' }, id)) as HTMLAnchorElement);
}

function anchorAdjective(type: string, id: string): HTMLAnchorElement {
    return anchorWrapper(create('a', { href: `?page=adjective&type=${type}&id=${id}` }, summary.adjectives?.[type]?.[id]?.name ?? create('span', { class: 'invalid tt' }, id)) as HTMLAnchorElement);
}

function anchorExample(type: string, id: string): HTMLAnchorElement {
    return anchorWrapper(create('a', { href: `?page=example&type=${type}&id=${id}` }, summary.examples?.[type]?.[id]?.name ?? create('span', { class: 'invalid tt' }, id)) as HTMLAnchorElement);
}

function anchorTheorem(type: string, id: string): HTMLAnchorElement {
    return anchorWrapper(create('a', { href: `?page=theorem&type=${type}&id=${id}` }, summary.theorems?.[type]?.[id]?.name ?? create('span', { class: 'invalid tt' }, id)) as HTMLAnchorElement);
}

function anchorPage(page: string, text: string): HTMLAnchorElement {
    return anchorWrapper(create('a', { href: `?page=${page}` }, text) as HTMLAnchorElement);
}

function init(s: Book, c: HTMLElement): void {
    summary = s;
    content = c;

    window.onpopstate = (event: PopStateEvent) => navigateCallback(event.state);
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

function navigate(url: string, state: any): void {
    window.history.pushState(state, document.title, url);
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
