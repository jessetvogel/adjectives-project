import { create } from './util.js';

export function pageHome(): HTMLElement {
    return create('div', { class: 'page page-home' }, [
        create('span', { class: 'title' }, 'Welcome'),
        create('p', { style: 'text-align: justify' },
            'Welcome to the Adjectives Project! This website can be used to find (counter)examples of schemes and morphism having certain properties. Also, it can automatically apply theorems to your given schemes and morphisms to derive new properties. Click \'Explore\' to get started!'
        )
    ]);
}
