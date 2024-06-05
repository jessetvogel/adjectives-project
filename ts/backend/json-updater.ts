import fs from 'fs'
import path from 'path'

import { Book } from '../shared/core.js'
import { Log, PATH_JSON, PATH_SUMMARY } from './general.js';

function update_object(source: any, target: any): boolean { // returns true if any actual change was made
    let changes = false;
    for (const key in target) {
        if (!(key in source)) {
            source[key] = target[key]; // NOTE: probably safer to make a copy, but we never write in source[key] again
            changes = true;
        }

        // check type compatibility
        const typeof_source_key = typeof source[key];
        const typeof_target_key = typeof target[key];
        if (typeof_source_key != typeof_target_key)
            throw new Error(`Cannot update field '${key}' of type '${typeof_source_key}' with object of type '${typeof_target_key}'`);

        if (typeof_source_key == 'object') { // update objects or arrays
            if (update_object(source[key], target[key]))
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

function update_json_file(file_path: string, data: any): void {
    // Update the json file with data, but also keep the original data (overwrite when applies)
    try {
        let json: any;
        let changes: boolean;
        if (fs.existsSync(file_path)) {
            json = JSON.parse(fs.readFileSync(file_path, 'utf8'));
            changes = update_object(json, data);
        }
        else {
            json = data;
            changes = true;
            fs.mkdirSync(path.dirname(file_path), { recursive: true });
        }
        if (changes) {
            fs.writeFileSync(file_path, JSON.stringify(json), 'utf8');
            Log.success(`Updated '${file_path}'`);
        }
    }
    catch (err) {
        Log.error(`Failed to update '${file_path}': ${err}`);
    }
}

function update_summary(book: Book): void {
    update_json_file(PATH_SUMMARY, book.serialize());
}

export function update_json(book: Book): void {
    // Update all json files
    for (const id in book.types)
        update_json_file(`${PATH_JSON}/types/${id}.json`, book.serialize_type(book.types[id], true));
    for (const type in book.adjectives)
        for (const id in book.adjectives[type])
            update_json_file(`${PATH_JSON}/adjectives/${type}/${id}.json`, book.serialize_adjective(book.adjectives[type][id], true));
    for (const type in book.theorems)
        for (const id in book.theorems[type])
            update_json_file(`${PATH_JSON}/theorems/${type}/${id}.json`, book.serialize_theorem(book.theorems[type][id], true));
    for (const type in book.examples)
        for (const id in book.examples[type])
            update_json_file(`${PATH_JSON}/examples/${type}/${id}.json`, book.serialize_example(book.examples[type][id], true));

    // Update the summary file
    update_summary(book);
}
