"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class TextBroker {
    static initialize() {
        this.texts = JSON.parse(fs.readFileSync("data/texts.json", { encoding: 'utf-8' }));
        return Promise.resolve();
    }
    static getText() {
        return new Promise((resolve, reject) => {
            let text = this.fetchText();
            resolve({
                source: text.source,
                text: text.text.split(/\s+/).filter(s => s.length > 0)
            });
        });
    }
    static fetchText() {
        return this.texts[Math.floor(Math.random() * this.texts.length)];
    }
}
exports.TextBroker = TextBroker;
