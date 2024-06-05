import { create } from './util.js';

export function pageData(options: any): HTMLElement {
    return create('div', {}, [
        create('h1', {}, 'Data'),
        create('p', {}, 'View data'),
        create('a', { href: "?page=other" }, 'GO TO OTHER')
    ]);
}
