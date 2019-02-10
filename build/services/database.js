"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Loki = require("lokijs");
const C_PROFILES = "profiles";
const C_DB_FILE = "data/db.json";
class DB {
    static get profiles() { return this._db.getCollection(C_PROFILES); }
    static initialize() {
        return new Promise((resolve, reject) => {
            this._db = new Loki(C_DB_FILE, {
                autoload: true,
                autoloadCallback: (err) => {
                    if (err)
                        reject();
                    if (!this.profiles) {
                        this._db.addCollection(C_PROFILES, { unique: ['facebookId'] });
                    }
                    resolve();
                },
                autosave: true,
                autosaveInterval: 1000
            });
        });
    }
}
DB._db = null;
exports.DB = DB;
