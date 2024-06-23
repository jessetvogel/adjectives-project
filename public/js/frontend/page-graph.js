import { Assistant } from '../shared/assistant.js';
import { create } from './util.js';
import navigation from './navigation.js';
function adjectiveGraph(summary, type) {
    const graph = {};
    const assistant = new Assistant(summary);
    for (const adjective in summary.adjectives[type]) {
        // create context with object 'X' which which has `adjective`
        const context = summary.createContextFromType(type, 'X');
        context[type]['X'].adjectives[adjective] = true;
        // deduce
        assistant.deduce(context);
        // record all implications
        graph[adjective] = [];
        for (const key in context[type]['X'].adjectives) {
            if (key != adjective && context[type]['X'].adjectives[key])
                graph[adjective].push(key);
        }
    }
    return minimizeGraph(graph);
}
function minimizeGraph(graph) {
    // minimize graph: if A => C factors as A => B and B => C, then remove A => C
    const out = {};
    for (const A in graph) {
        const Cs = graph[A];
        for (const B of graph[A]) {
            for (const C of graph[B]) {
                const i = Cs.indexOf(C);
                if (i != -1)
                    Cs.splice(i, 1);
            }
        }
        out[A] = Cs;
    }
    return out;
}
function partition(array, filter) {
    const pass = [];
    const fail = [];
    array.forEach((elem, i, array) => (filter(elem, i, array) ? pass : fail).push(elem));
    return [pass, fail];
}
function graphToLayers(graph) {
    const layers = [];
    let keys = Object.keys(graph);
    while (keys.length > 0) {
        // create a layer of all A for which there is no B => A for some B in keys
        const [layer, other] = partition(keys, A => !keys.some(B => graph[B].indexOf(A) != -1));
        layers.push(layer);
        keys = other;
    }
    return layers;
}
function graphScore(graph, layers, legend) {
    let score = 0;
    for (const A in graph) {
        const i = legend[A];
        const j = layers[i].indexOf(A);
        const Ax = j - layers[i].length / 2;
        for (const B of graph[A]) {
            const u = legend[B];
            const v = layers[u].indexOf(B);
            const Bx = v - layers[u].length / 2;
            score += Math.sqrt((u - i) * (u - i) + (Bx - Ax) * (Bx - Ax));
        }
    }
    return score;
}
function arraymove(array, fromIndex, toIndex) {
    const element = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, element);
}
function arrayshuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function optimizeGraph(graph, layers, legend, score) {
    if (score == undefined)
        score = graphScore(graph, layers, legend);
    // for (const layer of layers) arrayshuffle(layer); // randomize initially
    loop: while (true) {
        for (const layer of layers) {
            for (let i = 0; i < layer.length; ++i) {
                for (let j = 0; j < layer.length; ++j) {
                    if (i == j)
                        continue;
                    // move i -> j
                    arraymove(layer, i, j);
                    const newScore = graphScore(graph, layers, legend);
                    if (newScore < score) {
                        score = newScore;
                        continue loop;
                    }
                    else {
                        // move j -> i back
                        arraymove(layer, j, i);
                    }
                }
            }
        }
        break;
    }
    return [graph, layers];
}
export function pageGraph(summary, options) {
    var _a;
    const page = create('div', { class: 'page page-graph' });
    const type = (_a = options.type) !== null && _a !== void 0 ? _a : 'scheme';
    // title
    page.append(create('span', { class: 'title' }, `Graph of ${summary.types[type].name} adjectives`));
    // construct graph
    let g = adjectiveGraph(summary, type);
    let l = graphToLayers(g);
    const legend = {};
    for (const key in g)
        legend[key] = l.findIndex(layer => layer.includes(key));
    const [graph, layers] = optimizeGraph(g, l, legend); // minimize arrow lengths
    // render graph layers
    const divGraph = create('div', { class: 'graph' });
    const mapDiv = {};
    for (const layer of layers) {
        const divLayer = create('div', { class: 'layer' });
        for (const key of layer) {
            const divKey = create('div', {}, navigation.anchorAdjective(type, key));
            mapDiv[key] = divKey;
            divLayer.append(divKey);
        }
        divGraph.append(divLayer);
    }
    page.append(divGraph);
    // render graph arrows
    const arrows = [];
    for (const source in graph) {
        for (const target of graph[source]) {
            const color = `hsl(${Math.floor(Math.random() * 360.0)}, ${25}%, ${75}%)`;
            // const color = `hsl(189, 69%, ${12 + Math.floor(Math.random() * (40 - 12))}%)`;
            const arrow = create('div', { class: 'arrow', style: `--color: ${color}` });
            arrows.push([arrow, mapDiv[source], mapDiv[target]]);
            divGraph.append(arrow);
        }
    }
    function updateArrows() {
        if (!document.body.contains(divGraph)) {
            window.removeEventListener('resize', updateArrows);
            console.log('Removed event listnere!');
        }
        const boxBody = document.body.getBoundingClientRect();
        for (const [arrow, source, target] of arrows) {
            const boxSource = source.getBoundingClientRect();
            const boxTarget = target.getBoundingClientRect();
            const from = [(boxSource.left + boxSource.right) / 2, boxSource.bottom];
            const to = [(boxTarget.left + boxTarget.right) / 2, boxTarget.top - 4];
            from[0] -= boxBody.left;
            from[1] -= boxBody.top;
            to[0] -= boxBody.left;
            to[1] -= boxBody.top;
            const width = Math.sqrt((to[0] - from[0]) * (to[0] - from[0]) + (to[1] - from[1]) * (to[1] - from[1]));
            const rotate = 180 + 180.0 / Math.PI * Math.atan2(to[1] - from[1], to[0] - from[0]);
            arrow.style.left = `${(from[0] + to[0]) / 2 - width / 2}px`;
            arrow.style.top = `${(from[1] + to[1]) / 2}px`;
            arrow.style.width = `${width}px`;
            arrow.style.rotate = `${rotate}deg`;
            divGraph.append(arrow);
        }
    }
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 100);
    return page;
}
//# sourceMappingURL=page-graph.js.map