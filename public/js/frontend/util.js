export function $(id) {
    return document.getElementById(id);
}
export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}
export function create(tag, properties, content) {
    const elem = document.createElement(tag);
    if (properties !== undefined) {
        for (const key in properties) {
            if (key.startsWith('@'))
                elem.addEventListener(key.substring(1), properties[key]);
            else
                elem.setAttribute(key, properties[key]);
        }
    }
    if (content !== undefined) {
        if (typeof content === 'string')
            elem.innerHTML = content;
        if (content instanceof HTMLElement)
            elem.append(content);
        if (Array.isArray(content)) {
            for (const child of content) {
                if (typeof child === 'string')
                    elem.insertAdjacentHTML('beforeend', child);
                if (child instanceof HTMLElement)
                    elem.append(child);
            }
        }
    }
    return elem;
}
export function clear(elem) {
    elem.innerHTML = '';
}
export function onClick(elem, f) {
    elem.addEventListener('click', f);
}
export function onMouseDown(elem, f) {
    elem.addEventListener('mousedown', f);
}
export function onMouseUp(elem, f) {
    elem.addEventListener('mouseup', f);
}
export function onMouseMove(elem, f) {
    elem.addEventListener('mousemove', f);
}
export function onWheel(elem, f) {
    elem.addEventListener('wheel', f);
}
export function onContextMenu(elem, f) {
    elem.addEventListener('contextmenu', f);
}
export function onChange(elem, f) {
    elem.addEventListener('change', f);
}
export function onInput(elem, f) {
    elem.addEventListener('input', f);
}
export function onRightClick(elem, f) {
    elem.addEventListener('contextmenu', f);
}
export function onKeyPress(elem, f) {
    elem.addEventListener('keypress', f);
}
export function onKeyDown(elem, f) {
    elem.addEventListener('keydown', f);
}
export function onKeyUp(elem, f) {
    elem.addEventListener('keyup', f);
}
export function onDrop(elem, f) {
    elem.addEventListener('drop', f);
}
export function onDragOver(elem, f) {
    elem.addEventListener('dragover', f);
}
export function addClass(elem, c) {
    elem.classList.add(c);
}
export function removeClass(elem, c) {
    elem.classList.remove(c);
}
export function hasClass(elem, c) {
    return elem.classList.contains(c);
}
export function toggleClass(elem, c) {
    hasClass(elem, c) ? removeClass(elem, c) : addClass(elem, c);
}
export function setHTML(elem, html) {
    elem.innerHTML = html;
}
export function setText(elem, text) {
    elem.innerText = text;
}
export function requestGET(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.responseText); };
        xhr.onerror = reject;
        xhr.open('GET', url);
        xhr.send();
    });
}
export function requestPOST(url, data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.responseText); };
        xhr.onerror = reject;
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(typeof data === 'string' ? data : JSON.stringify(data));
    });
}
export function requestHEAD(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.status == 200); };
        xhr.onerror = reject;
        xhr.open('HEAD', url);
        xhr.send();
    });
}
export function cssVariable(name) {
    return getComputedStyle(document.body).getPropertyValue(name);
}
export function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}
export function getCookie(name) {
    const cookies = decodeURIComponent(document.cookie).split(';');
    const needle = `${name}=`;
    for (let c of cookies) {
        while (c.charAt(0) == ' ')
            c = c.substring(1);
        if (c.indexOf(needle) == 0)
            return c.substring(needle.length, c.length);
    }
    return null;
}
