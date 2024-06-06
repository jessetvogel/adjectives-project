import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Book } from '../shared/core.js';
import { update_json } from './json-updater.js';
import { PATH_YAML, EXTENSION_YAML, Log } from './general.js';
// Finds all files (recursively) with the given extension inside the given directory.
// Returns a list of the paths to all files found.
// NOTE: ignore all hidden files (starting with .)
function find_files_with_extension(directory, extension) {
    const files = [];
    for (const file of fs.readdirSync(directory)) {
        if (file.startsWith('.'))
            continue;
        const file_path = path.join(directory, file);
        const file_stat = fs.statSync(file_path);
        if (file_stat.isDirectory())
            files.push(...find_files_with_extension(file_path, extension));
        if (file_stat.isFile() && file_path.endsWith('.' + extension))
            files.push(file_path);
    }
    return files;
}
function main() {
    try {
        // Create book from .yaml files
        const book = new Book();
        for (const file of find_files_with_extension(PATH_YAML, EXTENSION_YAML)) {
            try {
                const id = path.parse(file).name;
                const data = yaml.load(fs.readFileSync(file, 'utf8'));
                book.add(id, data);
            }
            catch (err) {
                Log.error(`Failed to load '${file}': ${err}`);
            }
        }
        book.verify();
        // Update json
        update_json(book);
        // Done
        Log.success('Done');
    }
    catch (err) {
        Log.error(err.toString());
    }
}
main();
//# sourceMappingURL=script-update-json-from-yaml.js.map