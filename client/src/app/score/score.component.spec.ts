import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreComponent } from './score.component';
import { AvatarComponent } from '../ui/avatar/avatar.component';
import { PositionPipe } from '../position.pipe';
import { TimePipe } from '../time.pipe';

describe('ScoreComponent', () => {
  let component: ScoreComponent;
  let fixture: ComponentFixture<ScoreComponent>;

  let numPlayers = 6;

  function* generateScores(): IterableIterator<{ playerId: string, playerName: string, playerAvatar: string, time: number, wordsPerMinute: number }> {
    for (let i = 0; i < numPlayers; i++) {
      yield {
        playerId: i + "",
        playerName: "Player" + (i + 1),
        playerAvatar: "",
        time: 10000 + Math.random() * 20000,
        wordsPerMinute: Math.random() * 120
      }
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScoreComponent, AvatarComponent, PositionPipe, TimePipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {

    let scores = Array.from(generateScores());

    fixture = TestBed.createComponent(ScoreComponent);
    component = fixture.componentInstance;
    component.score = {
      scores: scores
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
