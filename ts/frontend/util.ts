export function $(id: string): HTMLElement | null {
    return document.getElementById(id);
}

export function $$(selector: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(selector));
}

export function create(tag: string, properties?: { [key: string]: any }, content?: string | HTMLElement | (string | HTMLElement)[]): HTMLElement {
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
        if (typeof content === 'string') elem.innerHTML = content;
        if (content instanceof HTMLElement) elem.append(content);
        if (Array.isArray(content)) {
            for (const child of content) {
                if (typeof child === 'string') elem.insertAdjacentHTML('beforeend', child);
                if (child instanceof HTMLElement) elem.append(child);
            }
        }
    }

    return elem;
}

export function clear(elem: HTMLElement): void {
    elem.innerHTML = '';
}

export function onClick(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('click', f);
}

export function onMouseDown(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('mousedown', f);
}

export function onMouseUp(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('mouseup', f);
}

export function onMouseMove(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('mousemove', f);
}

export function onWheel(elem: HTMLElement, f: (this: HTMLElement, ev: WheelEvent) => any): void {
    elem.addEventListener('wheel', f);
}

export function onContextMenu(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('contextmenu', f);
}

export function onChange(elem: HTMLElement, f: (this: HTMLElement, ev: Event) => any): void {
    elem.addEventListener('change', f);
}

export function onInput(elem: HTMLElement, f: (this: HTMLElement, ev: Event) => any): void {
    elem.addEventListener('input', f);
}

export function onRightClick(elem: HTMLElement, f: (this: HTMLElement, ev: MouseEvent) => any): void {
    elem.addEventListener('contextmenu', f);
}

export function onKeyPress(elem: HTMLElement, f: (this: HTMLElement, ev: KeyboardEvent) => any): void {
    elem.addEventListener('keypress', f);
}

export function onKeyDown(elem: HTMLElement, f: (this: HTMLElement, ev: KeyboardEvent) => any): void {
    elem.addEventListener('keydown', f);
}

export function onKeyUp(elem: HTMLElement, f: (this: HTMLElement, ev: KeyboardEvent) => any): void {
    elem.addEventListener('keyup', f);
}

export function onDrop(elem: HTMLElement, f: (this: HTMLElement, ev: DragEvent) => any): void {
    elem.addEventListener('drop', f);
}

export function onDragOver(elem: HTMLElement, f: (this: HTMLElement, ev: DragEvent) => any): void {
    elem.addEventListener('dragover', f);
}

export function addClass(elem: HTMLElement, c: string): void {
    elem.classList.add(c);
}

export function removeClass(elem: HTMLElement, c: string): void {
    elem.classList.remove(c);
}

export function hasClass(elem: HTMLElement, c: string): boolean {
    return elem.classList.contains(c);
}

export function toggleClass(elem: HTMLElement, c: string): void {
    hasClass(elem, c) ? removeClass(elem, c) : addClass(elem, c);
}

export function setHTML(elem: HTMLElement, html: string): void {
    elem.innerHTML = html;
}

export function setText(elem: HTMLElement, text: string): void {
    elem.innerText = text;
}

export function requestGET(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.responseText); };
        xhr.onerror = reject;
        xhr.open('GET', url);
        xhr.send();
    });
}

export function requestPOST(url: string, data: string | object): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.responseText); };
        xhr.onerror = reject;
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(typeof data === 'string' ? data : JSON.stringify(data));
    });
}

export function requestHEAD(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(this.status == 200); };
        xhr.onerror = reject;
        xhr.open('HEAD', url);
        xhr.send();
    });
}

export function cssVariable(name: string): string {
    return getComputedStyle(document.body).getPropertyValue(name);
}

export function setCookie(name: string, value: string, days: number): void {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

export function getCookie(name: string): string | null {
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
