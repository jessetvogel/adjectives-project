import fs from 'fs';

import { Book } from '../shared/core.js';
import { Assistant, Conclusion, DeduceOptions } from '../shared/assistant.js';
import { updateJSON } from './json-updater.js';
import { Log, PATH_SUMMARY } from './general.js';
import { fileURLToPath } from 'url';

export function main() {
    // parse arguments
    let options: DeduceOptions = {};
    for (const arg of process.argv) {
        let match: RegExpMatchArray | null;
        match = arg.match(/^--types?=([\w\-,]+)$/);
        if (match) options.types = match[1].split(',');
        match = arg.match(/^--ids?=([\w\-]+,)$/);
        if (match) options.ids = match[1].split(',');
        match = arg.match(/^--help$/)
        if (match) {
            console.log('usage: script-deduce.js [options]');
            console.log('  options:');
            console.log('    --help            show this help message');
            console.log('    --type=<types>    restrict to objects with type in comma-separated list <types>');
            console.log('    --id=<ids>        restrict to objects with id in comma-separated list <ids>');
            return;
        }
    }

    // load summary
    if (!fs.existsSync(PATH_SUMMARY))
        throw new Error(`Missing summary file '${PATH_SUMMARY}'`);

    const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));

    // create book from summary
    const book = new Book(summary);
    book.verify();

    // make deductions
    const assistant = new Assistant(book);
    const conclusions: Conclusion[] = [];
    Log.action(`Deducing`, () => {
        let c: Conclusion[];
        while ((c = assistant.deduce(book.examples, options)).length > 0)
            conclusions.push(...c);
    });
    Log.info(`Obtained ${conclusions.length} new conclusion(s)`);

    // save conclusions
    if (conclusions.length > 0) {
        Log.action(`Saving conclusions`, () => {
            updateJSON(book);
        });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try { main(); }
    catch (err: any) {
        Log.error(`${err}`);
        process.exit(1);
    }
}
