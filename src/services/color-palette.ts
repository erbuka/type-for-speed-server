export namespace ColorPalette {

    const hueStep = 36;
    const briStep = 10;

    export function initialize(): Promise<void> {
        colors = [];
        for(let hue = 0; hue < 360; hue+= hueStep) {
            for(let brightness = 10; brightness <= 70; brightness += briStep) {
                colors.push(`hsl(${hue}, 50%, ${brightness}%)`)
            }
        }
        return Promise.resolve();
    }
    
    export var colors: string[] = null;
}



