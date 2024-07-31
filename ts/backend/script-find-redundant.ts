import fs from 'fs';

import { Book, Context, Proof } from '../shared/core.js';
import { Assistant } from '../shared/assistant.js';
import { Log, PATH_JSON, PATH_SUMMARY } from './general.js';
import path from 'path';

function main() {
    // load summary
    const book = new Book();
    Log.action('Reading summary.json', () => {
        if (!fs.existsSync(PATH_SUMMARY))
            throw new Error(`Missing summary file '${PATH_SUMMARY}'`);

        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));

        // create book from summary
        book.initialize(summary);
        book.verify();
    });

    // find redundant theorems
    findRedundantTheorems(book);

    // find redundant examples
    findRedundantExamples(book);
}

function printProof(proof: Proof[]): void {
    let i = 0;
    for (const step of proof)
        Log.print(`    ${++i}. apply ${step.negated ? 'negation of ' : ''}${step.converse ? 'converse of ' : ''}theorem '${step.theorem}' to '${step.subject}'`);
}

function findRedundantTheorems(book: Book): void {
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
            const proofs: Proof[] = [];
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
                printProof(proofs.filter((x, i) => proofs.indexOf(x) == i));
            }
        }
    }
}

function createLocalContext(book: Book, type: string, id: string): Context {
    // create a context with only the examples which are relevant for the given example
    const context: Context = {};

    function addToLocalContext(type: string, id: string): void {
        // add this example (if it is not already in)
        const example = book.examples[type][id];
        if (!(type in context)) context[type] = {};
        if (id in context[type]) return;
        context[type][id] = example;

        // add arguments
        for (const key in example.args) {
            const argType = book.types[type].parameters[key];
            const argId = example.args[key];
            addToLocalContext(argType, argId);
        }

        // add examples which have this example as argument
        for (const otherType in book.examples) {
            for (const otherId in book.examples[otherType]) {
                const other = book.examples[otherType][otherId];
                for (const key in other.args) {
                    if (book.types[otherType].parameters[key] == type && other.args[key] == id)
                        addToLocalContext(otherType, otherId);
                }
            }
        }
    }

    addToLocalContext(type, id);

    return context;
}

function findRedundantExamples(book: Book): void {
    // reset the examples in the book to only have the adjectives which are not deduced using the theorems
    for (const type in book.examples) {
        for (const id in book.examples[type]) {
            const example = book.examples[type][id];
            const json = JSON.parse(fs.readFileSync(path.join(PATH_JSON, 'examples', type, `${id}.json`), 'utf8'));
            for (const adjective in example.adjectives) {
                if (json.proofs && adjective in json.proofs && typeof json.proofs[adjective] != 'string')
                    delete example.adjectives[adjective];
            }
        }
    }

    // for every adjective on every example: check if it is redundant
    const assistant = new Assistant(book);
    for (const type in book.examples) {
        for (const id in book.examples[type]) {
            const example = book.examples[type][id];
            const context = createLocalContext(book, type, id); // TODO: we could also just split up all examples into local contexts beforehand, would save some time
            for (const adjective in example.adjectives) {
                // create context where example does not have adjective
                const contextCopy = structuredClone(context);
                delete contextCopy[type][id].adjectives[adjective];

                // see if the property can be re-deduced from the other adjectives
                assistant.deduce(contextCopy);
                if (adjective in contextCopy[type][id].adjectives) {
                    const proof = contextCopy[type][id].proofs[adjective];
                    if (typeof proof == 'string') throw new Error('Unexpected proof type!');
                    Log.info(`Redundant adjective '${adjective}' on example '${id}' of type '${type}': follows from theorem '${proof.theorem}' applied to '${proof.subject}'`);
                    // printProof(book.traceProof(contextCopy, contextCopy[type][id], adjective));
                }
            }
        }
    }
}

main();
