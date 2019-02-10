import { UID } from './util/uid';
import { IProfile, IConnectRequestData, IResponse, ERequestType, EResponseType, IProfileUpdatedResponseData, IProfileOptional } from './com-interface';
import { TOSRoom } from './room';
import * as WebSocket from 'ws';
import { DB } from './services/database';
import { ColorPalette } from './services/color-palette';
import { Cars } from './services/cars';
import { NameGenerator } from './util/name-generator';

export interface ITOSClientSubscription {
    unsubscribe(): void;
}

export class TOSClient {
    private static _uuidGen: UID = new UID(16);
    readonly id: string;

    connected: boolean = false;

    room: TOSRoom = null;

    get profile(): IProfile {
        if (this._profileInternal) {
            return {
                displayName: this._profileInternal.displayName,
                avatar: this._profileInternal.avatar,
                color: this._profileInternal.color,
                facebookId: this._profileInternal.facebookId,
                carModel: this._profileInternal.carModel,
                unlockedCars: this._profileInternal.unlockedCars.slice(0),
                unlockedColors: this._profileInternal.unlockedColors.slice(0),

                statsTotalGamesPlayed: this._profileInternal.statsTotalGamesPlayed,
                statsBestWPM: this._profileInternal.statsBestWPM

            }
        }
    }

    constructor(readonly connection: WebSocket) { this.id = TOSClient._uuidGen.next(); }

    private _profileInternal: IProfile = null;

    loadProfile(r: IConnectRequestData) {
        // Loading a default profile

        let savedProfile = DB.profiles.by("facebookId", r.facebookId);

        if (r.facebookId) {
            // Inserting only of there's a facebook profile
            if (savedProfile) {
                // Profile was stored
                this._profileInternal = savedProfile;
                // Facebook avatar is updated at each login
                this.updateProfile({ avatar: r.avatar }, false);
            } else {
                // Create a new profile
                this._profileInternal = DB.profiles.insert(TOSClient.createDefaultProfile(r));
            }
        } else {
            // This is gonna be volatile: when the user logs off data is lost
            this._profileInternal = TOSClient.createDefaultProfile(r);
        }
    }

    updateProfile(data: IProfileOptional, sendUpdate: boolean = true) {

        for (let prop in data)
            this._profileInternal[prop] = data[prop];

        if (sendUpdate) {
            this.send({
                type: EResponseType.ProfileUpdated,
                data: <IProfileUpdatedResponseData>data
            });
        }

        // Update the database only of the profile is stored
        if (this._profileInternal.facebookId)
            DB.profiles.update(this._profileInternal);
    }

    subscribe(evt: "message", handler: (data: WebSocket.Data) => void): ITOSClientSubscription;
    subscribe(evt: "close", handler: (code: number, descr: string) => void): ITOSClientSubscription;
    subscribe(evt: string, handler: any): ITOSClientSubscription {
        this.connection.addListener(evt, handler);
        return {
            unsubscribe: () => { this.connection.removeListener(evt, handler); }
        }
    }

    send(resp: IResponse): void {
        this.connection.send(JSON.stringify(resp), err => {
            if (err)
                console.error(err.message)
        });
    }
    sendError(requestType: ERequestType, description: string): void {
        let r: IResponse = {
            type: EResponseType.Error,
            data: {
                requestType: requestType,
                description: description
            }
        }
        console.error(description);
        this.send(r);
    }
    toString(): string {
        return `${this.id}:${this.profile.displayName}`;
    }

    static createDefaultProfile(r: IConnectRequestData): IProfile {

        let unlockedColors = ColorPalette.colors.slice(0);

        return {
            facebookId: r.facebookId,
            displayName: NameGenerator.generate(),
            avatar: r.avatar,
            color: unlockedColors[Math.floor(Math.random() * unlockedColors.length)],
            carModel: Cars.models[0],
            unlockedCars: Cars.models.slice(0),
            unlockedColors: unlockedColors,

            statsTotalGamesPlayed: 0,
            statsBestWPM: 0
        }
    }

}