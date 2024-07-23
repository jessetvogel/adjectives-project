import navigation from './navigation.js';
import { create } from './util.js';
export function pageContribute() {
    const page = create('div', { class: 'page page-contribute' });
    page.append(create('span', { class: 'title' }, 'How to contribute?'));
    page.append(create('p', {}, [
        'The ',
        create('a', { href: 'https://github.com/jessetvogel/adjectives-project', target: '_blank' }, 'software'),
        ' and ',
        create('a', { href: 'https://github.com/jessetvogel/adjectives-project-data', target: '_blank' }, 'data'),
        ' of this website are available on GitHub. ',
        'To contribute an example, theorem or adjective, please create a pull request to the data repository.'
    ]));
    page.append(create('p', {}, [
        'For inspiration, check out the list of ',
        navigation.anchorPage('questions', 'open questions'),
        '.'
    ]));
    return page;
}
