import { IRequest, ERequestType, IConnectRequestData, EResponseType, IJoinRoomData, ICreateRoomRequestData, IConnectedResponseData, IUpdateProfileRequestData, IProfileUpdatedResponseData, IProfileOptional, namePattern } from './com-interface';
import { TOSRoom } from "./room";
import * as WebSocket from 'ws';
import * as http from "http";
import * as express from 'express';
import * as ejs from 'ejs';
import { TOSMatchMaker } from './matchmaker';
import { TOSClient } from './client';
import { TextBroker } from './services/text-broker';
import { DB } from './services/database';
import { ColorPalette } from './services/color-palette';
import { TOSGame, EGameType } from './game';


const MM_PLAYER_COUNT = 4;

export class TOSServer {

    rooms: Map<string, TOSRoom> = new Map();
    clients: Map<string, TOSClient> = new Map();
    matchMaker: TOSMatchMaker = new TOSMatchMaker(MM_PLAYER_COUNT);

    private _expressApp: express.Application = null;
    private _httpServer: http.Server = null;
    private _wsServer: WebSocket.Server = null;

    constructor(readonly port: number, readonly auth: string) {
        this._expressApp = express();
        this._httpServer = http.createServer(this._expressApp);

        this._expressApp.engine("ejs", ejs.renderFile);
        this._expressApp.set("views", "./views");

        this._expressApp.use(express.static("./client"));

        this._expressApp.get("/admin*", (req, res, next) => {
            let authorization = req.headers["authorization"];
            if (!authorization || authorization !== this.auth) {
                res.setHeader("WWW-Authenticate", "Basic");
                res.sendStatus(401);
                res.send();
            } else {
                next();
            }
        })

        this._expressApp.get("/admin", (req, res) => {
            res.render("status.ejs", { server: this });
        });
        this._expressApp.get("/admin/restart", (req, res) => {
            this.restart().then(() => res.redirect("/admin"));
        });
        this._expressApp.get("/admin/stop", (req, res) => {
            this.stop();
            res.redirect("/admin");
        })

        this._httpServer.listen(this.port);

        console.log(`HTTP Server listening on port ${this.port}`);

    }

    get isRunning(): boolean { return this._wsServer !== null; }

    stop() {
        if (this.isRunning) {

            this.clients = new Map();
            this.rooms = new Map();
            this.matchMaker = new TOSMatchMaker(MM_PLAYER_COUNT);

            this._wsServer.close();

            this._wsServer = null;

            console.log("Game server has been stopped");

        }
    }

    async start() { await this.restart(); }
    async restart(): Promise<void> {

        this.stop();

        await TextBroker.initialize();
        await DB.initialize();
        await ColorPalette.initialize();

        this._wsServer = new WebSocket.Server({ server: this._httpServer });
        this._wsServer.on("connection", socket => this.accept(socket));

        console.log("Game server has been started");
    }


    accept(socket: WebSocket): void {

        let client = new TOSClient(socket);

        socket.on("message", (data: WebSocket.Data) => {
            this.onMessage(data, client);
        });
        socket.on("close", () => {
            this.onClose(client);
        });
    }

    static getRequest(data: WebSocket.Data): IRequest {
        return JSON.parse(data.toString());
    }

    static getRequestOfType(type: ERequestType, data: WebSocket.Data): IRequest {
        let request = <IRequest>JSON.parse(data.toString());
        if (!(request.type === type)) {
            throw new Error(`Wrong request type: expected ${type}, found ${request.type}`);
        }
        return request;
    }


    private onMessage(data: WebSocket.Data, client: TOSClient): void {
        let request = TOSServer.getRequest(data);

        switch (request.type) {
            case ERequestType.Connect:
                this.handleConnectRequest(request, client);
                break;
            case ERequestType.CreateRoom:
                this.handleCreateRoomRequest(request, client);
                break;
            case ERequestType.JoinRoom:
                this.handleJoinRoomRequest(request, client);
                break;
            case ERequestType.LeaveRoom:
                this.handleLeaveRoomRequest(request, client);
                break;
            case ERequestType.ToggleReady:
                this.handleToggleReadyRequest(request, client);
                break;
            case ERequestType.FindMatch:
                this.handleFindMatchRequest(request, client);
                break;
            case ERequestType.CancelFindMatch:
                this.handleCancelFindMatchRequest(request, client);
                break;
            case ERequestType.CreateSinglePlayer:
                this.handleCreateSinglePlayerRequest(request, client);
                break;
            case ERequestType.UpdateProfile:
                this.handleUpdateProfileRequest(request, client);
                break;
        }
    }

