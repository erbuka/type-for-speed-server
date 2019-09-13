"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const com_interface_1 = require("./com-interface");
const room_1 = require("./room");
const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const ejs = require("ejs");
const matchmaker_1 = require("./matchmaker");
const client_1 = require("./client");
const text_broker_1 = require("./services/text-broker");
const database_1 = require("./services/database");
const cars_1 = require("./services/cars");
const color_palette_1 = require("./services/color-palette");
const game_1 = require("./game");
const MM_PLAYER_COUNT = 4;
class TOSServer {
    constructor(port, auth) {
        this.port = port;
        this.auth = auth;
        this.rooms = new Map();
        this.clients = new Map();
        this.matchMaker = new matchmaker_1.TOSMatchMaker(MM_PLAYER_COUNT);
        this._expressApp = null;
        this._httpServer = null;
        this._wsServer = null;
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
            }
            else {
                next();
            }
        });
        this._expressApp.get("/admin", (req, res) => {
            res.render("status.ejs", { server: this });
        });
        this._expressApp.get("/admin/restart", (req, res) => {
            this.restart().then(() => res.redirect("/admin"));
        });
        this._expressApp.get("/admin/stop", (req, res) => {
            this.stop();
            res.redirect("/admin");
        });
        this._httpServer.listen(this.port);
        console.log(`HTTP Server listening on port ${this.port}`);
    }
    get isRunning() { return this._wsServer !== null; }
    stop() {
        if (this.isRunning) {
            this.clients = new Map();
            this.rooms = new Map();
            this.matchMaker = new matchmaker_1.TOSMatchMaker(MM_PLAYER_COUNT);
            this._wsServer.close();
            this._wsServer = null;
            console.log("Game server has been stopped");
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () { yield this.restart(); });
    }
    restart() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stop();
            yield text_broker_1.TextBroker.initialize();
            yield database_1.DB.initialize();
            yield cars_1.Cars.initialize();
            yield color_palette_1.ColorPalette.initialize();
            this._wsServer = new WebSocket.Server({ server: this._httpServer });
            this._wsServer.on("connection", socket => this.accept(socket));
            console.log("Game server has been started");
        });
    }
    accept(socket) {
        let client = new client_1.TOSClient(socket);
        socket.on("message", (data) => {
            this.onMessage(data, client);
        });
        socket.on("close", () => {
            this.onClose(client);
        });
    }
    static getRequest(data) {
        return JSON.parse(data.toString());
    }
    static getRequestOfType(type, data) {
        let request = JSON.parse(data.toString());
        if (!(request.type === type)) {
            throw new Error(`Wrong request type: expected ${type}, found ${request.type}`);
        }
        return request;
    }
    onMessage(data, client) {
        let request = TOSServer.getRequest(data);
        switch (request.type) {
            case com_interface_1.ERequestType.Connect:
                this.handleConnectRequest(request, client);
                break;
            case com_interface_1.ERequestType.CreateRoom:
                this.handleCreateRoomRequest(request, client);
                break;
            case com_interface_1.ERequestType.JoinRoom:
                this.handleJoinRoomRequest(request, client);
                break;
            case com_interface_1.ERequestType.LeaveRoom:
                this.handleLeaveRoomRequest(request, client);
                break;
            case com_interface_1.ERequestType.ToggleReady:
                this.handleToggleReadyRequest(request, client);
                break;
            case com_interface_1.ERequestType.FindMatch:
                this.handleFindMatchRequest(request, client);
                break;
            case com_interface_1.ERequestType.CancelFindMatch:
                this.handleCancelFindMatchRequest(request, client);
                break;
            case com_interface_1.ERequestType.CreateSinglePlayer:
                this.handleCreateSinglePlayerRequest(request, client);
                break;
            case com_interface_1.ERequestType.UpdateProfile:
                this.handleUpdateProfileRequest(request, client);
                break;
        }
    }
    onClose(client) {
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
    handleUpdateProfileRequest(r, client) {
        let data = r.data;
        // Run the checks
        try {
            let responseData = {};
            if (data.color && typeof data.color === "string") {
                if (client.profile.unlockedColors.indexOf(data.color) == -1)
                    throw ("Color is locked");
                responseData.color = data.color;
            }
            if (data.carModel && typeof data.carModel === "string") {
                if (client.profile.unlockedCars.indexOf(data.carModel) == -1)
                    throw ("Car is locked");
                responseData.carModel = data.carModel;
            }
            if (data.displayName && typeof data.displayName === "string") {
                if (!com_interface_1.namePattern.test(data.displayName.trim()))
                    throw ("Display name is too short");
                responseData.displayName = data.displayName.trim();
            }
            client.updateProfile(responseData);
        }
        catch (e) {
            client.sendError(r.type, "Bad request: " + e);
        }
    }
    handleCreateSinglePlayerRequest(r, client) {
        let game = new game_1.TOSGame([client], game_1.EGameType.Custom);
        game.start();
    }
    handleCancelFindMatchRequest(r, client) {
        if (this.matchMaker.removePlayer(client)) {
            client.send({
                type: com_interface_1.EResponseType.LeftFindMatch,
                data: null
            });
        }
    }
    handleFindMatchRequest(r, client) {
        if (this.matchMaker.addPlayer(client)) {
            let game = this.matchMaker.createGame();
            if (game) {
                game.start();
            }
            else {
                client.send({
                    type: com_interface_1.EResponseType.JoinedFindMatch,
                    data: null
                });
            }
        }
    }
    handleToggleReadyRequest(r, client) {
        let room = client.room;
        if (!room) {
            client.sendError(r.type, `You are not in a room`);
            return;
        }
        room.toggleReady(client);
    }
    handleJoinRoomRequest(r, client) {
        let roomData = r.data;
        let roomId = roomData.roomId.toUpperCase();
        if (!this.rooms.has(roomId)) {
            client.sendError(r.type, `Room ${roomId} doesn't exist`);
            return;
        }
        let room = this.rooms.get(roomId);
        if (room.addClient(client)) {
            client.send({
                type: com_interface_1.EResponseType.JoinedRoom,
                data: room.getResponseInfo()
            });
        }
        else {
            client.sendError(r.type, `Room ${room.id} is full`);
        }
    }
    handleLeaveRoomRequest(r, client) {
        if (client.room) {
            let room = client.room;
            room.removeClient(client);
            client.send({
                type: com_interface_1.EResponseType.LeftRoom,
                data: null
            });
            if (room.clients.size === 0) {
                this.rooms.delete(room.id);
                console.log(`Empty room ${room.id} has been deleted`);
            }
        }
    }
    handleCreateRoomRequest(r, client) {
        let data = r.data;
        let room = new room_1.TOSRoom(data.playersCount);
        room.addClient(client);
        this.rooms.set(room.id, room);
        client.send({
            type: com_interface_1.EResponseType.JoinedRoom,
            data: room.getResponseInfo()
        });
        console.log(`Room created: ${room.id}`);
    }
    handleConnectRequest(r, client) {
        let data = r.data;
        client.connected = true;
        client.loadProfile(data);
        this.clients.set(client.id, client);
        client.send({
            type: com_interface_1.EResponseType.Connected,
            data: {
                id: client.id,
                profile: client.profile,
                carModelsPool: cars_1.Cars.models,
                colorPalette: color_palette_1.ColorPalette.colors
            }
        });
        console.log(`Client connected: ${client.toString()}`);
    }
}
exports.TOSServer = TOSServer;
