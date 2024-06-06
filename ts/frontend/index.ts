import { $, onClick } from './util.js';
import { Book } from '../shared/core.js';
import navigation from './navigation.js';

function mapButton(id: string, url: string, state?: any): void {
    const button = $(id);
    if (button == null) throw new Error(`[ERROR] Element with id '${id}' does not exist`);
    onClick(button, () => navigation.navigate(url, state));
}

let summary: Book;

async function main() {
    // Load summary
    summary = new Book(await (await fetch('json/summary.json')).json()); // load summary
    summary.verify();

    // Initialize navigation
    navigation.init(summary, $('content') as HTMLElement);

    // Map buttons
    mapButton('button-home', '?', {});
    mapButton('button-explore', '?page=explore', {});
    mapButton('button-data', '?page=data', {});
    mapButton('button-contribute', '?page=contribute', {});
}

window.onload = main;
