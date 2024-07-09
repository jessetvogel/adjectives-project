import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Book } from '../shared/core.js';
import { updateJSON } from './json-updater.js';
import { PATH_YAML, EXTENSION_YAML, Log } from './general.js';
import { fileURLToPath } from 'url';
function findFilesWithExtension(directory, extension) {
    const files = [];
    for (const file of fs.readdirSync(directory)) {
        if (file.startsWith('.'))
            continue;
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
    updateJSON(book);
    Log.success('Done');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        main();
    }
    catch (err) {
        Log.error(err.toString());
        process.exit(1);
    }
}
//# sourceMappingURL=script-update-json-from-yaml.js.map