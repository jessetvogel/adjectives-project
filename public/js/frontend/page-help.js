import { create } from './util.js';
import navigation from './navigation.js';
import { katexTypeset } from './katex-typeset.js';
export function pageHelp() {
    const page = create('div', { class: 'page page-help' });
    page.append(...[
        create('span', { class: 'title' }, 'Help'),
        create('p', {}, ['The explore page can be used to search for examples of schemes and morphisms admitting (or not admitting) certain properties. Furthermore, it can be used to find additional properties that apply to your scheme or morphism, using the available theorems. For all the availible examples and theorems, see the ', navigation.anchorPage('data', 'data'), '.']),
        create('span', { class: 'title' }, 'Example (non-separated schemes)'),
        create('p', {}, ['Suppose we want to find examples of non-', navigation.anchorAdjective('scheme', 'separated'), ' schemes.']),
        create('ol', {}, [
            create('li', {}, 'Go the the explore page, and make sure \'<b>scheme</b>\' is selected in the drop-down menu.'),
            create('li', {}, 'Click twice on \'<b>separated</b>\' to indicate that the scheme should not be separated.'),
            create('li', {}, 'Click the <button>Search</button> button.'),
            create('li', {}, ['You will now see a list of schemes which are not separated (for instance ', navigation.anchorExample('scheme', 'AA-1-QQ-double-origin'), ').']),
        ]),
        create('p', {}, 'Now suppose we are also interested in what additional properties non-separated schemes have.'),
        create('ol', { start: 5 }, [
            create('li', {}, 'Click the <button>Deduce</button> button.'),
            create('li', {}, ['You will now see a list of conclusions that apply to a non-separated scheme, together with the theorem from which that conclusion follows. For instance, the scheme is also not ', navigation.anchorAdjective('scheme', 'affine'), ' because ', navigation.anchorTheorem('scheme', 'qaf-of-af'), ' and ', navigation.anchorTheorem('scheme', 'sp-of-qaf'), '.'])
        ])
    ]);
    katexTypeset(page);
    return page;
}
