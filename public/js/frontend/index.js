import { pageExplore } from './page-explore.js';
import { pageHome } from './page-home.js';
import { pageData } from './page-data.js';
import { pageExample } from './page-example.js';
import { pageAdjective } from './page-adjective.js';
import { pageTheorem } from './page-theorem.js';
import { $, onClick, clear, create } from './util.js';
import { Book } from '../shared/core.js';
function navigate(url, state) {
    window.history.pushState(state, '', url);
    navigateCallback(state);
}
function navigateCallback(state) {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    if (!('page' in query) || query.page == 'home')
        setContent(pageHome());
    switch (query.page) {
        case 'explore': return setContent(pageExplore(query));
        case 'data': return setContent(pageData(query));
        case 'example': return setContent(pageExample(summary, query));
        case 'adjective': return setContent(pageAdjective(summary, query));
        case 'theorem': return setContent(pageTheorem(summary, query));
    }
    setContent(create('div', {}, '404 Page Not Found'));
}
function setContent(elem) {
    const content = $('content');
    if (!content)
        throw new Error(`[ERROR] Element with id '${content}' does not exist`);
    clear(content); // clear content
    content.append(elem); // set content
}
function mapButton(id, url, state) {
    const button = $(id);
    if (button == null)
        throw new Error(`[ERROR] Element with id '${id}' does not exist`);
    onClick(button, () => navigate(url, state));
}
let summary;
async function main() {
    summary = new Book(await (await fetch('json/summary.json')).json()); // load summary
    summary.verify();
    window.onpopstate = (event) => navigateCallback(event.state);
    navigateCallback({});
    mapButton('button-explore', '?page=explore', {});
    mapButton('button-data', '?page=data', {});
}
main();
//# sourceMappingURL=index.js.map