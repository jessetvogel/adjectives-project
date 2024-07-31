export const PATH_YAML = './data';
export const PATH_JSON = './public/json';
export const PATH_SUMMARY = './public/json/summary.json';
export const EXTENSION_YAML = 'yaml';

export class Log {

    static error(msg: string): void { console.log(`🚨 ${msg}`); }
    static info(msg: string): void { console.log(`💬 ${msg}`); }
    static warning(msg: string): void { console.log(`⚠️ ${msg}`); }
    static print(msg: string): void { console.log(msg); }

    static action(msg: string, fn: Function): void {
        process.stdout.write(`⏳ ${msg} ...`);

        fn();

        if (process.stdout.clearLine && process.stdout.cursorTo) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        else {
            process.stdout.write('\n');
        }
        process.stdout.write(`✅ ${msg}    \n`);
    }

};
