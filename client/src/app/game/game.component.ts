import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { IGameInfoResponseData, ERequestType, IGameScoreResponseData, IRequest, IResponse, EResponseType, IGameMessageResponseData } from '../com-interface';
import { ClientService } from '../services/client.service';
import { Unsubscribable } from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

const gameMessageAnimTime = "0.2s";


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [
    trigger("gameMessage", [
      transition(":enter", [
        style({ left: "60%", opacity: 0 }),
        animate(gameMessageAnimTime, style({ left: '50%', opacity: 1 }))
      ]),
      transition(":leave", [
        style({ left: '50%', opacity: 1 }),
        animate(gameMessageAnimTime, style({ left: "40%", opacity: 0 }))
      ]),
    ])
  ]
})
export class GameComponent implements OnInit, OnDestroy {

  @Output("back") backEvent: EventEmitter<void> = new EventEmitter();
  @Input() game: IGameInfoResponseData = null;

  message: string = null;

  private subscription: Unsubscribable = null;
  private messageTimeout: any = null;

  get position(): number {
    return this.game.players.find(p => p.id === this.clientService.id).position;
  }
  get nextWord(): string {
    return this.game.text[this.position];
  }

  constructor(private clientService: ClientService) { }

  ngOnInit() {
    this.subscription = this.clientService.subscribe(this.onRequest.bind(this));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }



  onWordTyped(word: string) {
    this.clientService.send({
      type: ERequestType.GameSendWord,
      data: { word: word }
    });
  }

  getPlayerById(id: string): { id: string, name: string } {
    return this.game.players.find(p => p.id === id);
  }

  private onRequest(r: IResponse) {
    if (r.type === EResponseType.GameMessage) {
      let data = <IGameMessageResponseData>r.data;
      this.message = data.text;
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = setTimeout(() => {
        this.message = null;
        this.messageTimeout = null;
      }, data.durationMillis);
    }
  }

}
