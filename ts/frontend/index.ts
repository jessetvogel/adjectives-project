import { $ } from './util.js';
import { Book } from '../shared/core.js';
import navigation from './navigation.js';

let summary: Book;

async function main() {
    // Load summary
    summary = new Book(await (await fetch('json/summary.json')).json()); // load summary
    summary.verify();

    // Initialize navigation
    navigation.init(summary, $('content') as HTMLElement);
}

window.onload = main;
