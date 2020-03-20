import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WordTypingAreaComponent } from './word-typing-area.component';

describe('WordTypingAreaComponent', () => {
  let component: WordTypingAreaComponent;
  let fixture: ComponentFixture<WordTypingAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WordTypingAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordTypingAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
