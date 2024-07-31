import fs from 'fs'
import path from 'path'

import { Book } from '../shared/core.js'
import { Log, PATH_JSON, PATH_SUMMARY } from './general.js';

function updateObject(source: any, target: any): boolean { // returns true if any actual change was made
    let changes = false;
    for (const key in target) {
        if (!(key in source)) {
            source[key] = target[key]; // NOTE: probably safer to make a copy, but we never write in source[key] again
            changes = true;
        }

        // check type compatibility
        const typeSourceKey = typeof source[key];
        const typeTargetKey = typeof target[key];
        if (typeSourceKey != typeTargetKey)
            throw new Error(`Cannot update field '${key}' of type '${typeSourceKey}' with object of type '${typeTargetKey}'`);

        if (typeSourceKey == 'object') { // update objects or arrays
            if (updateObject(source[key], target[key]))
                changes = true;
        }
        else { // update string, number of booleans
            if (source[key] != target[key]) {
                source[key] = target[key];
                changes = true;
            }
        }
    }
    return changes;
}

function updateJSONFile(filePath: string, data: any): number {
    // update the json file with data, but also keep the original data (overwrite when applies)
    try {
        let json: any;
        let changes: boolean;
        if (fs.existsSync(filePath)) {
            json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            changes = updateObject(json, data);
        }
        else {
            json = data;
            changes = true;
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        if (changes)
            fs.writeFileSync(filePath, JSON.stringify(json), 'utf8');
        return changes ? 1 : 0;
    }
    catch (err) {
        Log.error(`Failed to update '${filePath}': ${err}`);
        return 0;
    }
}

function updateSummary(book: Book): number {
    return updateJSONFile(PATH_SUMMARY, book.serialize());
}

export function updateJSON(book: Book): number {
    let changedFiles = 0;
    // update all json files
    for (const id in book.types)
        changedFiles += updateJSONFile(`${PATH_JSON}/types/${id}.json`, book.serializeType(book.types[id], true));
    for (const type in book.adjectives)
        for (const id in book.adjectives[type])
            changedFiles += updateJSONFile(`${PATH_JSON}/adjectives/${type}/${id}.json`, book.serializeAdjective(book.adjectives[type][id], true));
    for (const type in book.theorems)
        for (const id in book.theorems[type])
            changedFiles += updateJSONFile(`${PATH_JSON}/theorems/${type}/${id}.json`, book.serializeTheorem(book.theorems[type][id], true));
    for (const type in book.examples)
        for (const id in book.examples[type])
            changedFiles += updateJSONFile(`${PATH_JSON}/examples/${type}/${id}.json`, book.serializeExample(book.examples[type][id], true));

    // update the summary file
    changedFiles += updateSummary(book);

    return changedFiles;
}
