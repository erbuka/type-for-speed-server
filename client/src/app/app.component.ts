import { Component, OnInit } from '@angular/core';
import { ClientService } from './services/client.service';
import { IResponse, EResponseType, IErrorResponseData, IRoomInfoResponseData, IGameMessageResponseData, IGameUpdatePlayerResponseData, IGameInfoResponseData, IGameScoreResponseData, IGameStateUpdateResponseData, ERequestType } from './com-interface';
import { animations } from './animations';
import { LocationStrategy, Location, PathLocationStrategy } from '@angular/common';
import { Utility } from './classes/utility';
import { EAppScreen, ContextService } from './services/context.service';
import { HttpClient } from '@angular/common/http';
import { version as AppVersion } from 'package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }],
  styleUrls: ['./app.component.scss'],
  animations: [animations.slide, animations.fade]
})
export class AppComponent implements OnInit {

  appVersion = AppVersion;
  currentRoom: IRoomInfoResponseData = null;
  currentGame: IGameInfoResponseData = null;
  currentScore: IGameScoreResponseData = null;
  errorMessage: string = null;

  get currentScreen(): EAppScreen { return this.context.currentAppScreen; }

  constructor(public clientService: ClientService, public httpClient: HttpClient, public context: ContextService, private location: Location, ) { }

  ngOnInit() {
    this.clientService.subscribe(this.onResponse.bind(this));

    this.clientService.initialize().then(() => {
      this.clientService.autoConnectWithFacebook().then((connected) => {
        if (!connected) {
          this.context.gotoScreen(EAppScreen.Login);
        }
      });
    }).catch(() => {
      this.context.gotoScreen(EAppScreen.Login);
    });

  }

  onResponse(r: IResponse): void {
    switch (r.type) {
      case EResponseType.Connected:
        this.connected();
        break;
      case EResponseType.Disconnected:
        this.context.gotoScreen(EAppScreen.Login);
        break;

      case EResponseType.RoomInfo:
        this.currentRoom = <IRoomInfoResponseData>r.data;
        break;
      case EResponseType.JoinedRoom:
        this.joinedRoom(<IRoomInfoResponseData>r.data);
        break;
      case EResponseType.LeftRoom:
        this.leftRoom();
        break;

      case EResponseType.GameStarting:
        this.gameStarting(<IGameInfoResponseData>r.data);
        break;
      case EResponseType.GameStateUpdate:
        this.gameStateUpdate(<IGameStateUpdateResponseData>r.data);
        break;
      case EResponseType.GameScore:
        this.gameScore(<IGameScoreResponseData>r.data);
        break;
      case EResponseType.GameUpdatePlayer:
        this.gameUpdatePlayer(<IGameUpdatePlayerResponseData>r.data)
        break;

      case EResponseType.JoinedFindMatch:
        this.context.gotoScreen(EAppScreen.MatchMaking);
        break;
      case EResponseType.LeftFindMatch:
        this.context.gotoScreen(EAppScreen.MainMenu);
        break;

      case EResponseType.Error:
        this.error(<IErrorResponseData>r.data);
        break;

      default:
        break;
    }
  }

  connected(): void {
    let params = Utility.parseQueryString(this.location.path());
    if (params.has("join")) {
      this.clientService.send({
        type: ERequestType.JoinRoom,
        data: {
          roomId: params.get("join")
        }
      });
    } else {
      this.context.gotoScreen(EAppScreen.MainMenu);
    }
  }

  gameStateUpdate(data: IGameStateUpdateResponseData) {
    this.currentGame.state = data.state;
  }

  gameScore(data: IGameScoreResponseData): void {
    this.context.gotoScreen(EAppScreen.Score);
    this.currentScore = data;
  }

  gameUpdatePlayer(data: IGameUpdatePlayerResponseData): void {
    if (this.currentGame) {
      let player = this.currentGame.players.find(p => p.id === data.playerId);
      if (player) {
        player.position = data.position;
      }
    }
  }

  gameStarting(data: IGameInfoResponseData): void {
    this.context.gotoScreen(EAppScreen.Game);
    this.currentGame = data;
    this.currentScore = null;
  }

  joinedRoom(data: IRoomInfoResponseData): void {
    this.context.gotoScreen(EAppScreen.RoomLobby);
    this.currentRoom = data;
  }

  leftRoom() {
    this.context.gotoScreen(EAppScreen.MainMenu);
    this.currentRoom = null;
  }

  error(data: IErrorResponseData): void {
    switch (data.requestType) {
      default:
        this.context.gotoScreen(this.clientService.connected ? EAppScreen.MainMenu : EAppScreen.Login);
        break;
    }
    this.errorMessage = data.description;
  }

  onScoreBack(): void {
    this.context.gotoScreen(this.currentRoom ? EAppScreen.RoomLobby : EAppScreen.MainMenu);
    this.currentGame = null;
  }

}
