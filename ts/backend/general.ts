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
        const fancy = ('clearLine' in process.stdout && 'cursorTo' in process.stdout);

        function write(msg: string) {
            if (fancy) process.stdout.write(msg);
            else console.log(msg);
        }

        function overwrite(msg: string) {
            if (fancy) {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(msg + '\n');
            }
            else {
                console.log(msg);
            }
        }

        write(`⏳ ${msg} ...`);

        try {
            fn();
        }
        catch (err: any) {
            if (fancy) write('\n');
            Log.error(`${err}`);
            process.exit(1);
        }

        overwrite(`✅ ${msg}    `);
    }
};
