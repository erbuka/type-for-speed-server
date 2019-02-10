"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
const com_interface_1 = require("./com-interface");
class TOSMatchMaker {
    constructor(playerCount) {
        this.playerCount = playerCount;
        this.players = new Map();
    }
    addPlayer(player) {
        if (!this.players.has(player.id)) {
            this.players.set(player.id, player);
            this.broadcastMatchmakerInfo();
            return true;
        }
        return false;
    }
    removePlayer(player) {
        if (this.players.has(player.id)) {
            this.players.delete(player.id);
            this.broadcastMatchmakerInfo();
            return true;
        }
        return false;
    }
    createGame() {
        if (this.players.size >= this.playerCount) {
            let gamePlayers = Array.from(this.players.entries()).slice(0, this.playerCount);
            gamePlayers.forEach(p => this.players.delete(p[0]));
            return new game_1.TOSGame(gamePlayers.map(p => p[1]), game_1.EGameType.QuickMatch);
        }
        else {
            return null;
        }
    }
    broadcastMatchmakerInfo() {
        for (let p of this.players.values()) {
            p.send({
                type: com_interface_1.EResponseType.FindMatchUpdate,
                data: null
            });
        }
    }
}
exports.TOSMatchMaker = TOSMatchMaker;
