import fs from 'fs';

import { Book } from './core.js';
import { Assistant, DeduceOptions } from './assistant.js';
import { update_json } from './json-updater.js';
import { Log } from './general.js';

const PATH_SUMMARY = './json/summary.json';

function main() {
    // Parse arguments
    let options: DeduceOptions = {};
    for (const arg of process.argv) {
        let match;
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
        if (!fs.existsSync(PATH_SUMMARY)) {
            Log.error(`Missing summary file '${PATH_SUMMARY}'`);
            return;
        }

        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));

        // Create book from summary
        const book = new Book(summary);
        book.verify();

        // Make deductions
        const assistant = new Assistant(book);
        Log.action(`Deducing`);
        const conclusions = assistant.deduce(book.examples, options);
        for (const conclusion of conclusions)
            Log.info(`Example '${conclusion.object.id}' of type '${conclusion.object.type}' is${conclusion.value ? '' : ' not'} ${conclusion.adjective}`);

        // Save conclusions
        if (conclusions.length > 0) {
            Log.action(`Saving conclusions`);
            update_json(book);
        }
        else {
            Log.info(`No deductions were made`);
        }

        // Done
        Log.success('Done');
    }
    catch (err: any) {
        Log.error(err.toString());
    }
}

main();
