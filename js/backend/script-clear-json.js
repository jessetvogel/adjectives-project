import fs from 'fs';
import { Log, PATH_JSON } from './general.js';
function main() {
    try {
        Log.action(`Deleting '${PATH_JSON}'`);
        fs.rmSync(PATH_JSON, { recursive: true });
        Log.action(`Creating '${PATH_JSON}'`);
        fs.mkdirSync(PATH_JSON);
        Log.success('Done');
    }
    catch (err) {
        Log.error(err.stack);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=script-clear-json.js.map