export const namePattern: RegExp = /^[a-zA-Z\._!\?\$0-9]{2,}$/;

export enum ERequestType {
    // Connection
    Connect, Heartbeat,
    // Profile,
    UpdateProfile,
    // Singleplayer
    CreateSinglePlayer,
    // Rooms
    CreateRoom, JoinRoom, LeaveRoom, ToggleReady,
    // Game
    GameSendWord,
    // Matchmaking
    FindMatch, CancelFindMatch,
    // Other
    Unknown
}


export enum EResponseType {
    // Connection
    Connected, Disconnected,
    // Profile,
    ProfileUpdated,
    // Rooms
    JoinedRoom, LeftRoom, RoomInfo,
    // Matchmaking
    JoinedFindMatch, LeftFindMatch, FindMatchUpdate,
    // Game
    GameStarting, GameUpdatePlayer, GameStateUpdate, GameScore, GameMessage,
    // Other
    Error
}


export enum EGameMessageType {
    GetReady, Go
}

export interface IRequest {
    type: ERequestType;
    data: IConnectRequestData | IJoinRoomData | IGameSendWordRequestData | ICreateRoomRequestData | IUpdateProfileRequestData
}

export interface IResponse {
    type: EResponseType;
    data: IConnectedResponseData | IRoomInfoResponseData | IErrorResponseData | IGameInfoResponseData |
    IGameMessageResponseData | IGameUpdatePlayerResponseData | IGameScoreResponseData | IGameStateUpdateResponseData |
    IFindMatchInfo | IProfileUpdatedResponseData
}

/* Common */

export interface IGameState {
    started: boolean;
    over: boolean;
}

export interface IProfile {
    displayName: string;
    color: string;
    avatar: string;
    facebookId: string;
    carModel: string;
    unlockedCars: string[];
    unlockedColors: string[];

    statsTotalGamesPlayed: number;
    statsBestWPM: number;
}

export type IProfileOptional = { [key in keyof IProfile]?: any };

/* Requests */
export interface IConnectRequestData {
    facebookId: string;
    avatar: string;
}

export interface IJoinRoomData {
    roomId: string;
}

export interface IGameSendWordRequestData {
    word: string;
}

export interface ICreateRoomRequestData {
    playersCount: number;
}

export interface IUpdateProfileRequestData {
    displayName?: string;
    color?: string;
    carModel?: string;
}

/* Responses */

export type IProfileUpdatedResponseData = IProfileOptional;

export interface IConnectedResponseData {
    id: string;
    profile: IProfile;
    carModelsPool: string[];
    colorPalette: string[];
}

export interface IRoomInfoResponseData {
    roomId: string;
    size: number;
    clients: { id: string, name: string, color: string, avatar: string, ready: boolean }[];
}

export interface IErrorResponseData {
    requestType: ERequestType;
    description: string;
}

export interface IGameStateUpdateResponseData {
    state: IGameState;
}

export interface IGameInfoResponseData {
    playersCount: number;
    players: {
        id: string,
        name: string,
        color: string,
        avatar: string,
        carModel: string,
        position: number
    }[];
    text: string[],
    state: IGameState;
    textSource: string
}

export interface IGameUpdatePlayerResponseData {
    playerId: string;
    position: number;
}

export interface IGameScoreResponseData {
    scores: {
        playerId: string;
        playerName: string;
        playerColor: string;
        playerAvatar: string;
        accuracy?: number;
        time?: number;
        wordsPerMinute?: number;
    }[]
}

export interface IGameMessageResponseData {
    type: EGameMessageType;
    text: string;
    durationMillis: number;
}

export interface IFindMatchInfo {

}
