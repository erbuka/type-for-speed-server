import { EventEmitter, Component, OnInit, HostListener, Output, Input } from '@angular/core';

@Component({
  selector: 'app-word-typing-area',
  templateUrl: './word-typing-area.component.html',
  styleUrls: ['./word-typing-area.component.scss']
})
export class WordTypingAreaComponent implements OnInit {

  @Output("wordTyped") wordTypedEvent: EventEmitter<string> = new EventEmitter();
  @Input() checkAgainst: string = null;
  @Input() enabled: boolean = true;

  currentWord: string = "";

  get correct(): boolean {
    if (this.checkAgainst) {
      return this.checkAgainst.substring(0, this.currentWord.length) === this.currentWord;
    } else {
      return true;
    }
  }


  constructor() { }


  ngOnInit() {
  }



  @HostListener("window:keydown", ['$event'])
  onKeyPress(evt: KeyboardEvent): void {
    if (!this.enabled)
      return;
      
    switch (evt.code) {
      case "Backspace":
        if (this.currentWord.length > 0) {
          this.currentWord = this.currentWord.substring(0, this.currentWord.length - 1)
        }
        break;
      case "Space":
        if (this.currentWord.length > 0) {
          this.wordTypedEvent.emit(this.currentWord);
          this.currentWord = "";
        }
        break;
      default:
        if (evt.key.length === 1) {
          this.currentWord += evt.key;
        }
    }
  }

}
