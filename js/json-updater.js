import fs from 'fs';
import path from 'path';
import { PATH_JSON, PATH_SUMMARY } from './general.js';
function update_object(source, target) {
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
function update_json_file(file_path, data) {
    // Update the json file with data, but also keep the original data (overwrite when applies)
    try {
        let json;
        let changes;
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
            console.log(`✅ Updated '${file_path}'`);
        }
    }
    catch (err) {
        console.log(`Failed to update '${file_path}': ${err}`);
    }
}
function update_summary(book) {
    update_json_file(PATH_SUMMARY, book.serialize());
}
export function update_json(book) {
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
//# sourceMappingURL=json-updater.js.map