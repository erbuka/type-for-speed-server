import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IGameScoreResponseData } from '../com-interface';
import { ContextService } from '../services/context.service';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss']
})
export class ScoreComponent implements OnInit {

  @Input() score: IGameScoreResponseData = null;
  @Output("back") backEvent: EventEmitter<void> = new EventEmitter();
  constructor(public context: ContextService) { }
  ngOnInit() { }

}
