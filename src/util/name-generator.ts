
const adjectives = [
    "angry", "sad", "happy", "calm", "peaceful", "beatiful", "ugly", "cute", "hungry", "thristy",
];

const nouns = [
    "bird", "dog", "cat", "lion", "crocodile", "elephant", "tiger", "cow", "pig"
];

export namespace NameGenerator {

    function randomElement(a: any[]) {
        return a[Math.floor(Math.random() * a.length)];
    }

    export function generate(): string {
        let n = 100 + Math.floor(Math.random() * 900);
        return `${randomElement(adjectives)}.${randomElement(nouns)}.${n}`;
    }
}