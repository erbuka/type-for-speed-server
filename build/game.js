"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const com_interface_1 = require("./com-interface");
const text_broker_1 = require("./services/text-broker");
var EGameType;
(function (EGameType) {
    EGameType[EGameType["Custom"] = 0] = "Custom";
    EGameType[EGameType["QuickMatch"] = 1] = "QuickMatch";
})(EGameType = exports.EGameType || (exports.EGameType = {}));
class TOSGamePlayer {
    constructor(client) {
        this.client = client;
        this.position = 0;
        this.subscriptions = [];
        this._endTime = 0;
        this._arrived = false;
        this._wordsTyped = 0;
        this._correctWords = 0;
    }
    get endTime() { return this._endTime; }
    get arrived() { return this._arrived; }
    get accuracy() { return this._correctWords / this._wordsTyped * 100; }
    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];
    }
    wordTyped(correct) {
        this._wordsTyped++;
        if (correct)
            this._correctWords++;
    }
    arrival() {
        this._endTime = new Date().getTime();
        this._arrived = true;
    }
}
class TOSGame {
    constructor(clients, gameType) {
        this.gameType = gameType;
        this._startTime = 0;
        this._started = false;
        this._ended = false;
        this._players = new Map();
        this._gameText = null;
        clients.forEach(c => this._players.set(c.id, new TOSGamePlayer(c)));
    }
    start() {
        // Add message listeners
        for (let c of this._players.values()) {
            let onMessageListener = (data) => { this.onMessage(data, c); };
            let onCloseListener = () => { this.onClose(c); };
            c.subscriptions.push(c.client.subscribe("message", onMessageListener));
            c.subscriptions.push(c.client.subscribe("close", onCloseListener));
        }
        // Init game code and send clients info
        text_broker_1.TextBroker.getText().then((text) => {
            this._gameText = text;
            this.initialize();
        });
    }
    initialize() {
        let gameData = {
            playersCount: this._players.size,
            players: Array.from(this._players.values()).map(c => {
                return {
                    id: c.client.id,
                    name: c.client.profile.displayName,
                    color: c.client.profile.color,
                    avatar: c.client.profile.avatar,
                    position: c.position
                };
            }),
            state: { started: false, over: false },
            text: this._gameText.text,
            textSource: this._gameText.source
        };
        // Send the game data
        this.broadcast({
            type: com_interface_1.EResponseType.GameStarting,
            data: gameData
        });
        // Send warmup message
        setTimeout(() => {
            this.broadcast({
                type: com_interface_1.EResponseType.GameMessage,
                data: {
                    type: com_interface_1.EGameMessageType.GetReady,
                    text: "Get Ready",
                    durationMillis: 2000
                }
            });
        }, 100);
        setTimeout(() => {
            this._started = true;
            this._startTime = new Date().getTime();
            this.broadcast({
                type: com_interface_1.EResponseType.GameStateUpdate,
                data: {
                    state: {
                        started: true,
                        over: false
                    }
                }
            });
            this.broadcast({
                type: com_interface_1.EResponseType.GameMessage,
                data: {
                    type: com_interface_1.EGameMessageType.Go,
                    text: "Go!",
                    durationMillis: 500
                }
            });
        }, 4000);
    }
    onClose(client) {
        this.checkGameOver();
    }
    onMessage(data, client) {
        // Ignore messages if game has not started or is already over
        if (!this._started || this._ended)
            return;
        let req = server_1.TOSServer.getRequest(data);
        switch (req.type) {
            case com_interface_1.ERequestType.GameSendWord:
                let word = req.data.word;
                // Cheat for testing
                if (word === "theboss") {
                    client.position = this._gameText.text.length;
                    client.arrival();
                    this.broadcast({
                        type: com_interface_1.EResponseType.GameUpdatePlayer,
                        data: {
                            playerId: client.client.id,
                            position: client.position
                        }
                    });
                    this.checkGameOver();
                    break;
                }
                // End of cheat
                if (client.position < this._gameText.text.length) {
                    let correct = word === this._gameText.text[client.position];
                    client.wordTyped(correct);
                    if (correct) {
                        client.position++;
                        this.broadcast({
                            type: com_interface_1.EResponseType.GameUpdatePlayer,
                            data: {
                                playerId: client.client.id,
                                position: client.position
                            }
                        });
                        if (client.position === this._gameText.text.length) {
                            client.arrival();
                            this.checkGameOver();
                        }
                    }
                }
                break;
        }
    }
    checkGameOver() {
        if (this.isGameOver()) {
            // Game over condition
            this._ended = true;
            this.broadcast({
                type: com_interface_1.EResponseType.GameStateUpdate,
                data: {
                    state: {
                        started: this._started,
                        over: this._ended
                    }
                }
            });
            // Broadcast scores
            let scoreData = this.getScoreData();
            this.broadcast({
                type: com_interface_1.EResponseType.GameScore,
                data: scoreData
            });
            // Collect game stats on players' profiles
            this._players.forEach(p => {
                let profile = p.client.profile;
                let profOptional = {};
                profOptional.statsTotalGamesPlayed = profile.statsTotalGamesPlayed + 1;
                if (p.arrived) {
                    profOptional.statsBestWPM = Math.max(profile.statsBestWPM, this._gameText.text.length / (p.endTime - this._startTime) * 60000);
                }
                p.client.updateProfile(profOptional);
            });
            this._players.forEach(p => p.unsubscribe());
        }
    }
    getWinner() {
        let players = Array.from(this._players.values())
            .filter(p => p.arrived)
            .sort((a, b) => a.endTime - b.endTime);
        return players.length > 0 ? players[0] : null;
    }
    getScoreData() {
        let makeScore = (c) => {
            if (c.arrived) {
                return {
                    playerId: c.client.id,
                    playerName: c.client.profile.displayName,
                    playerAvatar: c.client.profile.avatar,
                    playerColor: c.client.profile.color,
                    time: c.endTime - this._startTime,
                    accuracy: c.accuracy,
                    wordsPerMinute: this._gameText.text.length / (c.endTime - this._startTime) * 60000
                };
            }
            else {
                return {
                    playerId: c.client.id,
                    playerName: c.client.profile.displayName,
                    playerAvatar: c.client.profile.avatar,
                    playerColor: c.client.profile.color
                };
            }
        };
        let players = Array.from(this._players.values());
        let scores = players
            .filter(p => p.arrived).sort((a, b) => a.endTime - b.endTime)
            .concat(players.filter(p => !p.arrived))
            .map(c => makeScore(c));
        return {
            scores: scores
        };
    }
    isGameOver() {
        for (let c of this._players.values()) {
            if (c.client.connected && c.position < this._gameText.text.length)
                return false;
        }
        return true;
    }
    broadcast(r) {
        this._players.forEach(c => c.client.send(r));
    }
}
exports.TOSGame = TOSGame;
