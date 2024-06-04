export const PATH_YAML = './data';
export const PATH_JSON = './json';
export const PATH_SUMMARY = './json/summary.json';
export const EXTENSION_YAML = 'yaml';
export class Log {
    static error(msg) { console.log(`🚨 ${msg}`); }
    static info(msg) { console.log(`💬 ${msg}`); }
    static warning(msg) { console.log(`⚠️ ${msg}`); }
    static action(msg) { console.log(`👉 ${msg}`); }
    static success(msg) { console.log(`✅ ${msg}`); }
}
;
//# sourceMappingURL=general.js.map