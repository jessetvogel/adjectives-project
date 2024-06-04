import fs from 'fs';

import { Book } from './core.js';
import { Assistant } from './assistant.js';
import { update_json } from './json-updater.js';

const PATH_SUMMARY = './json/summary.json';

function main() {
    try {
        // Load summary
        if (!fs.existsSync(PATH_SUMMARY)) {
            console.log(`🚨 Missing summary file '${PATH_SUMMARY}'`);
            return;
        }

        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));

        // Create book from summary
        const book = new Book(summary);
        book.verify();

        // Make deductions
        const assistant = new Assistant(book);
        console.log(`👉 Deducing ...`);
        const conclusions = assistant.deduce(book.examples);
        for (const conclusion of conclusions)
            console.log(`🤖 Example '${conclusion.object.id}' of type '${conclusion.object.type}' is${conclusion.value ? '' : ' not'} ${conclusion.adjective}`);

        // Save conclusions
        if (conclusions.length > 0) {
            console.log(`👉 Saving conclusions ...`);
            update_json(book);
        }
        else {
            console.log(`💬 No deductions were made`);
        }

        // Done
        console.log('✅ Done');
    }
    catch (err) {
        console.log(`🚨 ${err}`);
    }
}

main();
