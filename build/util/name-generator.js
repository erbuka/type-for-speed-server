"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adjectives = [
    "angry", "sad", "happy", "calm", "peaceful", "beatiful", "ugly", "cute", "hungry", "thristy",
];
const nouns = [
    "bird", "dog", "cat", "lion", "crocodile", "elephant", "tiger", "cow", "pig"
];
var NameGenerator;
(function (NameGenerator) {
    function randomElement(a) {
        return a[Math.floor(Math.random() * a.length)];
    }
    function generate() {
        let n = 100 + Math.floor(Math.random() * 900);
        return `${randomElement(adjectives)}.${randomElement(nouns)}.${n}`;
    }
    NameGenerator.generate = generate;
})(NameGenerator = exports.NameGenerator || (exports.NameGenerator = {}));
