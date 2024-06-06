import { create } from './util.js';

export function pageHome(): HTMLElement {
    return create('div', { class: 'page page-home'}, [
        create('span', { class: 'title'}, 'Welcome!'),
        'TODO: Create home page'
    ]);
}
