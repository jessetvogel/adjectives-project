import { create, onInput, $$ } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import navigation from './navigation.js';
import { Book } from '../shared/core.js';

export function pageData(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-data' });

    const input = create('input', { type: 'text', placeholder: 'Search for example, adjective or theorem ...' }) as HTMLInputElement;

    onInput(input, () => {
        const value = input.value.toLocaleLowerCase();
        for (const li of $$('li')) {
            const show = (value == '' || li.innerText.toLocaleLowerCase().includes(value));
            li.style.display = show ? 'list-item' : 'none';
        }
    });

    page.append(create('div', { class: 'search-bar' }, input));

    const loading = create('div', { class: 'loading' });
    page.append(loading);

    setTimeout(() => {
        for (const sort of ['examples', 'adjectives', 'theorems'] as ('examples' | 'adjectives' | 'theorems')[]) {
            const div = create('div');
            div.append(create('span', { class: 'title', style: 'text-align: left;' }, sort.charAt(0).toUpperCase() + sort.slice(1)));
            const ul = create('ul');
            div.append(ul);
            const anchor = (sort == 'examples' ? navigation.anchorExample : (sort == 'adjectives' ? navigation.anchorAdjective : navigation.anchorTheorem));
            const showPercentages = (document.cookie.indexOf('show_percentages=') != -1);
            for (const type in summary[sort]) {
                for (const id in summary[sort][type]) {
                    let percentage: number | null = null;
                    if (showPercentages && sort == 'examples') percentage = percentageForExample(summary, type, id);
                    if (showPercentages && sort == 'adjectives') percentage = percentageForAdjective(summary, type, id);
                    ul.append(create('li', {}, [
                        anchor(type, id),
                        ' ',
                        create('span', { class: 'comment' }, `(${summary.types[type].name})`),
                        (percentage != null) ? create('span', { class: 'progress', style: `color: ${colorForPercentage(percentage)}` }, `${percentage}%`) : ''
                    ]));
                }
            }
            page.append(div);
        }
        katexTypeset(page);
        loading.remove();
    }, 0);

    return page;
}

function percentageForExample(summary: Book, type: string, id: string): number {
    let adjectiveCount = 0;
    let adjectiveResolvedCount = 0;
    const example = summary.examples[type][id];
    for (const adjective in summary.adjectives[type]) {
        ++adjectiveCount;
        if (adjective in example.adjectives)
            ++adjectiveResolvedCount;
    }
    return Math.floor(adjectiveResolvedCount / adjectiveCount * 100.0);
}

function percentageForAdjective(summary: Book, type: string, id: string): number {
    let exampleCount = 0;
    let exampleResolvedCount = 0;
    for (const example in summary.examples[type]) {
        ++exampleCount;
        if (id in summary.examples[type][example].adjectives)
            ++exampleResolvedCount;
    }
    return Math.floor(exampleResolvedCount / exampleCount * 100.0);
}

function colorForPercentage(percentage: number): string {
    return `color-mix(in hsl, var(--color-green) ${percentage}%, var(--color-red))`;
}
