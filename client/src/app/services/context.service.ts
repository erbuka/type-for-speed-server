import { Injectable } from '@angular/core';

export enum EAppScreen {
  Initializing = 99,
  Login = 0,
  MainMenu = 1,
  RoomLobby = 2,
  Game = 3,
  Score = 4,
  MatchMaking = 5,
  Profile = 6
}

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  readonly laneCount = 4;

  get currentAppScreen(): EAppScreen { return this._currentAppScreen; }

  private _currentAppScreen: EAppScreen = EAppScreen.Initializing;

  get laneIndices(): number[] { return this._laneIndices; }

  private _laneIndices: number[] = null;

  gotoScreen(screen: EAppScreen) {
    this._currentAppScreen = screen;
  }

  gotoScreenAsync(screen: EAppScreen) {
    setTimeout(() => this.gotoScreen(screen), 0);
  }

  constructor() {
    this._laneIndices = new Array(this.laneCount);
    for (let i = 0; i < this.laneCount; i++)
      this._laneIndices[i] = i;
  }
}
