import { TOSClient } from "./client";
import { IRoomInfoResponseData, EResponseType } from './com-interface';
import { TOSGame, EGameType } from "./game";
import { UID } from "./util/uid";

interface TOSRoomClient {
    ready: boolean,
    client: TOSClient
};


export class TOSRoom {

    private static _uidGen: UID = new UID(16);

    readonly id: string;
    clients: Map<string, TOSRoomClient> = new Map();

    constructor(readonly numClients: number = 1) {
        this.id = TOSRoom._uidGen.next();
    }

    toggleReady(client: TOSClient): boolean {

        let c = this.clients.get(client.id);
        if (c) {
            c.ready = !c.ready;
            this.broadcastRoomInfo();
            console.log(`Client ${c.client.toString()} (Room ${this.id}) => ready = ${c.ready}`);
            if (this.getClientsAsArray().filter(c => c.ready).length === this.numClients) {
                // All clients ready, game ready to start
                this.startGame();
            }
            return true;
        }
        return false;
    }

    addClient(client: TOSClient): boolean {
        if (!this.clients.has(client.id) && this.clients.size < this.numClients && client.room === null) {
            this.clients.set(client.id, { ready: false, client: client });
            client.room = this;
            console.log(`Client ${client.toString()} joined room ${this.id}`);
            this.broadcastRoomInfo();
            return true;
        }
        return false;
    }

    removeClient(client: TOSClient): boolean {
        if (client.room === this) {
            this.clients.delete(client.id);
            client.room = null;
            console.log(`Client ${client.toString()} has left room ${this.id}`);
            this.broadcastRoomInfo();
            return true;
        }
        return false;
    }

    getResponseInfo(): IRoomInfoResponseData {
        return {
            roomId: this.id,
            size: this.numClients,
            clients: this.getClientsAsArray().map(c => {
                return {
                    id: c.client.id,
                    name: c.client.profile.displayName,
                    color: c.client.profile.color,
                    avatar: c.client.profile.avatar,
                    ready: c.ready
                }
            })
        }
    }

    broadcastRoomInfo(): void {
        for (let c of this.clients.values()) {
            c.client.send({
                type: EResponseType.RoomInfo,
                data: this.getResponseInfo()
            });
        }
    }


    private startGame(): void {
        let game = new TOSGame(this.getClientsAsArray().map(c => c.client), EGameType.Custom);
        this.clients.forEach(c => c.ready = false);
        this.broadcastRoomInfo();
        game.start();
    }

    private getClientsAsArray(): TOSRoomClient[] {
        return Array.from(this.clients.values());
    }
}