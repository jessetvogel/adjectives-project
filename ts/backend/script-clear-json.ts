import fs from 'fs';

import { Log, PATH_JSON } from './general.js';

// delete json directory if it exists
if (fs.existsSync(PATH_JSON)) {
    Log.action(`Deleting '${PATH_JSON}'`, () => {
        fs.rmSync(PATH_JSON, { recursive: true });
    });
}

// create a fresh json directory
Log.action(`Creating '${PATH_JSON}'`, () => {
    fs.mkdirSync(PATH_JSON);
});
