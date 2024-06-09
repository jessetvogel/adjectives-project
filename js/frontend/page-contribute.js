import navigation from './navigation.js';
import { create } from './util.js';
export function pageContribute() {
    const page = create('div', { class: 'page page-contribute' });
    page.append(create('span', { class: 'title' }, 'How to contribute?'));
    page.append(create('p', {}, [
        'The data for this website is managed in ',
        create('a', { href: 'https://github.com/jessetvogel/adjectives-project-data', target: '_blank' }, 'this repository'),
        '. Please create a pull request.'
    ]));
    page.append(create('p', {}, [
        'For inspiration, check out the ',
        navigation.anchorPage('questions', 'open questions'),
        '.'
    ]));
    return page;
}
//# sourceMappingURL=page-contribute.js.map