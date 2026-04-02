/**
 * DOM manipulation utilities
 * ES5 compatible helper functions
 */

export function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function $$<T extends HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

export function createElement(tag: string, attrs?: Record<string, string>, children?: Array<Node | string>): HTMLElement {
  var el = document.createElement(tag);

  if (attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
  }

  if (children) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
}

export function appendHtml(parent: HTMLElement, html: string): void {
  var div = document.createElement('div');
  div.innerHTML = html;
  while (div.firstChild) {
    parent.appendChild(div.firstChild);
  }
}

export function scrollToBottom(element: HTMLElement): void {
  element.scrollTop = element.scrollHeight;
}

export function escapeHtml(text: string): string {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
