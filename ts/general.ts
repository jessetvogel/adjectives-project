export const PATH_YAML = './data';
export const PATH_JSON = './json';
export const PATH_SUMMARY = './json/summary.json';
export const EXTENSION_YAML = 'yaml';

export class Log {
    static error(msg: string): void { console.log(`🚨 ${msg}`); }
    static info(msg: string): void { console.log(`💬 ${msg}`); }
    static warning(msg: string): void { console.log(`⚠️ ${msg}`); }
    static action(msg: string): void { console.log(`👉 ${msg}`); }
    static success(msg: string): void { console.log(`✅ ${msg}`); }
};
