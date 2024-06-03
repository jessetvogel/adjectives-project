import fs from 'fs'
import { Book } from './core.js'

const PATH_JSON = './json';
const PATH_BOOK_JSON = `${PATH_JSON}/book.json`;

function update_json_file(path: string, data: any): void {
    // TODO: update the json file with data, but also keep the original data. do overwrite
    console.log(path, data);
}

function main() {
    try {
        // Load data from `book.json`
        const data = JSON.parse(fs.readFileSync(PATH_BOOK_JSON, 'utf8'));

        // Create book from data
        const book = new Book(data);

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
    } catch (err) {
        console.log(err);
    }
}

main();
