"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
let files = fs.readdirSync("data_sources");
let texts = [];
for (let file of files.filter(f => f.endsWith(".txt"))) {
    let source = file.substring(0, file.length - 4);
    let content = fs.readFileSync(`data_sources/${file}`, { encoding: "utf-8" });
    let paragraphs = content.split(/[\n\r]/).filter(s => s.length >= 100 && s.length < 200).map(p => {
        return {
            source: source,
            text: p
        };
    });
    texts.push(...paragraphs);
}
fs.writeFileSync("data/texts.json", JSON.stringify(texts), { encoding: "utf-8" });
