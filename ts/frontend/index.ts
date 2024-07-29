import { $, addClass, create, getCookie, hasClass, onClick, setCookie, toggleClass } from './util.js';
import { Book } from '../shared/core.js';
import navigation from './navigation.js';

let summary: Book;

async function main() {
    try {
        // load summary
        summary = new Book(await (await fetch('json/summary.json', { cache: 'reload' })).json()); // load summary
        summary.verify();
    }
    catch (err) {
        console.log(err);

        const content = $('content') as HTMLElement;
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            content.append(create('div', { class: 'page page-home' }, [
                create('span', { class: 'title' }, '🥺 Failed to load <span class="tt">summary.json</span> ..'),
                create('p', {}, 'Make sure to update the JSON directory by running the following commands.'),
                create('p', { class: 'tt' }, 'npm run clear-json<br/>npm run update-json-from-yaml<br/>npm run deduce')
            ]));
        }
        else {
            content.append(create('div', { class: 'page page-home' }, [
                create('span', { class: 'title' }, '🥺 An error occured in fetching the data..'),
                create('p', { style: 'text-align: center;' }, 'We are sorry for the inconvenience. Please come back later.')
            ]));
        }
        return;
    }

    // initialize navigation
    navigation.init(summary, $('content') as HTMLElement);

    // initialize theme
    initTheme();
}

function initTheme(): void {
    // toggle theme by clicking button
    const buttonTheme = $('button-theme') as HTMLButtonElement;
    onClick(buttonTheme, () => {
        toggleClass(document.body, 'dark');
        setCookie('theme', hasClass(document.body, 'dark') ? 'dark' : 'light', 365);
    });
    // set initial theme by cookie
    if (getCookie('theme') == 'dark')
        addClass(document.body, 'dark');
    // little hack to prevent initial transition, but it works
    setTimeout(function () {
        const sheet = window.document.styleSheets[0];
        sheet.insertRule('* { transition: background-color 0.2s, color 0.2s; }', sheet.cssRules.length);
    }, 100);
}

window.onload = main;
