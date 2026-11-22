// Minimal DOM shim for HTML serialization in Node (same contract as test shims).
'use strict';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
class El {
  constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}; this._text = ''; this.className = ''; this.dir = ''; }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(c) { this.children.push(c); return c; }
  insertBefore(n) { this.children.unshift(n); }
  get firstChild() { return this.children[0]; }
  get textContent() { return this.children.length ? this.children.map((c) => c.textContent).join('') : this._text; }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) { this._html = v; }
  get innerHTML() { return this._html || ''; }
  outerHTML() {
    const attrs = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
      + (this.className ? ` class="${esc(this.className)}"` : '')
      + (this.dir ? ` dir="${esc(this.dir)}"` : '')
      + Object.entries(this.dataset).map(([k, v]) => ` data-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${esc(v)}"`).join('');
    const style = Object.entries(this.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
    const inner = this.children.length ? this.children.map((c) => c.outerHTML()).join('') : (this._html || esc(this._text));
    return `<${this.tagName}${attrs}${style ? ` style="${esc(style)}"` : ''}>${inner}</${this.tagName}>`;
  }
}
module.exports = {
  createElement: (t) => new El(t),
  createTextNode: (t) => ({ _text: String(t), get textContent() { return this._text; }, outerHTML() { return esc(this._text); } })
};
