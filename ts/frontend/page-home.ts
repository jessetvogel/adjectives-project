import navigation from './navigation.js';
import { create } from './util.js';

export function pageHome(): HTMLElement {
    return create('div', { class: 'page page-home' }, [
        create('span', { class: 'title' }, 'Welcome 👋'),
        create('p', { style: 'text-align: justify' },
            'Welcome to the <i>Adjectives Project</i>! On this website you can search for examples of schemes and morphisms based on combinations of adjectives. Also, you can see which properties automatically follow from your given assumptions.'),
        create('p', { style: 'text-align: justify' }, 'Click \'Explore\' to get started, or check out one of the below examples.'),
        create('p', { class: 'center' }, [
            create('button', {
                '@click': () => navigation.navigate('?page=explore&q=eyJ0eXBlIjoic2NoZW1lIiwiIGludGVncmFsIjpmYWxzZSwiIGlycmVkdWNpYmxlIjp0cnVlfQ==&action=search', {})
            }, '👉 Show me an irreducible scheme which is not integral'),
            create('button', {
                '@click': () => navigation.navigate('?page=explore&q=eyJ0eXBlIjoibW9ycGhpc20iLCIgc2VwYXJhdGVkIjpmYWxzZSwiIHF1YXNpLXNlcGFyYXRlZCI6dHJ1ZX0=&action=search', {})
            }, '👉 Show me a quasi-separated morphism which is not separated'),
            create('button', {
                '@click': () => navigation.navigate('?page=explore&q=eyJ0eXBlIjoibW9ycGhpc20iLCIgZXRhbGUiOnRydWV9&action=deduce', {})
            }, '👉 What properties does an étale morphism have?'),
        ])
    ]);
}
