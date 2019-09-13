"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UID {
    constructor(bits) {
        this.bits = bits;
        this._nextInt = 0;
    }
    next() {
        let val = this._nextInt = (this._nextInt + 1) % (1 << this.bits);
        // Even bits are inverted
        let mask = 0;
        for (let i = 0; i < this.bits; i++) {
            if (i % 2 === 0)
                mask |= 1 << i;
        }
        val ^= mask;
        return UID.toHexString(val, this.bits);
    }
    static toHexString(val, bits) {
        let lc = Math.ceil(bits / 4);
        let result = "";
        for (let i = 0; i < lc; i++) {
            let v = (val & (15 << i * 4)) >> (i * 4);
            result += UID._map[v];
        }
        return result;
    }
}
UID._map = [
    "0", "1",
    "2", "3",
    "4", "5",
    "6", "7",
    "8", "9",
    "A", "B",
    "C", "D",
    "E", "F"
];
exports.UID = UID;
