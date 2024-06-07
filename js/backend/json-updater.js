import fs from 'fs';
import path from 'path';
import { Log, PATH_JSON, PATH_QUESTIONS, PATH_SUMMARY } from './general.js';
function updateObject(source, target) {
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
function updateJSONFile(filePath, data) {
    // Update the json file with data, but also keep the original data (overwrite when applies)
    try {
        let json;
        let changes;
        if (fs.existsSync(filePath)) {
            json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            changes = updateObject(json, data);
        }
        else {
            json = data;
            changes = true;
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        if (changes) {
            fs.writeFileSync(filePath, JSON.stringify(json), 'utf8');
            Log.success(`Updated '${filePath}'`);
        }
    }
    catch (err) {
        Log.error(`Failed to update '${filePath}': ${err}`);
    }
}
function updateSummary(book) {
    updateJSONFile(PATH_SUMMARY, book.serialize());
}
export function updateJSON(book) {
    // Update all json files
    for (const id in book.types)
        updateJSONFile(`${PATH_JSON}/types/${id}.json`, book.serializeType(book.types[id], true));
    for (const type in book.adjectives)
        for (const id in book.adjectives[type])
            updateJSONFile(`${PATH_JSON}/adjectives/${type}/${id}.json`, book.serializeAdjective(book.adjectives[type][id], true));
    for (const type in book.theorems)
        for (const id in book.theorems[type])
            updateJSONFile(`${PATH_JSON}/theorems/${type}/${id}.json`, book.serializeTheorem(book.theorems[type][id], true));
    for (const type in book.examples)
        for (const id in book.examples[type])
            updateJSONFile(`${PATH_JSON}/examples/${type}/${id}.json`, book.serializeExample(book.examples[type][id], true));
    // Update the summary file
    updateSummary(book);
}
export function updateQuestions(questions) {
    fs.writeFileSync(PATH_QUESTIONS, JSON.stringify(questions), 'utf8');
}
//# sourceMappingURL=json-updater.js.map