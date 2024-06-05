import { create } from './util.js';
export function pageData(options) {
    return create('div', {}, [
        create('h1', {}, 'Data'),
        create('p', {}, 'View data'),
        create('a', { href: "?page=other" }, 'GO TO OTHER')
    ]);
}
//# sourceMappingURL=page-data.js.map