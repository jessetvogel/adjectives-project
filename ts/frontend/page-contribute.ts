import { create } from './util.js';

export function pageContribute(): HTMLElement {
    return create('div', { class: 'page page-contribute' }, [
        create('span', { class: 'title' }, 'How to contribute?'),
        'TODO: Create contribute page'
    ]);
}