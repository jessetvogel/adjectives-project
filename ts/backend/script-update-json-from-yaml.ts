import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import { Book } from '../shared/core.js';
import { updateJSON } from './json-updater.js';
import { PATH_YAML, EXTENSION_YAML, Log } from './general.js';

// finds all files (recursively) with the given extension inside the given directory.
// returns a list of the paths to all files found.
// NOTE: ignore all hidden files (starting with .)
function findFilesWithExtension(directory: string, extension: string): string[] {
    const files: string[] = [];
    for (const file of fs.readdirSync(directory)) {
        if (file.startsWith('.')) continue;
        const filePath = path.join(directory, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory())
            files.push(...findFilesWithExtension(filePath, extension));
        if (fileStat.isFile() && filePath.endsWith('.' + extension))
            files.push(filePath);
    }
    return files;
}

function main() {
    const book = new Book();

    Log.action('Reading YAML files', () => {
        // create book from .yaml files
        for (const file of findFilesWithExtension(PATH_YAML, EXTENSION_YAML)) {
            try {
                const id = path.parse(file).name;
                const data = yaml.load(fs.readFileSync(file, 'utf8'));
                book.add(id, data);
            }
            catch (err: any) {
                throw new Error(`Failed to load '${file}': ${err}`);
            }
        }
        book.verify();
    });

    // update json
    let changedFiles = 0;
    Log.action('Writing JSON files', () => {
        changedFiles = updateJSON(book);
    });
    Log.info(`${changedFiles} JSON file(s) were updated`);
}

main();
