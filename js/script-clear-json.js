import fs from 'fs';
import { PATH_JSON } from './general.js';
function main() {
    try {
        // Delete json directory, and create a fresh one
        console.log(`👉 Deleting '${PATH_JSON}' ...`);
        fs.rmSync(PATH_JSON, { recursive: true });
        console.log(`👉 Creating '${PATH_JSON}' ...`);
        fs.mkdirSync(PATH_JSON);
        console.log('✅ Done');
    }
    catch (err) {
        console.log(`🚨 ${err}`);
    }
}
main();
//# sourceMappingURL=script-clear-json.js.map