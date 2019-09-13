import { TOSServer } from "./server";
import * as WebSocket from 'ws';
import { IRequest, ERequestType, IGameInfoResponseData, EResponseType, IResponse, EGameMessageType, IGameSendWordRequestData, IGameScoreResponseData, IProfileOptional } from './com-interface';
import { TextBroker, IText } from "./services/text-broker";
import { ITOSClientSubscription, TOSClient } from "./client";


export enum EGameType {
    Custom,
    QuickMatch
}

class TOSGamePlayer {
    position: number = 0;
    get endTime(): number { return this._endTime; }
    get arrived(): boolean { return this._arrived; }
    get accuracy(): number { return this._correctWords / this._wordsTyped * 100 }
    subscriptions: ITOSClientSubscription[] = [];

    private _endTime: number = 0;
    private _arrived: boolean = false;
    private _wordsTyped: number = 0;
    private _correctWords: number = 0;

    constructor(public client: TOSClient) { }

    unsubscribe(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];
    }

    wordTyped(correct: boolean): void {
        this._wordsTyped++;
        if (correct)
            this._correctWords++;
    }

    arrival(): void {
        this._endTime = new Date().getTime();
        this._arrived = true;
    }
}



export class TOSGame {

    private _startTime: number = 0;
    private _started: boolean = false;
    private _ended: boolean = false;
    private _players: Map<string, TOSGamePlayer> = new Map();
    private _gameText: IText = null;

    constructor(clients: TOSClient[], public gameType: EGameType) {
        clients.forEach(c => this._players.set(
            c.id,
            new TOSGamePlayer(c)
        ));
    }

    start(): void {

        // Add message listeners
        for (let c of this._players.values()) {
            let onMessageListener = (data: WebSocket.Data) => { this.onMessage(data, c); };
            let onCloseListener = () => { this.onClose(c); };
            c.subscriptions.push(c.client.subscribe("message", onMessageListener));
            c.subscriptions.push(c.client.subscribe("close", onCloseListener));
        }

        // Init game code and send clients info
        TextBroker.getText().then((text: IText) => {
            this._gameText = text;
            this.initialize();
        });
    }

    private initialize(): void {

        let gameData: IGameInfoResponseData = {
            playersCount: this._players.size,
            players: Array.from(this._players.values()).map(c => {
                return {
                    id: c.client.id,
                    name: c.client.profile.displayName,
                    color: c.client.profile.color,
                    avatar: c.client.profile.avatar,
                    position: c.position
                }
            }),
            state: { started: false, over: false },
            text: this._gameText.text,
            textSource: this._gameText.source
        }

        // Send the game data
        this.broadcast({
            type: EResponseType.GameStarting,
            data: gameData
        });

        // Send warmup message

        setTimeout(() => {
            this.broadcast({
                type: EResponseType.GameMessage,
                data: {
                    type: EGameMessageType.GetReady,
                    text: "Get Ready",
                    durationMillis: 2000
                }
            });
        }, 100);

        setTimeout(() => {
            this._started = true;
            this._startTime = new Date().getTime();

            this.broadcast({
                type: EResponseType.GameStateUpdate,
                data: {
                    state: {
                        started: true,
                        over: false
                    }
                }
            });

            this.broadcast({
                type: EResponseType.GameMessage,
                data: {
                    type: EGameMessageType.Go,
                    text: "Go!",
                    durationMillis: 500
                }
            });
        }, 4000);

    }

    private onClose(client: TOSGamePlayer): void {
        this.checkGameOver();
    }

    private onMessage(data: WebSocket.Data, client: TOSGamePlayer): void {
        // Ignore messages if game has not started or is already over
        if (!this._started || this._ended)
            return;

        let req = TOSServer.getRequest(data);

        switch (req.type) {
            case ERequestType.GameSendWord:
                let word = (<IGameSendWordRequestData>req.data).word;

                // Cheat for testing
                if (word === "theboss") {
                    client.position = this._gameText.text.length;
                    client.arrival();
                    this.broadcast({
                        type: EResponseType.GameUpdatePlayer,
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
                            type: EResponseType.GameUpdatePlayer,
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

    private checkGameOver(): void {
        if (this.isGameOver()) {

            // Game over condition
            this._ended = true;
            this.broadcast({
                type: EResponseType.GameStateUpdate,
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
                type: EResponseType.GameScore,
                data: scoreData
            });


            // Collect game stats on players' profiles
            this._players.forEach(p => {
                let profile = p.client.profile;
                let profOptional: IProfileOptional = {};

                profOptional.statsTotalGamesPlayed = profile.statsTotalGamesPlayed + 1;

                if (p.arrived) {
                    profOptional.statsBestWPM = Math.max(
                        profile.statsBestWPM,
                        this._gameText.text.length / (p.endTime - this._startTime) * 60000
                    );
                }

                p.client.updateProfile(profOptional);
            });

            this._players.forEach(p => p.unsubscribe());
        }
    }

    private getWinner(): TOSGamePlayer {
        let players = Array.from(this._players.values())
            .filter(p => p.arrived)
            .sort((a, b) => a.endTime - b.endTime);

        return players.length > 0 ? players[0] : null;

    }

    private getScoreData(): IGameScoreResponseData {
        let makeScore = (c: TOSGamePlayer) => {
            if (c.arrived) {
                return {
                    playerId: c.client.id,
                    playerName: c.client.profile.displayName,
                    playerAvatar: c.client.profile.avatar,
                    playerColor: c.client.profile.color,
                    time: c.endTime - this._startTime,
                    accuracy: c.accuracy,
                    wordsPerMinute: this._gameText.text.length / (c.endTime - this._startTime) * 60000
                }
            } else {
                return {
                    playerId: c.client.id,
                    playerName: c.client.profile.displayName,
                    playerAvatar: c.client.profile.avatar,
                    playerColor: c.client.profile.color
                }
            }
        };

        let players = Array.from(this._players.values())
        let scores = players
            .filter(p => p.arrived).sort((a, b) => a.endTime - b.endTime)
            .concat(players.filter(p => !p.arrived))
            .map(c => makeScore(c));

        return {
            scores: scores
        }
    }

    private isGameOver(): boolean {
        for (let c of this._players.values()) {
            if (c.client.connected && c.position < this._gameText.text.length)
                return false;
        }
        return true;
    }

    private broadcast(r: IResponse) {
        this._players.forEach(c => c.client.send(r));
    }
}