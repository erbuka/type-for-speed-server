"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const com_interface_1 = require("./com-interface");
const game_1 = require("./game");
const uid_1 = require("./util/uid");
;
class TOSRoom {
    constructor(numClients = 1) {
        this.numClients = numClients;
        this.clients = new Map();
        this.id = TOSRoom._uidGen.next();
    }
    toggleReady(client) {
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
    addClient(client) {
        if (!this.clients.has(client.id) && this.clients.size < this.numClients && client.room === null) {
            this.clients.set(client.id, { ready: false, client: client });
            client.room = this;
            console.log(`Client ${client.toString()} joined room ${this.id}`);
            this.broadcastRoomInfo();
            return true;
        }
        return false;
    }
    removeClient(client) {
        if (client.room === this) {
            this.clients.delete(client.id);
            client.room = null;
            console.log(`Client ${client.toString()} has left room ${this.id}`);
            this.broadcastRoomInfo();
            return true;
        }
        return false;
    }
    getResponseInfo() {
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
                };
            })
        };
    }
    broadcastRoomInfo() {
        for (let c of this.clients.values()) {
            c.client.send({
                type: com_interface_1.EResponseType.RoomInfo,
                data: this.getResponseInfo()
            });
        }
    }
    startGame() {
        let game = new game_1.TOSGame(this.getClientsAsArray().map(c => c.client), game_1.EGameType.Custom);
        this.clients.forEach(c => c.ready = false);
        this.broadcastRoomInfo();
        game.start();
    }
    getClientsAsArray() {
        return Array.from(this.clients.values());
    }
}
exports.TOSRoom = TOSRoom;
TOSRoom._uidGen = new uid_1.UID(16);
