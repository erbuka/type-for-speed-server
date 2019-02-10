"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ColorPalette;
(function (ColorPalette) {
    const hueStep = 36;
    const briStep = 10;
    function initialize() {
        ColorPalette.colors = [];
        for (let hue = 0; hue < 360; hue += hueStep) {
            for (let brightness = 10; brightness <= 70; brightness += briStep) {
                ColorPalette.colors.push(`hsl(${hue}, 50%, ${brightness}%)`);
            }
        }
        return Promise.resolve();
    }
    ColorPalette.initialize = initialize;
    ColorPalette.colors = null;
})(ColorPalette = exports.ColorPalette || (exports.ColorPalette = {}));
