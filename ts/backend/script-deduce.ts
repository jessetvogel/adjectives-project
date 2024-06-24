import fs from 'fs';

import { Book } from '../shared/core.js';
import { Assistant, Conclusion, DeduceOptions } from '../shared/assistant.js';
import { updateJSON } from './json-updater.js';
import { Log, PATH_SUMMARY } from './general.js';
import { fileURLToPath } from 'url';

export function main() {
    // Parse arguments
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

    try {
        // Load summary
        if (!fs.existsSync(PATH_SUMMARY))
            throw new Error(`Missing summary file '${PATH_SUMMARY}'`);

        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));

        // Create book from summary
        const book = new Book(summary);
        book.verify();

        // Make deductions
        const assistant = new Assistant(book);
        Log.action(`Deducing`);
        const conclusions: Conclusion[] = [];
        let c: Conclusion[];
        while ((c = assistant.deduce(book.examples, options)).length > 0)
            conclusions.push(...c);
        for (const conclusion of conclusions)
            Log.info(`Example '${conclusion.object.id}' of type '${conclusion.object.type}' is${conclusion.value ? '' : ' not'} ${conclusion.adjective}`);

        // Save conclusions
        if (conclusions.length > 0) {
            Log.action(`Saving conclusions`);
            updateJSON(book);
        }
        else {
            Log.info(`No deductions were made`);
        }

        // Done
        Log.success('Done');
        return 0;
    }
    catch (err: any) {
        Log.error(err.toString());
        return 1;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
    process.exit(main());