    private onClose(client: TOSClient): void {
        if (client.room) {
            let room = client.room;
            room.removeClient(client);

            if (room.clients.size === 0) {
                this.rooms.delete(room.id);
                console.log(`Empty room ${room.id} has been deleted`);
            }
        }

        this.matchMaker.removePlayer(client);

        this.clients.delete(client.id);
        client.connected = false;
        console.log(`Client disconnected: ${client.toString()}`);
    }


    private handleUpdateProfileRequest(r: IRequest, client: TOSClient) {
        let data = <IUpdateProfileRequestData>r.data;

        // Run the checks
        try {

            let responseData: IProfileOptional = {};


            if (data.color && typeof data.color === "string") {
                if (ColorPalette.colors.indexOf(data.color) == -1)
                    throw ("Not a valid color");
                responseData.color = data.color;
            }

            if (data.displayName && typeof data.displayName === "string") {

                if (!namePattern.test(data.displayName.trim()))
                    throw ("Display name is too short")
                responseData.displayName = data.displayName.trim();
            }


            client.updateProfile(responseData);

        }
        catch (e) {
            client.sendError(r.type, "Bad request: " + e);
        }
    }

    private handleCreateSinglePlayerRequest(r: IRequest, client: TOSClient) {
        let game = new TOSGame([client], EGameType.Custom);
        game.start();
    }

    private handleCancelFindMatchRequest(r: IRequest, client: TOSClient) {
        if (this.matchMaker.removePlayer(client)) {
            client.send({
                type: EResponseType.LeftFindMatch,
                data: null
            })
        }
    }

    private handleFindMatchRequest(r: IRequest, client: TOSClient) {
        if (this.matchMaker.addPlayer(client)) {

            let game = this.matchMaker.createGame();

            if (game) {
                game.start();
            } else {
                client.send({
                    type: EResponseType.JoinedFindMatch,
                    data: null
                });
            }

        }
    }

    private handleToggleReadyRequest(r: IRequest, client: TOSClient) {
        let room = client.room;
        if (!room) {
            client.sendError(r.type, `You are not in a room`);
            return;
        }
        room.toggleReady(client);
    }

    private handleJoinRoomRequest(r: IRequest, client: TOSClient) {
        let roomData = <IJoinRoomData>r.data;
        let roomId = roomData.roomId.toUpperCase();
        if (!this.rooms.has(roomId)) {
            client.sendError(r.type, `Room ${roomId} doesn't exist`);
            return;
        }


        let room = this.rooms.get(roomId);
        if (room.addClient(client)) {
            client.send({
                type: EResponseType.JoinedRoom,
                data: room.getResponseInfo()
            });
        } else {
            client.sendError(r.type, `Room ${room.id} is full`);
        }
    }


    private handleLeaveRoomRequest(r: IRequest, client: TOSClient) {
        if (client.room) {
            let room = client.room;
            room.removeClient(client);

            client.send({
                type: EResponseType.LeftRoom,
                data: null
            });

            if (room.clients.size === 0) {
                this.rooms.delete(room.id);
                console.log(`Empty room ${room.id} has been deleted`);
            }

        }
    }

    private handleCreateRoomRequest(r: IRequest, client: TOSClient) {
        let data = <ICreateRoomRequestData>r.data;
        let room = new TOSRoom(data.playersCount);

        room.addClient(client);
        this.rooms.set(room.id, room);
        client.send({
            type: EResponseType.JoinedRoom,
            data: room.getResponseInfo()
        });
        console.log(`Room created: ${room.id}`);
    }


    private handleConnectRequest(r: IRequest, client: TOSClient): void {
        let data = (<IConnectRequestData>r.data);
        client.connected = true;
        client.loadProfile(data);
        this.clients.set(client.id, client);
        client.send({
            type: EResponseType.Connected,
            data: <IConnectedResponseData>{
                id: client.id,
                profile: client.profile,
                colorPalette: ColorPalette.colors
            }
        });
        console.log(`Client connected: ${client.toString()}`);
    }

}
