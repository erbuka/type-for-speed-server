import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ClientService } from '../services/client.service';
import { ERequestType } from '../com-interface';
import { animations } from '../animations';
import { ContextService } from '../services/context.service';

enum MenuSection {
  Main = 0,
  Multiplayer = 1
}

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {


  public currentSection: MenuSection = MenuSection.Main;
  public playersCount: number = 1;

  constructor(public clientService: ClientService, public context: ContextService) { }

  get playersCountText(): string {
    return this.playersCount === 1 ? "Singleplayer" : `${this.playersCount} players`;
  }

  ngOnInit() { }

  practice(): void {
    this.clientService.send({
      type: ERequestType.CreateSinglePlayer,
      data: null
    })
  }

  quickMatch(): void {
    this.clientService.send({
      type: ERequestType.FindMatch,
      data: null
    });
  }


  createRoom(): void {
    this.clientService.send({
      type: ERequestType.CreateRoom,
      data: {
        playersCount: this.playersCount
      }
    });
  }

}
