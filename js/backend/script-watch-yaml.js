import fs from 'fs';
import { main as mainUpdateJsonFromYaml } from './script-update-json-from-yaml.js';
import { main as mainDeduce } from './script-deduce.js';
import { EXTENSION_YAML, Log, PATH_YAML } from './general.js';
function info(msg) {
    const date = new Date();
    console.log(`[\x1b[90m${date.toTimeString().slice(0, 8)}\x1b[0m] ${msg}\n`);
}
function main() {
    console.clear();
    info('Watching YAML files for changes ...');
    var cooldown = false;
    fs.watch(PATH_YAML, { recursive: true }, (eventType, filename) => {
        if (filename == null || !filename.endsWith('.' + EXTENSION_YAML))
            return;
        if (eventType != 'change' && eventType != 'rename')
            return;
        if (cooldown)
            return;
        cooldown = true;
        setTimeout(() => cooldown = false, 100);
        console.clear();
        info(`Detected file change (${filename}). Updating JSON files ...`);
        try {
            mainUpdateJsonFromYaml();
            mainDeduce();
        }
        catch (err) {
            Log.error(err.toString());
        }
        console.log();
        info('Watching YAML files for changes ...');
    });
}
main();
//# sourceMappingURL=script-watch-yaml.js.map