import fs from 'fs';
import path from 'path'
import * as sass from 'sass';
import { Log } from './general.js';

const SASS_CONFIG = {
    'scss/index.scss': 'public/css/index.css'
};

try {
    for (const [input, output] of Object.entries(SASS_CONFIG)) {
        Log.action(`Compiling '${input}' to '${output}'`, () => {
            // compile input file
            const result = sass.compile(input, { style: 'compressed' });
            // create directory for output file
            const directory = path.dirname(output);
            fs.mkdirSync(directory, { recursive: true });
            // write to output file
            fs.writeFileSync(output, result.css);
        });
    }
}
catch (err) {
    Log.error(err);
}
