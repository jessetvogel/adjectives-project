import fs from 'fs';
import { Book } from '../shared/core.js';
import { Assistant } from '../shared/assistant.js';
import { Log, PATH_JSON, PATH_SUMMARY } from './general.js';
import path from 'path';
function main() {
    try {
        if (!fs.existsSync(PATH_SUMMARY))
            throw new Error(`Missing summary file '${PATH_SUMMARY}'`);
        const summary = JSON.parse(fs.readFileSync(PATH_SUMMARY, 'utf8'));
        const book = new Book(summary);
        book.verify();
        findRedundantTheorems(book);
        findRedundantExamples(book);
        Log.success('Done');
    }
    catch (err) {
        Log.error(err.stack);
        process.exit(1);
    }
}
function printProof(proof) {
    let i = 0;
    for (const step of proof)
        Log.print(`    ${++i}. apply ${step.negated ? 'negation of ' : ''}${step.converse ? 'converse of ' : ''}theorem '${step.theorem}' to '${step.subject}'`);
}
function findRedundantTheorems(book) {
    const assistant = new Assistant(book);
    for (const type in book.theorems) {
        for (const id in book.theorems[type]) {
            const theorem = book.theorems[type][id];
            const context = book.createContextFromType(type, 'X');
            const subject = context[type]['X'];
            for (const path in theorem.conditions) {
                const object = book.resolvePath(context, subject, path);
                for (const adjective in theorem.conditions[path])
                    object.adjectives[adjective] = theorem.conditions[path][adjective];
            }
            assistant.deduce(context, { excludeTheorems: [theorem] });
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
            if (conclusionsHold) {
                Log.info(`Theorem ${id} of type ${type} is redundant:`);
                printProof(proofs.filter((x, i) => proofs.indexOf(x) == i));
            }
        }
    }
}
function createLocalContext(book, type, id) {
    const context = {};
    function addToLocalContext(type, id) {
        const example = book.examples[type][id];
        if (!(type in context))
            context[type] = {};
        if (id in context[type])
            return;
        context[type][id] = example;
        for (const key in example.args) {
            const argType = book.types[type].parameters[key];
            const argId = example.args[key];
            addToLocalContext(argType, argId);
        }
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
function findRedundantExamples(book) {
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
    const assistant = new Assistant(book);
    for (const type in book.examples) {
        for (const id in book.examples[type]) {
            const example = book.examples[type][id];
            const context = createLocalContext(book, type, id);
            for (const adjective in example.adjectives) {
                const contextCopy = structuredClone(context);
                delete contextCopy[type][id].adjectives[adjective];
                assistant.deduce(contextCopy);
                if (adjective in contextCopy[type][id].adjectives) {
                    const proof = contextCopy[type][id].proofs[adjective];
                    if (typeof proof == 'string')
                        throw new Error('Unexpected proof type!');
                    Log.info(`Redundant adjective '${adjective}' on example '${id}' of type '${type}': follows from theorem '${proof.theorem}' applied to '${proof.subject}'`);
                }
            }
        }
    }
}
main();
//# sourceMappingURL=script-find-redundant.js.map