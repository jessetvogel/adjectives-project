import fs from 'fs';
import { main as mainUpdateJsonFromYaml } from './script-update-json-from-yaml.js';
import { main as mainDeduce } from './script-deduce.js';
import { PATH_YAML } from './general.js';
function info(msg) {
    const date = new Date();
    console.log(`[\x1b[90m${date.toTimeString().slice(0, 8)}\x1b[0m] ${msg}`);
}
function main() {
    console.clear();
    info('Watching YAML files for changes ...');
    fs.watch(PATH_YAML, { recursive: true }, (eventType, filename) => {
        console.clear();
        if (eventType == 'change' || eventType == 'rename') { // NOTE: this is always true
            info(`Detected file change (${filename}). Updating JSON files ...`);
            mainUpdateJsonFromYaml();
            mainDeduce();
        }
        info('Watching YAML files for changes ...');
    });
}
main();
//# sourceMappingURL=script-watch-yaml.js.map