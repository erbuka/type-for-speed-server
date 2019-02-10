"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.namePattern = /^[a-zA-Z\._!\?\$0-9]{2,}$/;
var ERequestType;
(function (ERequestType) {
    // Connection
    ERequestType[ERequestType["Connect"] = 0] = "Connect";
    ERequestType[ERequestType["Heartbeat"] = 1] = "Heartbeat";
    // Profile,
    ERequestType[ERequestType["UpdateProfile"] = 2] = "UpdateProfile";
    // Singleplayer
    ERequestType[ERequestType["CreateSinglePlayer"] = 3] = "CreateSinglePlayer";
    // Rooms
    ERequestType[ERequestType["CreateRoom"] = 4] = "CreateRoom";
    ERequestType[ERequestType["JoinRoom"] = 5] = "JoinRoom";
    ERequestType[ERequestType["LeaveRoom"] = 6] = "LeaveRoom";
    ERequestType[ERequestType["ToggleReady"] = 7] = "ToggleReady";
    // Game
    ERequestType[ERequestType["GameSendWord"] = 8] = "GameSendWord";
    // Matchmaking
    ERequestType[ERequestType["FindMatch"] = 9] = "FindMatch";
    ERequestType[ERequestType["CancelFindMatch"] = 10] = "CancelFindMatch";
    // Other
    ERequestType[ERequestType["Unknown"] = 11] = "Unknown";
})(ERequestType = exports.ERequestType || (exports.ERequestType = {}));
var EResponseType;
(function (EResponseType) {
    // Connection
    EResponseType[EResponseType["Connected"] = 0] = "Connected";
    EResponseType[EResponseType["Disconnected"] = 1] = "Disconnected";
    // Profile,
    EResponseType[EResponseType["ProfileUpdated"] = 2] = "ProfileUpdated";
    // Rooms
    EResponseType[EResponseType["JoinedRoom"] = 3] = "JoinedRoom";
    EResponseType[EResponseType["LeftRoom"] = 4] = "LeftRoom";
    EResponseType[EResponseType["RoomInfo"] = 5] = "RoomInfo";
    // Matchmaking
    EResponseType[EResponseType["JoinedFindMatch"] = 6] = "JoinedFindMatch";
    EResponseType[EResponseType["LeftFindMatch"] = 7] = "LeftFindMatch";
    EResponseType[EResponseType["FindMatchUpdate"] = 8] = "FindMatchUpdate";
    // Game
    EResponseType[EResponseType["GameStarting"] = 9] = "GameStarting";
    EResponseType[EResponseType["GameUpdatePlayer"] = 10] = "GameUpdatePlayer";
    EResponseType[EResponseType["GameStateUpdate"] = 11] = "GameStateUpdate";
    EResponseType[EResponseType["GameScore"] = 12] = "GameScore";
    EResponseType[EResponseType["GameMessage"] = 13] = "GameMessage";
    // Other
    EResponseType[EResponseType["Error"] = 14] = "Error";
})(EResponseType = exports.EResponseType || (exports.EResponseType = {}));
var EGameMessageType;
(function (EGameMessageType) {
    EGameMessageType[EGameMessageType["GetReady"] = 0] = "GetReady";
    EGameMessageType[EGameMessageType["Go"] = 1] = "Go";
})(EGameMessageType = exports.EGameMessageType || (exports.EGameMessageType = {}));
