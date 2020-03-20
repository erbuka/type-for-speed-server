import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RoomLobbyComponent } from './room-lobby/room-lobby.component';
import { GameComponent } from './game/game.component';
import { AvatarComponent } from './ui/avatar/avatar.component';
import { ScoreComponent } from './score/score.component';
import { PositionPipe } from './position.pipe';
import { TimePipe } from './time.pipe';
import { UserBarComponent } from './ui/user-bar/user-bar.component';
import { WordTypingAreaComponent } from './ui/word-typing-area/word-typing-area.component';
import { ErrorDialogComponent } from './ui/error-dialog/error-dialog.component';
import { MatchmakingComponent } from './matchmaking/matchmaking.component';
import { ProfileComponent } from './profile/profile.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ThreeGameRendererComponent } from './three-game-renderer/three-game-renderer.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RoomLobbyComponent,
    GameComponent,
    AvatarComponent,
    ScoreComponent,
    PositionPipe,
    TimePipe,
    UserBarComponent,
    WordTypingAreaComponent,
    ErrorDialogComponent,
    MatchmakingComponent,
    ProfileComponent,
    MainMenuComponent,
    ThreeGameRendererComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
