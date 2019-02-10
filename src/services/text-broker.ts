import * as fs from 'fs';
import { TextFile } from '../util/generate-texts'

export interface IText {
    source: string;
    text: string[];
}

export class TextBroker {

    private static texts: TextFile;

    static initialize() : Promise<void> {
        this.texts = JSON.parse(fs.readFileSync("data/texts.json", { encoding: 'utf-8' }));
        return Promise.resolve();
    }

    static getText(): Promise<IText> {
        return new Promise((resolve, reject) => {
            let text = this.fetchText();
            resolve({
                source :text.source,
                text: text.text.split(/\s+/).filter(s => s.length > 0)
            });
        });
    }

    static fetchText(): { source: string, text: string } {
        return this.texts[Math.floor(Math.random() * this.texts.length)];
    }
}