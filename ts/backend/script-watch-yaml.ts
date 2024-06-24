import fs from 'fs';

import { main as mainUpdateJsonFromYaml } from './script-update-json-from-yaml.js';
import { main as mainDeduce } from './script-deduce.js';
import { PATH_YAML } from './general.js';

function info(msg: string): void {
    const date = new Date();
    console.log(`[\x1b[90m${date.toTimeString().slice(0, 8)}\x1b[0m] ${msg}\n`);
}

function main() {
    console.clear();
    info('Watching YAML files for changes ...');

    fs.watch(PATH_YAML, { recursive: true }, (eventType, filename) => {
        console.clear();
        if (eventType == 'change' || eventType == 'rename') { // NOTE: this is always true
            info(`Detected file change (${filename}). Updating JSON files ...`);
            if (mainUpdateJsonFromYaml() == 1) { console.log(); info('Error in updating JSON from YAML files. Aborting.'); }
            else if (mainDeduce() == 1) { console.log(); info('Error in deducing new adjectives. Aborting.'); }
            else console.log();
        }
        info('Watching YAML files for changes ...');
    });
}

main();
