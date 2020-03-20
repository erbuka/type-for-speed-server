"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uid_1 = require("./util/uid");
const com_interface_1 = require("./com-interface");
const database_1 = require("./services/database");
const color_palette_1 = require("./services/color-palette");
const name_generator_1 = require("./util/name-generator");
class TOSClient {
    constructor(connection) {
        this.connection = connection;
        this.connected = false;
        this.room = null;
        this._profileInternal = null;
        this.id = TOSClient._uuidGen.next();
    }
    get profile() {
        if (this._profileInternal) {
            return {
                displayName: this._profileInternal.displayName,
                avatar: this._profileInternal.avatar,
                color: this._profileInternal.color,
                facebookId: this._profileInternal.facebookId,
                statsTotalGamesPlayed: this._profileInternal.statsTotalGamesPlayed,
                statsBestWPM: this._profileInternal.statsBestWPM
            };
        }
    }
    loadProfile(r) {
        // Loading a default profile
        let savedProfile = database_1.DB.profiles.by("facebookId", r.facebookId);
        if (r.facebookId) {
            // Inserting only of there's a facebook profile
            if (savedProfile) {
                // Profile was stored
                this._profileInternal = savedProfile;
                // Facebook avatar is updated at each login
                this.updateProfile({ avatar: r.avatar }, false);
            }
            else {
                // Create a new profile
                this._profileInternal = database_1.DB.profiles.insert(TOSClient.createDefaultProfile(r));
            }
        }
        else {
            // This is gonna be volatile: when the user logs off data is lost
            this._profileInternal = TOSClient.createDefaultProfile(r);
        }
    }
    updateProfile(data, sendUpdate = true) {
        for (let prop in data)
            this._profileInternal[prop] = data[prop];
        if (sendUpdate) {
            this.send({
                type: com_interface_1.EResponseType.ProfileUpdated,
                data: data
            });
        }
        // Update the database only of the profile is stored
        if (this._profileInternal.facebookId)
            database_1.DB.profiles.update(this._profileInternal);
    }
    subscribe(evt, handler) {
        this.connection.addListener(evt, handler);
        return {
            unsubscribe: () => { this.connection.removeListener(evt, handler); }
        };
    }
    send(resp) {
        this.connection.send(JSON.stringify(resp), err => {
            if (err)
                console.error(err.message);
        });
    }
    sendError(requestType, description) {
        let r = {
            type: com_interface_1.EResponseType.Error,
            data: {
                requestType: requestType,
                description: description
            }
        };
        console.error(description);
        this.send(r);
    }
    toString() {
        return `${this.id}:${this.profile.displayName}`;
    }
    static createDefaultProfile(r) {
        return {
            facebookId: r.facebookId,
            displayName: name_generator_1.NameGenerator.generate(),
            avatar: r.avatar,
            color: color_palette_1.ColorPalette.colors[Math.floor(Math.random() * color_palette_1.ColorPalette.colors.length)],
            statsTotalGamesPlayed: 0,
            statsBestWPM: 0
        };
    }
}
exports.TOSClient = TOSClient;
TOSClient._uuidGen = new uid_1.UID(16);
