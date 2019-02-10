"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cars;
(function (Cars) {
    Cars.models = [];
    function initialize() {
        Cars.models = ["Fiat 500", "Fiat 500L", "Fiat 500XL"];
        return Promise.resolve();
    }
    Cars.initialize = initialize;
})(Cars = exports.Cars || (exports.Cars = {}));
