import { Component, OnInit } from '@angular/core';
import { ClientService } from '../services/client.service';
import { ERequestType } from '../com-interface';

@Component({
  selector: 'app-matchmaking',
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit {

  constructor(private clientService: ClientService) { }

  ngOnInit() {
  }

  cancel(): void {
    this.clientService.send({
      type: ERequestType.CancelFindMatch,
      data: null
    });
  }

}
