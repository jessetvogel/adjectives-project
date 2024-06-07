export const PATH_YAML = './data';
export const PATH_JSON = './public/json';
export const PATH_SUMMARY = './public/json/summary.json';
export const PATH_QUESTIONS = './public/json/questions.json';
export const EXTENSION_YAML = 'yaml';

export class Log {
    static error(msg: string): void { console.log(`🚨 ${msg}`); }
    static info(msg: string): void { console.log(`💬 ${msg}`); }
    static warning(msg: string): void { console.log(`⚠️ ${msg}`); }
    static action(msg: string): void { console.log(`👉 ${msg}`); }
    static success(msg: string): void { console.log(`✅ ${msg}`); }
};
