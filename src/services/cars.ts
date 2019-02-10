export namespace Cars {

    export var models: string[] = [];

    export function initialize(): Promise<void> {
        models = ["Fiat 500", "Fiat 500L", "Fiat 500XL"];
        return Promise.resolve();
    }

}