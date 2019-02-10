import { TOSClient } from "./client";
import { TOSGame, EGameType } from "./game";
import { EResponseType } from "./com-interface";

export class TOSMatchMaker {

    players: Map<string, TOSClient> = new Map();

    constructor(readonly playerCount: number) { }

    addPlayer(player: TOSClient): boolean {
        if (!this.players.has(player.id)) {
            this.players.set(player.id, player);
            this.broadcastMatchmakerInfo();
            return true;
        }
        return false;
    }

    removePlayer(player: TOSClient): boolean {
        if (this.players.has(player.id)) {
            this.players.delete(player.id);
            this.broadcastMatchmakerInfo();
            return true;
        }
        return false;
    }

    createGame(): TOSGame {
        if (this.players.size >= this.playerCount) {
            let gamePlayers = Array.from(this.players.entries()).slice(0, this.playerCount);
            gamePlayers.forEach(p => this.players.delete(p[0]));
            return new TOSGame(gamePlayers.map(p => p[1]), EGameType.QuickMatch);
        } else {
            return null;
        }
    }

    broadcastMatchmakerInfo(): void {
        for (let p of this.players.values()) {
            p.send({
                type: EResponseType.FindMatchUpdate,
                data: null
            })
        }
    }
}