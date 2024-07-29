import { Book, Proof } from '../shared/core.js';
import { create, setText } from './util.js';
import { katexTypeset } from './katex-typeset.js';
import { formatProof } from './formatter.js';
import navigation from './navigation.js';

export function pageExample(summary: Book, options: any): HTMLElement {
    const page = create('div', { class: 'page page-example' });

    const type = options?.type;
    const id = options?.id;
    if (type === undefined || id === undefined || !(type in summary.examples) || !(id in summary.examples[type])) {
        page.append(create('span', { class: 'title' }, `🥺 Example not found..`));
        return page;
    }

    const spanName = create('span', {});
    const spanSubtitle = create('span', { class: 'subtitle' });
    const pDescription = create('p', { class: 'description' }, '');
    const tableAdjectives = create('table', { class: 'adjectives' }, '');

    // update subtitle
    spanSubtitle.append(`(${summary.types[type].name}`);
    const args = Object.keys(summary.examples[type][id].args);
    for (let i = 0; i < args.length; ++i) {
        if (i == 0) spanSubtitle.append(' with ');
        if (i > 0 && i < args.length - 1) spanSubtitle.append(', ');
        if (i > 0 && i == args.length - 1) spanSubtitle.append(' and ');
        const arg = args[i];
        spanSubtitle.append(arg, ' ');
        spanSubtitle.append(navigation.anchorExample(summary.types[type].parameters[arg], summary.examples[type][id].args[arg]));
    }
    spanSubtitle.append(')');
    katexTypeset(spanSubtitle);

    fetch(`json/examples/${type}/${id}.json`, { cache: 'reload' }).then(response => response.json()).then(data => {
        // update name span
        if ('name' in data) setText(spanName, data.name);
        katexTypeset(spanName);

        // update description paragraph
        if ('description' in data) {
            setText(pDescription, data.description);
            katexTypeset(pDescription);
        }

        // update adjectives table
        tableAdjectives.append(create('tr', {}, [
            create('th', {}, 'Adjective'),
            create('th', {}, 'Value'),
            create('th', {}, 'Proof')
        ]));

        for (const adjId of adjectivesOrder(summary, type, id, data)) {
            const adjective = summary.adjectives[type][adjId];
            const value = (data?.adjectives?.[adjId] ?? 'unknown').toString();
            tableAdjectives.append(create('tr', {}, [
                create('td', {}, navigation.anchorAdjective(adjective.type, adjId)),
                create('td', { class: value }, value),
                create('td', {}, formatProof(type, id, data?.proofs?.[adjId]) ?? '')
            ]));
        }
        katexTypeset(tableAdjectives);

    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });

    page.append(...[
        create('span', { class: 'title' }, [
            spanName,
            spanSubtitle
        ]),
        pDescription,
        tableAdjectives
    ]);

    return page;
}

function adjectivesOrder(summary: Book, type: string, id: string, data: any): string[] {
    // if the proof of an adjective depends on another adjective, then it should be below that dependency. Keep track of these dependencies using 'depth'.
    const depths: { [adj: string]: number } = {};

    function computeDepth(adjective: string): void {
        if (adjective in depths) return; // if depth was already computed, done
        if (data?.adjectives?.[adjective] === undefined) {
            depths[adjective] = 999999;
            return;
        }
        if (data?.proofs?.[adjective] === undefined) { // if there is no proof, depth is zero
            depths[adjective] = 0;
            return;
        }
        const proof = data.proofs[adjective] as Proof;
        if (typeof proof == 'string') { // if there is a proof by words, depth is also zero
            depths[adjective] = 0;
            return;
        }
        // console.log(proof);
        // depths[adjective] = 1;

        // TODO: use summary.traceProofDependencies
        const dependencies = summary.traceProofDependencies(summary.examples, summary.examples[type][id], adjective, proof);
        let depth = 1; // penalty of 1 because it is a deduction
        for (const { object: obj, adjective: adj } of dependencies) {
            if (obj.type == type && obj.id == id) { // only regard this example, because we have no access to proofs of other examples
                computeDepth(adj);
                depth = Math.max(depth, depths[adj] + 1);
            }
        }
        depths[adjective] = depth;
        return;
    }

    const adjectives = Object.keys(summary.adjectives[type]);
    for (const adjective of adjectives)
        computeDepth(adjective);
    adjectives.sort((a, b) => depths[a] - depths[b]);

    return adjectives;
}
