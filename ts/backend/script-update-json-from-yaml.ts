import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import { Book } from '../shared/core.js';
import { updateJSON } from './json-updater.js';
import { PATH_YAML, EXTENSION_YAML, Log } from './general.js';
import { fileURLToPath } from 'url';

// Finds all files (recursively) with the given extension inside the given directory.
// Returns a list of the paths to all files found.
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

export function main() {
    try {
        // Create book from .yaml files
        const book = new Book();
        for (const file of findFilesWithExtension(PATH_YAML, EXTENSION_YAML)) {
            try {
                const id = path.parse(file).name;
                const data = yaml.load(fs.readFileSync(file, 'utf8'));
                book.add(id, data);
            }
            catch (err) {
                throw new Error(`Failed to load '${file}': ${err.stack}`);
            }
        }
        book.verify();

        // Update json
        updateJSON(book);

        // Done
        Log.success('Done');
        return 0;
    } catch (err: any) {
        Log.error(err.toString());
        return 1;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
    process.exit(main());
