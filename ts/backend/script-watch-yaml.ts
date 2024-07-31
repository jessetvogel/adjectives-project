import fs from 'fs';
import { spawn } from 'child_process';

import { EXTENSION_YAML, PATH_YAML } from './general.js';

function info(msg: string): void {
    const date = new Date();
    console.log(`[\x1b[90m${date.toTimeString().slice(0, 8)}\x1b[0m] ${msg}\n`);
}

function main() {
    console.clear();
    info('Watching YAML files for changes ...');

    var cooldown = false; // prevent events to double fire
    fs.watch(PATH_YAML, { recursive: true }, async (eventType, filename) => {
        if (filename == null || !filename.endsWith('.' + EXTENSION_YAML)) return;
        if (eventType != 'change' && eventType != 'rename') return;
        if (cooldown) return;
        cooldown = true;
        setTimeout(() => cooldown = false, 100);

        console.clear();
        info(`Detected file change (${filename}). Updating JSON files ...`);

        const code = await launchChild('npm', ['run', 'update-json-from-yaml']);
        if (code == 0) await launchChild('npm', ['run', 'deduce']);

        console.log();
        info('Watching YAML files for changes ...');
    });
}

async function launchChild(cmd: string, args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args);

        child.stdout.on('data', (data) => process.stdout.write(data.toString()));
        child.stderr.on('data', (data) => process.stdout.write(data.toString()));

        child.on('exit', resolve);
    });
}

main();
