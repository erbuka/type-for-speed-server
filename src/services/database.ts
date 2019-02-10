import * as Loki from "lokijs";
import * as fs from 'fs';

const C_PROFILES = "profiles";
const C_DB_FILE = "data/db.json";

export class DB {

    private static _db: Loki = null;

    static get profiles(): Loki.Collection { return this._db.getCollection(C_PROFILES); }

    static initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._db = new Loki(C_DB_FILE, {
                autoload: true,
                autoloadCallback: (err: any) => {
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