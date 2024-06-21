import fs from 'fs';
import { Book } from '../shared/core.js';
import { Assistant } from '../shared/assistant.js';
import { Log, PATH_SUMMARY } from './general.js';
function main() {
    try {
        // load summary
        if (!fs.existsSync(PATH_SUMMARY))
            throw new Error(`Missing summary file '${PATH_SUMMARY}'`);
        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));
        // create book from summary
        const book = new Book(summary);
        book.verify();
        // create assistant
        const assistant = new Assistant(book);
        // find redundant theorems
        for (const type in book.theorems) {
            for (const id in book.theorems[type]) {
                const theorem = book.theorems[type][id];
                const context = book.createContextFromType(type, 'X');
                const subject = context[type]['X'];
                // apply theorem conditions
                for (const path in theorem.conditions) {
                    const object = book.resolvePath(context, subject, path);
                    for (const adjective in theorem.conditions[path])
                        object.adjectives[adjective] = theorem.conditions[path][adjective];
                }
                // deduce without using this theorem
                assistant.deduce(context, { excludeTheorems: [theorem] });
                // verify theorem conclusions
                let conclusionsHold = true;
                const proofs = [];
                for (const path in theorem.conclusions) {
                    const object = book.resolvePath(context, subject, path);
                    for (const adjective in theorem.conclusions[path]) {
                        if (object.adjectives[adjective] === theorem.conclusions[path][adjective])
                            proofs.push(...book.traceProof(context, object, adjective));
                        else
                            conclusionsHold = false;
                    }
                }
                // print if redundant
                if (conclusionsHold) {
                    Log.info(`Theorem ${id} of type ${type} is redundant:`);
                    const proofsUnique = proofs.filter((x, i) => proofs.indexOf(x) == i);
                    let i = 0;
                    for (const proof of proofsUnique)
                        Log.print(`    ${++i}. apply ${proof.negated ? 'negation of ' : ''}${proof.converse ? 'converse of ' : ''}theorem '${proof.theorem}'`); // to object '${proof.subject}' of type '${proof.type}'`);
                }
            }
        }
        // TODO: find redundant adjectives for examples
        // for (const type in book.examples) {
        //     for (const id in book.examples[type]) {
        //         const example = book.examples[type][id];
        //         for (const adjective in example.adjectives) {
        //         }
        //     }
        // }
        // done
        Log.success('Done');
    }
    catch (err) {
        Log.error(err.stack);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=script-find-redundant.js.map